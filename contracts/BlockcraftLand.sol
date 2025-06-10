// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlockcraftLand is ERC721, Ownable {
    uint256 private _tokenIds;
    
    uint256 public constant CHUNK_SIZE = 16;
    uint256 public landPrice = 0.001 ether;
    
    struct LandChunk {
        int256 x;
        int256 z;
        uint256 lastHarvested;
        bool isForSale;
        uint256 salePrice;
        bool isRentable;
        uint256 rentPrice;
        address renter;
        uint256 rentExpires;
    }
    
    mapping(uint256 => LandChunk) public landChunks;
    mapping(bytes32 => uint256) public coordinateToTokenId;
    
    event LandMinted(address indexed to, uint256 indexed tokenId, int256 x, int256 z);
    event LandRented(uint256 indexed tokenId, address indexed renter, uint256 duration, uint256 price);
    event LandSaleStatusChanged(uint256 indexed tokenId, bool isForSale, uint256 price);
    
    constructor() ERC721("Blockcraft Land", "BCLAND") Ownable(msg.sender) {}
    
    function mintLand(int256 x, int256 z) public payable returns (uint256) {
        require(msg.value >= landPrice, "Insufficient payment");
        
        bytes32 coordinate = keccak256(abi.encodePacked(x, z));
        require(coordinateToTokenId[coordinate] == 0, "Land already exists");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(msg.sender, newTokenId);
        
        landChunks[newTokenId] = LandChunk({
            x: x,
            z: z,
            lastHarvested: block.timestamp,
            isForSale: false,
            salePrice: 0,
            isRentable: false,
            rentPrice: 0,
            renter: address(0),
            rentExpires: 0
        });
        
        coordinateToTokenId[coordinate] = newTokenId;
        
        emit LandMinted(msg.sender, newTokenId, x, z);
        
        return newTokenId;
    }
    
    function rentLand(uint256 tokenId, uint256 durationDays) public payable {
        require(_ownerOf(tokenId) != address(0), "Land does not exist");
        LandChunk storage land = landChunks[tokenId];
        require(land.isRentable, "Land is not rentable");
        require(land.renter == address(0) || block.timestamp > land.rentExpires, "Land is already rented");
        
        uint256 totalPrice = land.rentPrice * durationDays;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        land.renter = msg.sender;
        land.rentExpires = block.timestamp + (durationDays * 1 days);
        
        // Pay the land owner
        address owner = ownerOf(tokenId);
        payable(owner).transfer(msg.value);
        
        emit LandRented(tokenId, msg.sender, durationDays, totalPrice);
    }
    
    function setLandForSale(uint256 tokenId, bool forSale, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        
        LandChunk storage land = landChunks[tokenId];
        land.isForSale = forSale;
        land.salePrice = price;
        
        emit LandSaleStatusChanged(tokenId, forSale, price);
    }
    
    function setLandRentable(uint256 tokenId, bool rentable, uint256 dailyPrice) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        
        LandChunk storage land = landChunks[tokenId];
        land.isRentable = rentable;
        land.rentPrice = dailyPrice;
    }
    
    function harvestFromLand(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Land does not exist");
        LandChunk storage land = landChunks[tokenId];
        
        address owner = ownerOf(tokenId);
        bool canHarvest = (msg.sender == owner) || 
                         (land.renter == msg.sender && block.timestamp <= land.rentExpires);
        
        require(canHarvest, "Not authorized to harvest");
        require(block.timestamp >= land.lastHarvested + 1 hours, "Harvest cooldown not met");
        
        land.lastHarvested = block.timestamp;
        
        // Additional harvest logic would go here
        // This could mint resource NFTs to the harvester
    }
    
    function getLandInfo(uint256 tokenId) public view returns (
        int256 x,
        int256 z,
        address owner,
        bool isForSale,
        uint256 salePrice,
        bool isRentable,
        uint256 rentPrice,
        address renter,
        uint256 rentExpires
    ) {
        require(_ownerOf(tokenId) != address(0), "Land does not exist");
        LandChunk memory land = landChunks[tokenId];
        
        return (
            land.x,
            land.z,
            ownerOf(tokenId),
            land.isForSale,
            land.salePrice,
            land.isRentable,
            land.rentPrice,
            land.renter,
            land.rentExpires
        );
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
    
    function setLandPrice(uint256 _newPrice) public onlyOwner {
        landPrice = _newPrice;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}