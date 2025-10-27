const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting TokenVesting contract deployment...");

  // Get the contract factory
  const TokenVesting = await ethers.getContractFactory("TokenVesting");

  // Get the deployer address for fee recipient
  const [deployer] = await ethers.getSigners();
  const actualFeeRecipient = deployer.address; // Use deployer as fee recipient

  console.log("📋 Deployment parameters:");
  console.log(`   Fee Recipient: ${actualFeeRecipient}`);
  console.log(`   Deployer: ${deployer.address}`);

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const tokenVesting = await TokenVesting.deploy(actualFeeRecipient);

  // Wait for deployment to complete
  await tokenVesting.waitForDeployment();

  const contractAddress = await tokenVesting.getAddress();
  console.log("✅ TokenVesting contract deployed successfully!");
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Network: ${network.name}`);
  console.log(`   Chain ID: ${network.config.chainId}`);

  // Verify contract on Flare testnet explorer (if on testnet)
  if (network.name === "flare-testnet") {
    console.log("\n🔍 To verify the contract on Flare testnet explorer:");
    console.log(`   npx hardhat verify --network flare-testnet ${contractAddress} "${actualFeeRecipient}"`);
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: network.name,
    chainId: network.config.chainId,
    feeRecipient: actualFeeRecipient,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Example usage instructions
  console.log("\n📖 Example Usage:");
  console.log("1. Create a vesting schedule:");
  console.log(`   await tokenVesting.createVestingSchedule(`);
  console.log(`     "0xBeneficiaryAddress", // beneficiary`);
  console.log(`     ethers.parseEther("100"), // 100 FLR tokens`);
  console.log(`     Math.floor(Date.now() / 1000), // start time (now)`);
  console.log(`     365 * 24 * 60 * 60, // duration (1 year)`);
  console.log(`     30 * 24 * 60 * 60, // cliff (1 month)`);
  console.log(`     true, // revocable`);
  console.log(`     { value: ethers.parseEther("100") } // send FLR with transaction`);
  console.log(`   );`);

  console.log("\n2. Release vested tokens:");
  console.log(`   await tokenVesting.connect(beneficiarySigner).release();`);

  console.log("\n3. Check vested amount:");
  console.log(`   const vestedAmount = await tokenVesting.getVestedAmount("0xBeneficiaryAddress");`);
}

// Handle deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
