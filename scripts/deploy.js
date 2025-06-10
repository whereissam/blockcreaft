const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Blockcraft Web3 Contracts to Base Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Blockcraft Outfits (ERC721)
  console.log("\n📦 Deploying BlockcraftOutfits...");
  const BlockcraftOutfits = await ethers.getContractFactory("BlockcraftOutfits");
  const outfits = await BlockcraftOutfits.deploy();
  await outfits.deployed();
  console.log("✅ BlockcraftOutfits deployed to:", outfits.address);

  // Deploy Blockcraft Land (ERC721)
  console.log("\n🏞️ Deploying BlockcraftLand...");
  const BlockcraftLand = await ethers.getContractFactory("BlockcraftLand");
  const land = await BlockcraftLand.deploy();
  await land.deployed();
  console.log("✅ BlockcraftLand deployed to:", land.address);

  // Deploy Blockcraft Resources (ERC1155)
  console.log("\n⛏️ Deploying BlockcraftResources...");
  const BlockcraftResources = await ethers.getContractFactory("BlockcraftResources");
  const resources = await BlockcraftResources.deploy();
  await resources.deployed();
  console.log("✅ BlockcraftResources deployed to:", resources.address);

  // Deploy Blockcraft Marketplace
  console.log("\n🛒 Deploying BlockcraftMarketplace...");
  const BlockcraftMarketplace = await ethers.getContractFactory("BlockcraftMarketplace");
  const marketplace = await BlockcraftMarketplace.deploy();
  await marketplace.deployed();
  console.log("✅ BlockcraftMarketplace deployed to:", marketplace.address);

  // Verify contracts on Base Sepolia
  console.log("\n🔍 Contract addresses for verification:");
  console.log("BlockcraftOutfits:", outfits.address);
  console.log("BlockcraftLand:", land.address);
  console.log("BlockcraftResources:", resources.address);
  console.log("BlockcraftMarketplace:", marketplace.address);

  // Save deployment info
  const deploymentInfo = {
    network: "base-sepolia",
    blockNumber: await ethers.provider.getBlockNumber(),
    deployer: deployer.address,
    contracts: {
      BlockcraftOutfits: outfits.address,
      BlockcraftLand: land.address,
      BlockcraftResources: resources.address,
      BlockcraftMarketplace: marketplace.address
    },
    deployedAt: new Date().toISOString()
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 Deployment info saved to deployment-info.json");
  console.log("\n🎉 All contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });