// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlockcraftMarketplace is ReentrancyGuard, Ownable {
    
    constructor() Ownable(msg.sender) {}
    
    uint256 public marketplaceFee = 250; // 2.5% fee
    uint256 private _listingIds;
    
    enum ListingType { ERC721, ERC1155 }
    enum ListingStatus { Active, Sold, Cancelled }
    
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 amount; // For ERC1155, always 1 for ERC721
        uint256 price;
        ListingType listingType;
        ListingStatus status;
        uint256 createdAt;
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public userListings;
    
    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        ListingType listingType
    );
    
    event ItemSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    
    event ItemCancelled(uint256 indexed listingId);
    
    function listERC721(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );
        
        _listingIds++;
        
        listings[_listingIds] = Listing({
            listingId: _listingIds,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: 1,
            price: price,
            listingType: ListingType.ERC721,
            status: ListingStatus.Active,
            createdAt: block.timestamp
        });
        
        userListings[msg.sender].push(_listingIds);
        
        emit ItemListed(_listingIds, msg.sender, nftContract, tokenId, 1, price, ListingType.ERC721);
    }
    
    function listERC1155(
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(amount > 0, "Amount must be greater than 0");
        require(
            IERC1155(nftContract).balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient balance"
        );
        require(
            IERC1155(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );
        
        _listingIds++;
        
        listings[_listingIds] = Listing({
            listingId: _listingIds,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: amount,
            price: price,
            listingType: ListingType.ERC1155,
            status: ListingStatus.Active,
            createdAt: block.timestamp
        });
        
        userListings[msg.sender].push(_listingIds);
        
        emit ItemListed(_listingIds, msg.sender, nftContract, tokenId, amount, price, ListingType.ERC1155);
    }
    
    function buyItem(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own item");
        
        listing.status = ListingStatus.Sold;
        
        // Calculate fees
        uint256 fee = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        // Transfer NFT
        if (listing.listingType == ListingType.ERC721) {
            IERC721(listing.nftContract).safeTransferFrom(
                listing.seller,
                msg.sender,
                listing.tokenId
            );
        } else {
            IERC1155(listing.nftContract).safeTransferFrom(
                listing.seller,
                msg.sender,
                listing.tokenId,
                listing.amount,
                ""
            );
        }
        
        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit ItemSold(listingId, msg.sender, listing.seller, listing.price);
    }
    
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.status == ListingStatus.Active, "Listing not active");
        
        listing.status = ListingStatus.Cancelled;
        
        emit ItemCancelled(listingId);
    }
    
    function getActiveListing(uint256 listingId) external view returns (Listing memory) {
        require(listings[listingId].status == ListingStatus.Active, "Listing not active");
        return listings[listingId];
    }
    
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }
    
    function getAllActiveListings() external view returns (uint256[] memory activeListings) {
        uint256 activeCount = 0;
        
        // Count active listings
        for (uint256 i = 1; i <= _listingIds; i++) {
            if (listings[i].status == ListingStatus.Active) {
                activeCount++;
            }
        }
        
        // Create array of active listing IDs
        activeListings = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= _listingIds; i++) {
            if (listings[i].status == ListingStatus.Active) {
                activeListings[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeListings;
    }
    
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        marketplaceFee = _fee;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
    
    function getTotalListings() external view returns (uint256) {
        return _listingIds;
    }
}