const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenVesting", function () {
  let tokenVesting;
  let owner;
  let beneficiary;
  let feeRecipient;
  let otherAccount;

  const TOTAL_AMOUNT = ethers.parseEther("100"); // Reduced amount for testing
  const SETUP_FEE_PERCENTAGE = 100; // 1%
  const SETUP_FEE = (TOTAL_AMOUNT * BigInt(SETUP_FEE_PERCENTAGE)) / BigInt(10000);
  const VESTING_AMOUNT = TOTAL_AMOUNT - SETUP_FEE;

  beforeEach(async function () {
    [owner, beneficiary, feeRecipient, otherAccount] = await ethers.getSigners();

    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    tokenVesting = await TokenVesting.deploy(feeRecipient.address);
    await tokenVesting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await tokenVesting.owner()).to.equal(owner.address);
    });

    it("Should set the correct fee recipient", async function () {
      expect(await tokenVesting.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set the correct setup fee percentage", async function () {
      expect(await tokenVesting.setupFeePercentage()).to.equal(SETUP_FEE_PERCENTAGE);
    });

    it("Should revert if fee recipient is zero address", async function () {
      const TokenVesting = await ethers.getContractFactory("TokenVesting");
      await expect(TokenVesting.deploy(ethers.ZeroAddress))
        .to.be.revertedWith("TokenVesting: fee recipient cannot be zero address");
    });
  });

  describe("createVestingSchedule", function () {
    const DURATION = 365 * 24 * 60 * 60; // 1 year
    const CLIFF = 30 * 24 * 60 * 60; // 1 month

    it("Should create a vesting schedule successfully", async function () {
      const startTime = await time.latest() + 1;
      
      await expect(
        tokenVesting.createVestingSchedule(
          beneficiary.address,
          TOTAL_AMOUNT,
          startTime,
          DURATION,
          CLIFF,
          true,
          { value: TOTAL_AMOUNT }
        )
      ).to.emit(tokenVesting, "VestingScheduleCreated")
        .withArgs(beneficiary.address, VESTING_AMOUNT, startTime, DURATION, CLIFF);

      const schedule = await tokenVesting.vestingSchedules(beneficiary.address);
      expect(schedule.initialized).to.be.true;
      expect(schedule.totalAmount).to.equal(VESTING_AMOUNT);
      expect(schedule.startTime).to.equal(startTime);
      expect(schedule.duration).to.equal(DURATION);
      expect(schedule.cliff).to.equal(CLIFF);
      expect(schedule.revocable).to.be.true;
    });

    it("Should transfer setup fee to fee recipient", async function () {
      const startTime = await time.latest() + 1;
      const initialBalance = await ethers.provider.getBalance(feeRecipient.address);

      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );

      const finalBalance = await ethers.provider.getBalance(feeRecipient.address);
      expect(finalBalance - initialBalance).to.equal(SETUP_FEE);
    });

    it("Should revert if beneficiary is zero address", async function () {
      const startTime = await time.latest() + 1;
      
      await expect(
        tokenVesting.createVestingSchedule(
          ethers.ZeroAddress,
          TOTAL_AMOUNT,
          startTime,
          DURATION,
          CLIFF,
          true,
          { value: TOTAL_AMOUNT }
        )
      ).to.be.revertedWith("TokenVesting: beneficiary cannot be zero address");
    });

    it("Should revert if total amount is zero", async function () {
      const startTime = await time.latest() + 1;
      
      await expect(
        tokenVesting.createVestingSchedule(
          beneficiary.address,
          0,
          startTime,
          DURATION,
          CLIFF,
          true,
          { value: 0 }
        )
      ).to.be.revertedWith("TokenVesting: total amount must be greater than 0");
    });

    it("Should revert if duration is zero", async function () {
      const startTime = await time.latest() + 1;
      
      await expect(
        tokenVesting.createVestingSchedule(
          beneficiary.address,
          TOTAL_AMOUNT,
          startTime,
          0,
          CLIFF,
          true,
          { value: TOTAL_AMOUNT }
        )
      ).to.be.revertedWith("TokenVesting: duration must be greater than 0");
    });

    it("Should revert if cliff is greater than duration", async function () {
      const startTime = await time.latest() + 1;
      
      await expect(
        tokenVesting.createVestingSchedule(
          beneficiary.address,
          TOTAL_AMOUNT,
          startTime,
          DURATION,
          DURATION + 1,
          true,
          { value: TOTAL_AMOUNT }
        )
      ).to.be.revertedWith("TokenVesting: cliff must be less than or equal to duration");
    });

    it("Should revert if vesting schedule already exists", async function () {
      const startTime = await time.latest() + 1;
      
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );

      await expect(
        tokenVesting.createVestingSchedule(
          beneficiary.address,
          TOTAL_AMOUNT,
          startTime,
          DURATION,
          CLIFF,
          true,
          { value: TOTAL_AMOUNT }
        )
      ).to.be.revertedWith("TokenVesting: vesting schedule already exists");
    });

    it("Should revert if insufficient FLR sent", async function () {
      const startTime = await time.latest() + 1;
      
      await expect(
        tokenVesting.createVestingSchedule(
          beneficiary.address,
          TOTAL_AMOUNT,
          startTime,
          DURATION,
          CLIFF,
          true,
          { value: TOTAL_AMOUNT - 1n }
        )
      ).to.be.revertedWith("TokenVesting: insufficient FLR sent");
    });

    it("Should revert if called by non-owner", async function () {
      const startTime = await time.latest() + 1;
      
      await expect(
        tokenVesting.connect(otherAccount).createVestingSchedule(
          beneficiary.address,
          TOTAL_AMOUNT,
          startTime,
          DURATION,
          CLIFF,
          true,
          { value: TOTAL_AMOUNT }
        )
      ).to.be.revertedWithCustomError(tokenVesting, "OwnableUnauthorizedAccount");
    });
  });

  describe("release", function () {
    const DURATION = 365 * 24 * 60 * 60; // 1 year
    const CLIFF = 30 * 24 * 60 * 60; // 1 month

    beforeEach(async function () {
      const startTime = await time.latest() + 1;
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );
    });

    it("Should revert if no vesting schedule exists", async function () {
      await expect(
        tokenVesting.connect(otherAccount).release()
      ).to.be.revertedWith("TokenVesting: no vesting schedule found");
    });

    it("Should revert if trying to release before cliff", async function () {
      await expect(
        tokenVesting.connect(beneficiary).release()
      ).to.be.revertedWith("TokenVesting: no tokens available for release");
    });

    it("Should release tokens after cliff period", async function () {
      const startTime = await time.latest() + 1;
      
      // Create a new schedule with immediate start
      await tokenVesting.createVestingSchedule(
        otherAccount.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        0, // No cliff
        true,
        { value: TOTAL_AMOUNT }
      );

      // Fast forward past start time
      await time.increase(1);

      const initialBalance = await ethers.provider.getBalance(otherAccount.address);
      
      // Get the actual vested amount to expect
      const vestedAmount = await tokenVesting.getVestedAmount(otherAccount.address);
      
      await tokenVesting.connect(otherAccount).release();

      const finalBalance = await ethers.provider.getBalance(otherAccount.address);
      // Account for gas costs by checking the balance increased by at least the vested amount
      expect(finalBalance).to.be.greaterThanOrEqual(initialBalance + vestedAmount - ethers.parseEther("0.01"));
    });

    it("Should release partial tokens after partial vesting", async function () {
      const startTime = await time.latest() + 1;
      const shortDuration = 100; // 100 seconds
      
      await tokenVesting.createVestingSchedule(
        otherAccount.address,
        TOTAL_AMOUNT,
        startTime,
        shortDuration,
        0, // No cliff
        true,
        { value: TOTAL_AMOUNT }
      );

      // Fast forward past start time
      await time.increase(1);
      
      // Fast forward half the duration
      await time.increase(shortDuration / 2);

      const initialBalance = await ethers.provider.getBalance(otherAccount.address);
      
      // Get the actual vested amount to expect
      const vestedAmount = await tokenVesting.getVestedAmount(otherAccount.address);
      
      await tokenVesting.connect(otherAccount).release();

      const finalBalance = await ethers.provider.getBalance(otherAccount.address);
      // Account for gas costs by checking the balance increased by at least the vested amount
      expect(finalBalance).to.be.greaterThanOrEqual(initialBalance + vestedAmount - ethers.parseEther("0.01"));
    });
  });

  describe("revokeVestingSchedule", function () {
    const DURATION = 365 * 24 * 60 * 60; // 1 year
    const CLIFF = 30 * 24 * 60 * 60; // 1 month

    beforeEach(async function () {
      const startTime = await time.latest() + 1;
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );
    });

    it("Should revoke vesting schedule successfully", async function () {
      await expect(
        tokenVesting.revokeVestingSchedule(beneficiary.address)
      ).to.emit(tokenVesting, "VestingScheduleRevoked")
        .withArgs(beneficiary.address);

      const schedule = await tokenVesting.vestingSchedules(beneficiary.address);
      expect(schedule.revoked).to.be.true;
    });

    it("Should revert if vesting schedule is not revocable", async function () {
      const startTime = await time.latest() + 1;
      
      // Create non-revocable schedule
      await tokenVesting.createVestingSchedule(
        otherAccount.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        false, // Not revocable
        { value: TOTAL_AMOUNT }
      );

      await expect(
        tokenVesting.revokeVestingSchedule(otherAccount.address)
      ).to.be.revertedWith("TokenVesting: vesting schedule is not revocable");
    });

    it("Should revert if called by non-owner", async function () {
      await expect(
        tokenVesting.connect(otherAccount).revokeVestingSchedule(beneficiary.address)
      ).to.be.revertedWithCustomError(tokenVesting, "OwnableUnauthorizedAccount");
    });

    it("Should revert if vesting schedule doesn't exist", async function () {
      await expect(
        tokenVesting.revokeVestingSchedule(otherAccount.address)
      ).to.be.revertedWith("TokenVesting: no vesting schedule found");
    });
  });

  describe("getVestedAmount", function () {
    const DURATION = 365 * 24 * 60 * 60; // 1 year
    const CLIFF = 30 * 24 * 60 * 60; // 1 month

    beforeEach(async function () {
      const startTime = await time.latest() + 1;
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );
    });

    it("Should return 0 before cliff period", async function () {
      const vestedAmount = await tokenVesting.getVestedAmount(beneficiary.address);
      expect(vestedAmount).to.equal(0);
    });

    it("Should return partial amount after partial vesting", async function () {
      const startTime = await time.latest() + 1;
      const shortDuration = 100; // 100 seconds
      
      await tokenVesting.createVestingSchedule(
        otherAccount.address,
        TOTAL_AMOUNT,
        startTime,
        shortDuration,
        0, // No cliff
        true,
        { value: TOTAL_AMOUNT }
      );

      // Fast forward past start time
      await time.increase(1);
      
      // Fast forward half the duration
      await time.increase(shortDuration / 2);

      const vestedAmount = await tokenVesting.getVestedAmount(otherAccount.address);
      // Calculate expected amount based on actual vesting formula
      const expectedAmount = (VESTING_AMOUNT * BigInt(shortDuration / 2 + 1)) / BigInt(shortDuration);
      expect(vestedAmount).to.equal(expectedAmount);
    });

    it("Should return full amount after vesting period", async function () {
      const startTime = await time.latest() + 1;
      const shortDuration = 100; // 100 seconds
      
      await tokenVesting.createVestingSchedule(
        otherAccount.address,
        TOTAL_AMOUNT,
        startTime,
        shortDuration,
        0, // No cliff
        true,
        { value: TOTAL_AMOUNT }
      );

      // Fast forward past start time and duration
      await time.increase(1);
      await time.increase(shortDuration);

      const vestedAmount = await tokenVesting.getVestedAmount(otherAccount.address);
      expect(vestedAmount).to.equal(VESTING_AMOUNT);
    });
  });

  describe("getReleasableAmount", function () {
    const DURATION = 365 * 24 * 60 * 60; // 1 year
    const CLIFF = 30 * 24 * 60 * 60; // 1 month

    beforeEach(async function () {
      const startTime = await time.latest() + 1;
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );
    });

    it("Should return 0 before cliff period", async function () {
      const releasableAmount = await tokenVesting.getReleasableAmount(beneficiary.address);
      expect(releasableAmount).to.equal(0);
    });

    it("Should return correct amount after partial vesting", async function () {
      const startTime = await time.latest() + 1;
      const shortDuration = 100; // 100 seconds
      
      await tokenVesting.createVestingSchedule(
        otherAccount.address,
        TOTAL_AMOUNT,
        startTime,
        shortDuration,
        0, // No cliff
        true,
        { value: TOTAL_AMOUNT }
      );

      // Fast forward past start time
      await time.increase(1);
      
      // Fast forward half the duration
      await time.increase(shortDuration / 2);

      const releasableAmount = await tokenVesting.getReleasableAmount(otherAccount.address);
      // Calculate expected amount based on actual vesting formula
      const expectedAmount = (VESTING_AMOUNT * BigInt(shortDuration / 2 + 1)) / BigInt(shortDuration);
      expect(releasableAmount).to.equal(expectedAmount);
    });

    it("Should return 0 after full release", async function () {
      const startTime = await time.latest() + 1;
      const shortDuration = 100; // 100 seconds
      
      await tokenVesting.createVestingSchedule(
        otherAccount.address,
        TOTAL_AMOUNT,
        startTime,
        shortDuration,
        0, // No cliff
        true,
        { value: TOTAL_AMOUNT }
      );

      // Fast forward past start time and duration
      await time.increase(1);
      await time.increase(shortDuration);

      // Release all tokens
      await tokenVesting.connect(otherAccount).release();

      const releasableAmount = await tokenVesting.getReleasableAmount(otherAccount.address);
      expect(releasableAmount).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should update setup fee percentage", async function () {
      const newFeePercentage = 200; // 2%
      
      await tokenVesting.updateSetupFeePercentage(newFeePercentage);
      expect(await tokenVesting.setupFeePercentage()).to.equal(newFeePercentage);
    });

    it("Should revert if fee percentage exceeds 10%", async function () {
      const newFeePercentage = 1001; // 10.01%
      
      await expect(
        tokenVesting.updateSetupFeePercentage(newFeePercentage)
      ).to.be.revertedWith("TokenVesting: fee percentage cannot exceed 10%");
    });

    it("Should revert if called by non-owner", async function () {
      await expect(
        tokenVesting.connect(otherAccount).updateSetupFeePercentage(200)
      ).to.be.revertedWithCustomError(tokenVesting, "OwnableUnauthorizedAccount");
    });

    it("Should update fee recipient", async function () {
      await tokenVesting.updateFeeRecipient(otherAccount.address);
      expect(await tokenVesting.feeRecipient()).to.equal(otherAccount.address);
    });

    it("Should revert if new fee recipient is zero address", async function () {
      await expect(
        tokenVesting.updateFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWith("TokenVesting: fee recipient cannot be zero address");
    });

    it("Should revert if called by non-owner", async function () {
      await expect(
        tokenVesting.connect(otherAccount).updateFeeRecipient(otherAccount.address)
      ).to.be.revertedWithCustomError(tokenVesting, "OwnableUnauthorizedAccount");
    });

    it("Should allow emergency recovery", async function () {
      const recoveryAmount = ethers.parseEther("1");
      
      // Send some FLR to contract
      await owner.sendTransaction({
        to: await tokenVesting.getAddress(),
        value: recoveryAmount
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await tokenVesting.emergencyRecover(recoveryAmount);
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      // Account for gas costs
      expect(finalBalance).to.be.greaterThan(initialBalance);
    });

    it("Should revert emergency recovery if called by non-owner", async function () {
      await expect(
        tokenVesting.connect(otherAccount).emergencyRecover(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(tokenVesting, "OwnableUnauthorizedAccount");
    });
  });

  describe("Beneficiary Management", function () {
    const DURATION = 365 * 24 * 60 * 60; // 1 year
    const CLIFF = 30 * 24 * 60 * 60; // 1 month

    it("Should track beneficiaries correctly", async function () {
      const startTime = await time.latest() + 1;
      
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );

      expect(await tokenVesting.getBeneficiaryCount()).to.equal(1);
      expect(await tokenVesting.getBeneficiary(0)).to.equal(beneficiary.address);
      expect(await tokenVesting.isBeneficiary(beneficiary.address)).to.be.true;
    });

    it("Should not duplicate beneficiaries", async function () {
      const startTime = await time.latest() + 1;
      
      // Create first schedule
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );

      // Create second schedule for same beneficiary (should fail)
      await expect(
        tokenVesting.createVestingSchedule(
          beneficiary.address,
          TOTAL_AMOUNT,
          startTime + 1,
          DURATION,
          CLIFF,
          true,
          { value: TOTAL_AMOUNT }
        )
      ).to.be.revertedWith("TokenVesting: vesting schedule already exists");

      expect(await tokenVesting.getBeneficiaryCount()).to.equal(1);
    });

    it("Should handle multiple beneficiaries", async function () {
      const startTime = await time.latest() + 1;
      
      // Create schedules for multiple beneficiaries
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );

      await tokenVesting.createVestingSchedule(
        otherAccount.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );

      expect(await tokenVesting.getBeneficiaryCount()).to.equal(2);
      expect(await tokenVesting.isBeneficiary(beneficiary.address)).to.be.true;
      expect(await tokenVesting.isBeneficiary(otherAccount.address)).to.be.true;
    });

    it("Should revert if beneficiary index is out of bounds", async function () {
      await expect(
        tokenVesting.getBeneficiary(0)
      ).to.be.revertedWith("TokenVesting: index out of bounds");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero setup fee", async function () {
      // Update fee to 0
      await tokenVesting.updateSetupFeePercentage(0);
      
      const startTime = await time.latest() + 1;
      const DURATION = 365 * 24 * 60 * 60;
      const CLIFF = 30 * 24 * 60 * 60;
      
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );

      const schedule = await tokenVesting.vestingSchedules(beneficiary.address);
      expect(schedule.totalAmount).to.equal(TOTAL_AMOUNT); // No fee deducted
    });

    it("Should handle maximum setup fee", async function () {
      // Update fee to maximum (10%)
      await tokenVesting.updateSetupFeePercentage(1000);
      
      const startTime = await time.latest() + 1;
      const DURATION = 365 * 24 * 60 * 60;
      const CLIFF = 30 * 24 * 60 * 60;
      
      await tokenVesting.createVestingSchedule(
        beneficiary.address,
        TOTAL_AMOUNT,
        startTime,
        DURATION,
        CLIFF,
        true,
        { value: TOTAL_AMOUNT }
      );

      const schedule = await tokenVesting.vestingSchedules(beneficiary.address);
      const expectedVestingAmount = TOTAL_AMOUNT - (TOTAL_AMOUNT * 1000n / 10000n);
      expect(schedule.totalAmount).to.equal(expectedVestingAmount);
    });

    it("Should handle receive function", async function () {
      const amount = ethers.parseEther("1");
      
      await owner.sendTransaction({
        to: await tokenVesting.getAddress(),
        value: amount
      });

      const contractBalance = await ethers.provider.getBalance(await tokenVesting.getAddress());
      expect(contractBalance).to.equal(amount);
    });
  });
});