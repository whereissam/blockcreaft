// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/BlockcraftOutfits.sol";
import "../contracts/BlockcraftLand.sol";
import "../contracts/BlockcraftResources.sol";
import "../contracts/BlockcraftMarketplace.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying Blockcraft Web3 Contracts to Base Sepolia...");
        
        // Deploy Blockcraft Outfits (ERC721)
        console.log("Deploying BlockcraftOutfits...");
        BlockcraftOutfits outfits = new BlockcraftOutfits();
        console.log("BlockcraftOutfits deployed to:", address(outfits));
        
        // Deploy Blockcraft Land (ERC721)
        console.log("Deploying BlockcraftLand...");
        BlockcraftLand land = new BlockcraftLand();
        console.log("BlockcraftLand deployed to:", address(land));
        
        // Deploy Blockcraft Resources (ERC1155)
        console.log("Deploying BlockcraftResources...");
        BlockcraftResources resources = new BlockcraftResources();
        console.log("BlockcraftResources deployed to:", address(resources));
        
        // Deploy Blockcraft Marketplace
        console.log("Deploying BlockcraftMarketplace...");
        BlockcraftMarketplace marketplace = new BlockcraftMarketplace();
        console.log("BlockcraftMarketplace deployed to:", address(marketplace));
        
        console.log("\nContract Addresses:");
        console.log("BLOCKCRAFT_OUTFITS_ADDRESS=%s", address(outfits));
        console.log("BLOCKCRAFT_LAND_ADDRESS=%s", address(land));
        console.log("BLOCKCRAFT_RESOURCES_ADDRESS=%s", address(resources));
        console.log("BLOCKCRAFT_MARKETPLACE_ADDRESS=%s", address(marketplace));
        
        console.log("\nOpenSea URLs:");
        console.log("Outfits: https://testnets.opensea.io/assets/base-sepolia/%s", address(outfits));
        console.log("Land: https://testnets.opensea.io/assets/base-sepolia/%s", address(land));
        console.log("Resources: https://testnets.opensea.io/assets/base-sepolia/%s", address(resources));
        
        vm.stopBroadcast();
        
        console.log("\nAll contracts deployed successfully!");
        console.log("Copy the addresses above to your .env file");
    }
}