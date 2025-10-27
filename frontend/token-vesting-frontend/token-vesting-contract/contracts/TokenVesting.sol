// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenVesting
 * @dev A comprehensive token vesting contract for Flare native token (FLR) that allows gradual release over time
 * @author Your Name
 */
contract TokenVesting is Ownable, ReentrancyGuard {

    // Events
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 duration,
        uint256 cliff
    );
    
    event TokensReleased(
        address indexed beneficiary,
        uint256 amount
    );
    
    event VestingScheduleRevoked(
        address indexed beneficiary
    );

    // Struct to hold vesting schedule information
    struct VestingSchedule {
        bool initialized;           // Whether the vesting schedule is initialized
        bool revocable;            // Whether the vesting schedule can be revoked
        uint256 totalAmount;        // Total amount of tokens to be vested
        uint256 startTime;          // Start time of the vesting period
        uint256 duration;           // Duration of the vesting period in seconds
        uint256 cliff;              // Cliff period in seconds
        uint256 released;           // Amount of tokens already released
        bool revoked;               // Whether the vesting schedule has been revoked
    }

    // Mapping from beneficiary address to vesting schedule
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Mapping to track if a vesting schedule exists for a beneficiary
    mapping(address => bool) public hasVestingSchedule;
    
    // Array to keep track of all beneficiaries (for enumeration)
    address[] public beneficiaries;
    mapping(address => bool) public isBeneficiary;

    // Fee configuration
    uint256 public setupFeePercentage = 100; // 1% (in basis points)
    uint256 public constant BASIS_POINTS = 10000;
    
    // Fee recipient
    address public feeRecipient;

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "TokenVesting: fee recipient cannot be zero address");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Creates a new vesting schedule for a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @param _totalAmount Total amount of FLR tokens to be vested
     * @param _startTime Start time of the vesting period
     * @param _duration Duration of the vesting period in seconds
     * @param _cliff Cliff period in seconds
     * @param _revocable Whether the vesting schedule can be revoked
     */
    function createVestingSchedule(
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _startTime,
        uint256 _duration,
        uint256 _cliff,
        bool _revocable
    ) external payable onlyOwner {
        require(_beneficiary != address(0), "TokenVesting: beneficiary cannot be zero address");
        require(_totalAmount > 0, "TokenVesting: total amount must be greater than 0");
        require(_duration > 0, "TokenVesting: duration must be greater than 0");
        require(_cliff <= _duration, "TokenVesting: cliff must be less than or equal to duration");
        require(!hasVestingSchedule[_beneficiary], "TokenVesting: vesting schedule already exists");
        require(msg.value >= _totalAmount, "TokenVesting: insufficient FLR sent");

        // Calculate setup fee
        uint256 setupFee = (_totalAmount * setupFeePercentage) / BASIS_POINTS;
        uint256 vestingAmount = _totalAmount - setupFee;

        // Transfer setup fee to fee recipient
        if (setupFee > 0) {
            payable(feeRecipient).transfer(setupFee);
        }

        // Create vesting schedule
        vestingSchedules[_beneficiary] = VestingSchedule(
            true,
            _revocable,
            vestingAmount,
            _startTime,
            _duration,
            _cliff,
            0,
            false
        );

        hasVestingSchedule[_beneficiary] = true;

        // Add to beneficiaries list if not already present
        if (!isBeneficiary[_beneficiary]) {
            beneficiaries.push(_beneficiary);
            isBeneficiary[_beneficiary] = true;
        }

        emit VestingScheduleCreated(
            _beneficiary,
            vestingAmount,
            _startTime,
            _duration,
            _cliff
        );
    }

    /**
     * @dev Releases vested FLR tokens to the beneficiary
     */
    function release() external nonReentrant {
        require(hasVestingSchedule[msg.sender], "TokenVesting: no vesting schedule found");
        
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.initialized, "TokenVesting: vesting schedule not initialized");
        require(!schedule.revoked, "TokenVesting: vesting schedule has been revoked");

        uint256 vestedAmount = getVestedAmount(msg.sender);
        uint256 releasableAmount = vestedAmount - schedule.released;

        require(releasableAmount > 0, "TokenVesting: no tokens available for release");
        require(address(this).balance >= releasableAmount, "TokenVesting: insufficient contract balance");

        schedule.released += releasableAmount;
        payable(msg.sender).transfer(releasableAmount);

        emit TokensReleased(msg.sender, releasableAmount);
    }

    /**
     * @dev Revokes a vesting schedule (only if revocable)
     * @param _beneficiary Address of the beneficiary
     */
    function revokeVestingSchedule(address _beneficiary) external onlyOwner {
        require(hasVestingSchedule[_beneficiary], "TokenVesting: no vesting schedule found");
        
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        require(schedule.initialized, "TokenVesting: vesting schedule not initialized");
        require(schedule.revocable, "TokenVesting: vesting schedule is not revocable");
        require(!schedule.revoked, "TokenVesting: vesting schedule already revoked");

        uint256 unreleasedAmount = schedule.totalAmount - schedule.released;

        schedule.revoked = true;

        if (unreleasedAmount > 0) {
            payable(owner()).transfer(unreleasedAmount);
        }

        emit VestingScheduleRevoked(_beneficiary);
    }

    /**
     * @dev Calculates the amount of FLR tokens that have vested for a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @return Amount of tokens that have vested
     */
    function getVestedAmount(address _beneficiary) public view returns (uint256) {
        require(hasVestingSchedule[_beneficiary], "TokenVesting: no vesting schedule found");
        
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];
        require(schedule.initialized, "TokenVesting: vesting schedule not initialized");

        if (schedule.revoked) {
            return schedule.released;
        }

        return _calculateVestedAmount(schedule);
    }

    /**
     * @dev Calculates the amount of tokens that can be released for a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @return Amount of tokens that can be released
     */
    function getReleasableAmount(address _beneficiary) external view returns (uint256) {
        uint256 vestedAmount = getVestedAmount(_beneficiary);
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];
        return vestedAmount - schedule.released;
    }

    /**
     * @dev Internal function to calculate vested amount based on time
     * @param _schedule Vesting schedule
     * @return Amount of tokens that have vested
     */
    function _calculateVestedAmount(VestingSchedule memory _schedule) internal view returns (uint256) {
        if (block.timestamp < _schedule.startTime + _schedule.cliff) {
            return 0;
        }

        if (block.timestamp >= _schedule.startTime + _schedule.duration) {
            return _schedule.totalAmount;
        }

        uint256 elapsed = block.timestamp - _schedule.startTime;
        return (_schedule.totalAmount * elapsed) / _schedule.duration;
    }

    /**
     * @dev Gets the number of beneficiaries
     * @return Number of beneficiaries
     */
    function getBeneficiaryCount() external view returns (uint256) {
        return beneficiaries.length;
    }

    /**
     * @dev Gets a beneficiary by index
     * @param _index Index of the beneficiary
     * @return Address of the beneficiary
     */
    function getBeneficiary(uint256 _index) external view returns (address) {
        require(_index < beneficiaries.length, "TokenVesting: index out of bounds");
        return beneficiaries[_index];
    }

    /**
     * @dev Updates the setup fee percentage (only owner)
     * @param _newFeePercentage New fee percentage in basis points
     */
    function updateSetupFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 1000, "TokenVesting: fee percentage cannot exceed 10%");
        setupFeePercentage = _newFeePercentage;
    }

    /**
     * @dev Updates the fee recipient address (only owner)
     * @param _newFeeRecipient New fee recipient address
     */
    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "TokenVesting: fee recipient cannot be zero address");
        feeRecipient = _newFeeRecipient;
    }

    /**
     * @dev Emergency function to recover accidentally sent FLR tokens (only owner)
     * @param _amount Amount of FLR tokens to recover
     */
    function emergencyRecover(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "TokenVesting: insufficient balance");
        payable(owner()).transfer(_amount);
    }

    /**
     * @dev Allows the contract to receive FLR tokens
     */
    receive() external payable {}
}
