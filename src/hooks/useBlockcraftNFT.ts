import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { useState } from 'react'
import { type BlockType, type PlayerOutfit } from '../types/game'
import { useWeb3 } from './useWeb3'
import { getIPFSImageURL } from '../config/ipfsMapping'
import { CONTRACTS } from '../contracts/config'
import { BlockcraftOutfitsABI } from '../contracts/abis/BlockcraftOutfits'
import { BlockcraftLandABI } from '../contracts/abis/BlockcraftLand'

export function useBlockcraftNFT() {
  const { isConnected, address } = useWeb3()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const [lastMintedItem, setLastMintedItem] = useState<string | null>(null)
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const nftBalance = isConnected ? 5 : 0

  // Generate canvas fallback image for blocks
  const generateCanvasBlockImage = (blockType: BlockType): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 350
    canvas.height = 350
    const ctx = canvas.getContext('2d')!
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 350, 350)
    gradient.addColorStop(0, blockType.color)
    gradient.addColorStop(1, blockType.color + 'BB')
    
    // Fill background with gradient
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 350, 350)
    
    // Draw outer border
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, 350, 350)
    
    // Draw main block
    ctx.globalAlpha = 0.8
    ctx.fillStyle = blockType.color
    ctx.fillRect(40, 40, 270, 270)
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.strokeRect(40, 40, 270, 270)
    
    // Draw inner block
    ctx.globalAlpha = 0.6
    ctx.fillStyle = blockType.color
    ctx.fillRect(80, 80, 190, 190)
    
    // Add text shadow
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.font = 'bold 26px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(blockType.name, 177, 192)
    
    // Add main text
    ctx.fillStyle = 'white'
    ctx.fillText(blockType.name, 175, 190)
    
    // Add "BLOCK" text
    ctx.font = '14px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText('BLOCK', 175, 220)
    
    return canvas.toDataURL('image/png')
  }

  // Mint a block NFT with real wallet transaction
  const mintBlockNFT = async (blockType: BlockType) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    console.log('🔧 Starting mint process...')
    console.log('📍 Contract:', CONTRACTS.OUTFITS)
    console.log('👤 Address:', address)
    console.log('🧱 Block:', blockType.name)

    setLastMintedItem(blockType.name)

    // Get IPFS image URL or use publicly accessible fallback
    const ipfsImageURL = getIPFSImageURL(blockType.name, 'block')
    let imageURL = ipfsImageURL
    
    // If no IPFS CID available, use a publicly accessible fallback image
    if (!ipfsImageURL) {
      console.log('📦 No IPFS CID found, using fallback image for:', blockType.name)
      // Use a simple SVG that OpenSea can display
      const fallbackSVG = `<svg width="350" height="350" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${blockType.color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${blockType.color}88;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="350" height="350" fill="url(#grad)" stroke="#333" stroke-width="3"/>
        <rect x="40" y="40" width="270" height="270" fill="${blockType.color}" opacity="0.8" stroke="#666" stroke-width="2"/>
        <rect x="80" y="80" width="190" height="190" fill="${blockType.color}" opacity="0.6"/>
        <text x="175" y="185" text-anchor="middle" fill="white" font-size="26" font-weight="bold">${blockType.name}</text>
        <text x="175" y="220" text-anchor="middle" fill="white" font-size="14" opacity="0.9">BLOCK</text>
      </svg>`
      
      imageURL = `data:image/svg+xml;base64,${btoa(fallbackSVG)}`
    } else {
      console.log('🌐 Using IPFS image for:', blockType.name, ipfsImageURL)
      // Convert IPFS URL to public gateway URL for OpenSea compatibility
      if (ipfsImageURL.startsWith('ipfs://')) {
        const cid = ipfsImageURL.replace('ipfs://', '')
        imageURL = `https://gateway.pinata.cloud/ipfs/${cid}`
        console.log('🔗 Converted to public URL:', imageURL)
      }
    }

    // Create metadata following OpenSea ERC721 standard
    const metadata = {
      name: `${blockType.name} Block`,
      description: `A ${blockType.rarity} ${blockType.name} block from Blockcraft game. Perfect for building and crafting in the metaverse.`,
      image: imageURL,
      external_url: "https://blockcraft.game",
      attributes: [
        { trait_type: "Rarity", value: blockType.rarity },
        { trait_type: "Type", value: "Block" },
        { trait_type: "Game", value: "Blockcraft" },
        { trait_type: "Material", value: blockType.name },
        { trait_type: "Mintable", value: blockType.mintable ? "Yes" : "No" }
      ]
    }

    console.log('📋 Metadata created:', metadata)

    // Use data URI for metadata (alternative to IPFS for testing)
    const metadataString = JSON.stringify(metadata)
    const dataURI = `data:application/json;base64,${btoa(metadataString)}`
    
    console.log('🔗 Data URI length:', dataURI.length)

    try {
      console.log('📡 Calling writeContract...')
      
      // This will trigger the actual wallet transaction
      await writeContract({
        address: CONTRACTS.OUTFITS,
        abi: BlockcraftOutfitsABI,
        functionName: 'mint',
        args: [address, dataURI, blockType.name, blockType.rarity], 
        value: parseEther('0.0001'), // 0.0001 ETH mint fee
      })
      
      console.log('🚀 Mint transaction initiated for:', blockType.name)
    } catch (error) {
      console.error('❌ Mint transaction failed:', error)
      console.error('Error details:', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        cause: (error as any)?.cause
      })
      throw error
    }
  }

  // Mint land NFT with real wallet transaction  
  const mintLandNFT = async (chunkX: number, chunkZ: number) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    setLastMintedItem(`Land Chunk (${chunkX}, ${chunkZ})`)

    const metadata = JSON.stringify({
      name: `Blockcraft Land Chunk (${chunkX}, ${chunkZ})`,
      description: `A 16x16 land chunk in Blockcraft at coordinates (${chunkX}, ${chunkZ})`,
      image: "data:image/svg+xml;base64," + btoa(`<svg width="350" height="350" xmlns="http://www.w3.org/2000/svg"><rect width="350" height="350" fill="#228B22"/><text x="175" y="175" text-anchor="middle" fill="white" font-size="20">Land (${chunkX},${chunkZ})</text></svg>`),
      external_url: "https://blockcraft.game",
      attributes: [
        { trait_type: "Type", value: "Land" },
        { trait_type: "Chunk X", value: chunkX },
        { trait_type: "Chunk Z", value: chunkZ }
      ]
    })

    // Use data URI for metadata
    const dataURI = `data:application/json;base64,${btoa(metadata)}`

    try {
      // This will trigger the actual wallet transaction
      writeContract({
        address: CONTRACTS.LAND,
        abi: BlockcraftLandABI,
        functionName: 'mintLand',
        args: [BigInt(chunkX), BigInt(chunkZ)],
        value: parseEther('0.001'), // 0.001 ETH for land (matches contract)
      })
      console.log('🚀 Land mint transaction initiated for:', `(${chunkX}, ${chunkZ})`)
    } catch (error) {
      console.error('❌ Land mint transaction failed:', error)
      throw error
    }
  }

  // Mint outfit NFT
  const mintOutfitNFT = async (outfit: PlayerOutfit) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    console.log('🎽 Starting outfit mint process...', outfit.name)
    setLastMintedItem(outfit.name)

    // Generate outfit SVG image
    const outfitSVG = `<svg width="350" height="350" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${outfit.colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${outfit.colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="350" height="350" fill="url(#grad)" rx="20"/>
      
      <!-- Character silhouette -->
      <g transform="translate(175, 175)">
        <!-- Head -->
        <circle cx="0" cy="-80" r="25" fill="${outfit.colors.primary}" stroke="${outfit.colors.accent}" stroke-width="3"/>
        <!-- Body -->
        <rect x="-20" y="-50" width="40" height="60" fill="${outfit.colors.secondary}" rx="5"/>
        <!-- Arms -->
        <rect x="-35" y="-40" width="15" height="40" fill="${outfit.colors.secondary}" rx="7"/>
        <rect x="20" y="-40" width="15" height="40" fill="${outfit.colors.secondary}" rx="7"/>
        <!-- Legs -->
        <rect x="-15" y="10" width="12" height="40" fill="${outfit.colors.primary}" rx="6"/>
        <rect x="3" y="10" width="12" height="40" fill="${outfit.colors.primary}" rx="6"/>
        
        <!-- Outfit details -->
        <circle cx="0" cy="-30" r="5" fill="${outfit.colors.accent}"/>
        <rect x="-10" y="-20" width="20" height="3" fill="${outfit.colors.accent}" rx="1"/>
      </g>
      
      <!-- Outfit name -->
      <text x="175" y="300" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${outfit.name}</text>
      <text x="175" y="325" text-anchor="middle" fill="white" font-size="14" opacity="0.9">${outfit.rarity.toUpperCase()}</text>
    </svg>`
    
    const imageURL = `data:image/svg+xml;base64,${btoa(outfitSVG)}`

    // Create metadata following OpenSea ERC721 standard
    const metadata = {
      name: outfit.name,
      description: outfit.description,
      image: imageURL,
      external_url: "https://blockcraft.game",
      attributes: [
        { trait_type: "Rarity", value: outfit.rarity },
        { trait_type: "Type", value: "Outfit" },
        { trait_type: "Game", value: "Blockcraft" },
        { trait_type: "Head", value: outfit.parts.head },
        { trait_type: "Body", value: outfit.parts.body },
        { trait_type: "Legs", value: outfit.parts.legs },
        { trait_type: "Feet", value: outfit.parts.feet },
        { trait_type: "Primary Color", value: outfit.colors.primary },
        { trait_type: "Secondary Color", value: outfit.colors.secondary },
        { trait_type: "Accent Color", value: outfit.colors.accent }
      ]
    }

    const dataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`

    try {
      await writeContract({
        address: CONTRACTS.OUTFITS,
        abi: BlockcraftOutfitsABI,
        functionName: 'mint',
        args: [address, dataURI, outfit.name, outfit.rarity],
        value: parseEther(outfit.price || '0.0001'),
      })
      
      console.log('🚀 Outfit mint transaction initiated for:', outfit.name)
    } catch (error) {
      console.error('❌ Outfit mint transaction failed:', error)
      throw error
    }
  }

  return {
    nftBalance,
    mintBlockNFT,
    mintLandNFT,
    mintOutfitNFT,
    isLandOwned: false,
    isPending: isPending || isConfirming,
    isConfirmed,
    error,
    hash,
    lastMintedItem,
  }
}