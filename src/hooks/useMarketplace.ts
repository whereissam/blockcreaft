import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { useWeb3 } from './useWeb3'
import { CONTRACTS } from '../contracts/config'

// Marketplace contract ABI (simplified)
const MARKETPLACE_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "nftContract", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "listERC721",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "listingId", "type": "uint256" }
    ],
    "name": "buyItem",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "listingId", "type": "uint256" }
    ],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllActiveListings",
    "outputs": [{ "internalType": "uint256[]", "name": "activeListings", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export interface MarketplaceListing {
  id: string
  name: string
  type: 'outfit' | 'resource' | 'land'
  price: number
  seller: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  image?: string
  tokenId: number
  contractAddress: string
  isActive: boolean
}

export function useMarketplace() {
  const { isConnected, address } = useWeb3()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Generate SVG images for marketplace items
  const generateOutfitImage = (name: string, rarity: string) => {
    const colors = {
      "Cyber Punk Outfit": { primary: "#0F0F23", secondary: "#00FFFF", accent: "#FF00FF" },
      "Royal Knight Armor": { primary: "#4A4A4A", secondary: "#FFD700", accent: "#8B0000" },
      "Rainbow Mystic Robes": { primary: "#FF6B6B", secondary: "#4ECDC4", accent: "#45B7D1" },
      "Space Marine Suit": { primary: "#2E2E2E", secondary: "#0080FF", accent: "#FF4500" }
    }
    
    const color = colors[name] || { primary: "#666", secondary: "#999", accent: "#AAA" }
    
    return `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#grad)" rx="10"/>
      <g transform="translate(100, 100)">
        <circle cx="0" cy="-40" r="15" fill="${color.primary}" stroke="${color.accent}" stroke-width="2"/>
        <rect x="-12" y="-25" width="24" height="35" fill="${color.secondary}" rx="3"/>
        <rect x="-20" y="-20" width="8" height="25" fill="${color.secondary}" rx="4"/>
        <rect x="12" y="-20" width="8" height="25" fill="${color.secondary}" rx="4"/>
        <rect x="-8" y="10" width="7" height="25" fill="${color.primary}" rx="3"/>
        <rect x="1" y="10" width="7" height="25" fill="${color.primary}" rx="3"/>
        <circle cx="0" cy="-15" r="3" fill="${color.accent}"/>
      </g>
      <text x="100" y="180" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${name}</text>
    </svg>`)}`
  }

  const generateResourceImage = (name: string) => {
    const colors = {
      "Diamond Block": "#00E5FF",
      "Gold Ore": "#FFD700",
      "Iron Ore": "#C0C0C0",
      "Stone": "#9E9E9E"
    }
    
    const color = colors[name] || "#666"
    
    return `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${color}" stroke="#333" stroke-width="3" rx="10"/>
      <rect x="20" y="20" width="160" height="160" fill="${color}" opacity="0.8" stroke="#666" stroke-width="2" rx="5"/>
      <rect x="40" y="40" width="120" height="120" fill="${color}" opacity="0.6" rx="5"/>
      <text x="100" y="105" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${name}</text>
      <text x="100" y="125" text-anchor="middle" fill="white" font-size="10" opacity="0.9">RESOURCE</text>
    </svg>`)}`
  }

  const generateLandImage = (name: string) => {
    return `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#228B22" stroke="#333" stroke-width="3" rx="10"/>
      <rect x="20" y="20" width="160" height="160" fill="#32CD32" opacity="0.8" stroke="#666" stroke-width="2" rx="5"/>
      <rect x="40" y="40" width="120" height="120" fill="#90EE90" opacity="0.6" rx="5"/>
      <circle cx="60" cy="60" r="8" fill="#8B4513"/>
      <circle cx="140" cy="80" r="6" fill="#8B4513"/>
      <circle cx="100" cy="140" r="10" fill="#4169E1"/>
      <text x="100" y="105" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${name}</text>
      <text x="100" y="125" text-anchor="middle" fill="white" font-size="10" opacity="0.9">LAND CHUNK</text>
    </svg>`)}`
  }

  // Mock marketplace listings for demo
  const getMarketplaceListings = (): MarketplaceListing[] => {
    return [
      {
        id: "1",
        name: "Cyber Punk Outfit",
        type: "outfit",
        price: 0.0001,
        seller: "0x1234...5678",
        rarity: "rare",
        image: generateOutfitImage("Cyber Punk Outfit", "rare"),
        tokenId: 1,
        contractAddress: "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF",
        isActive: true
      },
      {
        id: "2",
        name: "Royal Knight Armor",
        type: "outfit", 
        price: 0.0003,
        seller: "0x2345...6789",
        rarity: "epic",
        image: generateOutfitImage("Royal Knight Armor", "epic"),
        tokenId: 2,
        contractAddress: "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF",
        isActive: true
      },
      {
        id: "3",
        name: "Diamond Block",
        type: "resource",
        price: 0.0002,
        seller: "0x3456...7890",
        rarity: "rare",
        image: generateResourceImage("Diamond Block"),
        tokenId: 3,
        contractAddress: "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF",
        isActive: true
      },
      {
        id: "4",
        name: "Land Chunk #42",
        type: "land",
        price: 0.001,
        seller: "0x4567...8901",
        rarity: "common",
        image: generateLandImage("Land Chunk #42"),
        tokenId: 42,
        contractAddress: "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF",
        isActive: true
      },
      {
        id: "5",
        name: "Rainbow Mystic Robes",
        type: "outfit",
        price: 0.0005,
        seller: "0x5678...9012",
        rarity: "legendary",
        image: generateOutfitImage("Rainbow Mystic Robes", "legendary"),
        tokenId: 5,
        contractAddress: "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF",
        isActive: true
      },
      {
        id: "6",
        name: "Gold Ore",
        type: "resource",
        price: 0.00015,
        seller: "0x6789...0123",
        rarity: "rare",
        image: generateResourceImage("Gold Ore"),
        tokenId: 6,
        contractAddress: "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF",
        isActive: true
      },
      {
        id: "7",
        name: "Prime Land (0,0)",
        type: "land",
        price: 0.002,
        seller: "0x7890...1234",
        rarity: "rare",
        image: generateLandImage("Prime Land (0,0)"),
        tokenId: 7,
        contractAddress: "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF",
        isActive: true
      },
      {
        id: "8",
        name: "Space Marine Suit",
        type: "outfit",
        price: 0.00025,
        seller: "0x8901...2345",
        rarity: "epic",
        image: generateOutfitImage("Space Marine Suit", "epic"),
        tokenId: 8,
        contractAddress: "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF",
        isActive: true
      }
    ]
  }

  // Buy NFT from marketplace
  const buyNFT = async (listingId: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    const listing = getMarketplaceListings().find(l => l.id === listingId)
    if (!listing) {
      throw new Error('Listing not found')
    }

    console.log('🛒 Buying NFT:', listing.name, 'for', listing.price, 'ETH')
    setLastAction(`Buying ${listing.name}`)

    try {
      // Simulate purchase for demo
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate transaction time
      
      // Mark item as purchased
      setPurchasedItems(prev => [...prev, listingId])
      setLastAction(`Successfully purchased ${listing.name}!`)
      setSuccessMessage(`🎉 You now own ${listing.name}!`)
      setIsSuccess(true)
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSuccess(false)
        setLastAction(null)
        setSuccessMessage(null)
      }, 5000)
      
      console.log('🎉 Purchase successful! (Demo mode)')
      
      /* Real marketplace contract call:
      await writeContract({
        address: CONTRACTS.MARKETPLACE,
        abi: MARKETPLACE_ABI,
        functionName: 'buyItem',
        args: [BigInt(listingId)],
        value: parseEther(listing.price.toString()),
      })
      */
      
    } catch (error) {
      console.error('❌ Purchase failed:', error)
      setLastAction('Purchase failed')
      throw error
    }
  }

  // List NFT for sale
  const listNFTForSale = async (tokenId: number, price: number, contractAddress: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    console.log('📋 Listing NFT for sale:', { tokenId, price, contractAddress })
    setLastAction(`Listing Token #${tokenId}`)

    try {
      // For demo, just log the listing
      console.log('✅ Item listed successfully! (Demo mode)')
      
      /* Real marketplace contract call:
      await writeContract({
        address: MARKETPLACE_CONTRACT,
        abi: MARKETPLACE_ABI,
        functionName: 'listItem',
        args: [contractAddress, BigInt(tokenId), parseEther(price.toString())],
      })
      */
      
    } catch (error) {
      console.error('❌ Listing failed:', error)
      throw error
    }
  }

  // Cancel listing
  const cancelListing = async (listingId: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    console.log('❌ Cancelling listing:', listingId)
    setLastAction(`Cancelling listing`)

    try {
      // For demo, just log the cancellation
      console.log('✅ Listing cancelled successfully! (Demo mode)')
      
      /* Real marketplace contract call:
      await writeContract({
        address: MARKETPLACE_CONTRACT,
        abi: MARKETPLACE_ABI,
        functionName: 'cancelListing',
        args: [BigInt(listingId)],
      })
      */
      
    } catch (error) {
      console.error('❌ Cancellation failed:', error)
      throw error
    }
  }

  // Get user's listings
  const getUserListings = () => {
    return getMarketplaceListings().filter(listing => 
      listing.seller.toLowerCase() === address?.toLowerCase()
    )
  }

  // Get marketplace stats
  const getMarketplaceStats = () => {
    const listings = getMarketplaceListings()
    const totalListings = listings.length
    const totalVolume = listings.reduce((sum, listing) => sum + listing.price, 0)
    const floorPrice = Math.min(...listings.map(l => l.price))
    const avgPrice = totalVolume / totalListings

    return {
      totalListings,
      totalVolume,
      floorPrice,
      avgPrice,
      activeListings: listings.filter(l => l.isActive).length
    }
  }

  return {
    getMarketplaceListings,
    buyNFT,
    listNFTForSale,
    cancelListing,
    getUserListings,
    getMarketplaceStats,
    isPending: isPending || isConfirming,
    isConfirmed,
    isSuccess,
    error,
    hash,
    lastAction,
    purchasedItems,
    successMessage,
  }
}