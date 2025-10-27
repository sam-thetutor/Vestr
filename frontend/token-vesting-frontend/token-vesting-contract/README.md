# Token Vesting Contract - Flare Network

A comprehensive token vesting contract for Flare native token (FLR) that allows gradual release of tokens over time.

## Features

- ✅ **Native FLR Support**: Works with Flare's native token (no ERC20 needed)
- ✅ **Flexible Vesting**: Customizable start time, duration, and cliff periods
- ✅ **Revocable Schedules**: Optional revocation capability for emergency situations
- ✅ **Fee System**: Built-in setup fee mechanism for monetization
- ✅ **Security**: ReentrancyGuard and comprehensive access controls
- ✅ **Gas Optimized**: Efficient storage and computation

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env with your private key and settings
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Run Tests
```bash
npm test
```

### 5. Deploy to Flare Testnet
```bash
npm run deploy:testnet
```

## Contract Functions

### Core Functions
- `createVestingSchedule()` - Create a new vesting schedule
- `release()` - Release vested tokens to beneficiary
- `revokeVestingSchedule()` - Revoke a vesting schedule (if revocable)

### View Functions
- `getVestedAmount()` - Get total vested amount for a beneficiary
- `getReleasableAmount()` - Get amount available for release
- `getBeneficiaryCount()` - Get total number of beneficiaries

### Admin Functions
- `updateSetupFeePercentage()` - Update the setup fee percentage
- `updateFeeRecipient()` - Update the fee recipient address
- `emergencyRecover()` - Emergency token recovery

## Usage Examples

### Create Vesting Schedule
```javascript
await tokenVesting.createVestingSchedule(
  "0xBeneficiaryAddress",     // beneficiary
  ethers.parseEther("100"),   // 100 FLR tokens
  Math.floor(Date.now() / 1000), // start time (now)
  365 * 24 * 60 * 60,         // duration (1 year)
  30 * 24 * 60 * 60,          // cliff (1 month)
  true,                       // revocable
  { value: ethers.parseEther("100") } // send FLR
);
```

### Release Tokens
```javascript
await tokenVesting.connect(beneficiarySigner).release();
```

### Check Vested Amount
```javascript
const vestedAmount = await tokenVesting.getVestedAmount("0xBeneficiaryAddress");
```

## Network Configuration

### Flare Testnet (Coston2)
- **RPC URL**: https://coston2-api.flare.network/ext/bc/C/rpc
- **Chain ID**: 114
- **Explorer**: https://coston2-explorer.flare.network

### Flare Mainnet
- **RPC URL**: https://api.flare.network/ext/bc/C/rpc
- **Chain ID**: 14
- **Explorer**: https://flare-explorer.flare.network

## Security Considerations

- Always test on testnet before mainnet deployment
- Verify contract source code on explorer
- Use multisig for owner functions in production
- Monitor contract for unusual activity

## License

MIT License - see LICENSE file for details
