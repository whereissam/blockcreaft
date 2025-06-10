// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockcraftOutfits
 * @dev ERC721 contract for Blockcraft game outfit NFTs
 */
contract BlockcraftOutfits is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter = 1;
    
    // Mint price in wei (0.0001 ETH = 100000000000000 wei)
    uint256 public mintPrice = 100000000000000; // 0.0001 ETH
    
    // Maximum supply of outfit NFTs
    uint256 public maxSupply = 10000;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Mapping from token ID to outfit name
    mapping(uint256 => string) public outfitNames;
    
    // Events
    event OutfitMinted(address indexed to, uint256 indexed tokenId, string outfitName, uint256 price);
    event PriceUpdated(uint256 newPrice);
    event BaseURIUpdated(string newBaseURI);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Mint an outfit NFT with metadata
     * @param to Address to mint the NFT to
     * @param metadataURI Metadata URI for the NFT
     * @param outfitName Name of the outfit being minted
     */
    function mint(address to, string memory metadataURI, string memory outfitName) public payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIdCounter <= maxSupply, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataURI).length > 0, "Token URI cannot be empty");
        require(bytes(outfitName).length > 0, "Outfit name cannot be empty");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        outfitNames[tokenId] = outfitName;

        emit OutfitMinted(to, tokenId, outfitName, msg.value);
    }

    /**
     * @dev Get all token IDs owned by an address
     * @param owner Address to query
     * @return Array of token IDs
     */
    function getTokensByOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    /**
     * @dev Get outfit names for tokens owned by an address
     * @param owner Address to query
     * @return Array of outfit names
     */
    function getOutfitsByOwner(address owner) public view returns (string[] memory) {
        uint256[] memory tokenIds = getTokensByOwner(owner);
        string[] memory outfits = new string[](tokenIds.length);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            outfits[i] = outfitNames[tokenIds[i]];
        }
        
        return outfits;
    }

    /**
     * @dev Check if an address owns a specific outfit by name
     * @param owner Address to check
     * @param outfitName Name of the outfit to check
     * @return Boolean indicating ownership
     */
    function ownsOutfit(address owner, string memory outfitName) public view returns (bool) {
        uint256[] memory tokenIds = getTokensByOwner(owner);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (keccak256(bytes(outfitNames[tokenIds[i]])) == keccak256(bytes(outfitName))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @dev Get total number of minted tokens
     */
    function totalMinted() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Set mint price (owner only)
     * @param newPrice New price in wei
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit PriceUpdated(newPrice);
    }

    /**
     * @dev Set base URI for metadata (owner only)
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // Required overrides for multiple inheritance
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}