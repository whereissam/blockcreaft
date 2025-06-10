// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlockcraftResources is ERC1155, Ownable {
    
    // Resource type IDs
    uint256 public constant WOOD = 1;
    uint256 public constant STONE = 2;
    uint256 public constant IRON = 3;
    uint256 public constant GOLD = 4;
    uint256 public constant DIAMOND = 5;
    
    mapping(uint256 => string) public resourceNames;
    mapping(uint256 => string) public resourceRarities;
    mapping(address => mapping(uint256 => uint256)) public lastMinted;
    
    uint256 public mintCooldown = 1 hours;
    
    event ResourceMinted(address indexed to, uint256 indexed resourceType, uint256 amount);
    
    constructor() ERC1155("https://api.blockcraft.game/resources/{id}.json") Ownable(msg.sender) {
        // Initialize resource metadata
        resourceNames[WOOD] = "Wood";
        resourceNames[STONE] = "Stone";
        resourceNames[IRON] = "Iron";
        resourceNames[GOLD] = "Gold";
        resourceNames[DIAMOND] = "Diamond";
        
        resourceRarities[WOOD] = "common";
        resourceRarities[STONE] = "common";
        resourceRarities[IRON] = "uncommon";
        resourceRarities[GOLD] = "rare";
        resourceRarities[DIAMOND] = "legendary";
    }
    
    function mintResource(address to, uint256 resourceType, uint256 amount) public {
        require(resourceType >= WOOD && resourceType <= DIAMOND, "Invalid resource type");
        require(amount > 0 && amount <= 100, "Invalid amount");
        
        // Check cooldown
        require(
            block.timestamp >= lastMinted[to][resourceType] + mintCooldown,
            "Mint cooldown not met"
        );
        
        lastMinted[to][resourceType] = block.timestamp;
        
        _mint(to, resourceType, amount, "");
        
        emit ResourceMinted(to, resourceType, amount);
    }
    
    function mintResourceBatch(
        address to,
        uint256[] memory resourceTypes,
        uint256[] memory amounts
    ) public {
        require(resourceTypes.length == amounts.length, "Arrays length mismatch");
        
        for (uint i = 0; i < resourceTypes.length; i++) {
            require(resourceTypes[i] >= WOOD && resourceTypes[i] <= DIAMOND, "Invalid resource type");
            require(amounts[i] > 0 && amounts[i] <= 100, "Invalid amount");
            require(
                block.timestamp >= lastMinted[to][resourceTypes[i]] + mintCooldown,
                "Mint cooldown not met"
            );
            
            lastMinted[to][resourceTypes[i]] = block.timestamp;
        }
        
        _mintBatch(to, resourceTypes, amounts, "");
        
        for (uint i = 0; i < resourceTypes.length; i++) {
            emit ResourceMinted(to, resourceTypes[i], amounts[i]);
        }
    }
    
    function getResourceInfo(uint256 resourceType) public view returns (
        string memory name,
        string memory rarity,
        uint256 totalSupply
    ) {
        require(resourceType >= WOOD && resourceType <= DIAMOND, "Invalid resource type");
        
        return (
            resourceNames[resourceType],
            resourceRarities[resourceType],
            0 // Note: ERC1155 doesn't track total supply by default
        );
    }
    
    function getUserResources(address user) public view returns (
        uint256[] memory resourceTypes,
        uint256[] memory balances
    ) {
        resourceTypes = new uint256[](5);
        balances = new uint256[](5);
        
        for (uint i = 0; i < 5; i++) {
            resourceTypes[i] = i + 1; // WOOD to DIAMOND
            balances[i] = balanceOf(user, i + 1);
        }
        
        return (resourceTypes, balances);
    }
    
    function setCooldown(uint256 _newCooldown) public onlyOwner {
        mintCooldown = _newCooldown;
    }
    
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}