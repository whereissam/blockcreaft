// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlockcraftOutfits is ERC721, Ownable {
    uint256 private _tokenIds;
    
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public mintPrice = 0.0001 ether;
    
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => string) private _outfitNames;
    mapping(uint256 => string) private _rarities;
    
    event OutfitMinted(address indexed to, uint256 indexed tokenId, string outfitName, string rarity);
    
    constructor() ERC721("Blockcraft Outfits", "BCOUTFIT") Ownable(msg.sender) {}
    
    function mint(address to, string memory metadataURI, string memory outfitName, string memory rarity) 
        public 
        payable 
        returns (uint256) 
    {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIds < MAX_SUPPLY, "Max supply reached");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);
        _outfitNames[newTokenId] = outfitName;
        _rarities[newTokenId] = rarity;
        
        emit OutfitMinted(to, newTokenId, outfitName, rarity);
        
        return newTokenId;
    }
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
    
    function getOutfitInfo(uint256 tokenId) public view returns (string memory name, string memory rarity) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return (_outfitNames[tokenId], _rarities[tokenId]);
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
    
    function setMintPrice(uint256 _newPrice) public onlyOwner {
        mintPrice = _newPrice;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}