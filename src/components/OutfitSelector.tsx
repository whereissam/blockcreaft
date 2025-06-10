import React, { useState, useEffect } from 'react'
import { Buffer } from 'buffer'
import { getIPFSImageURL } from '../config/ipfsMapping'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { PLAYER_OUTFITS, type PlayerOutfit } from '../types/game'
import { useWeb3 } from '../hooks/useWeb3'
import { PlayerAvatar3D } from './PlayerAvatar3D'
import { Sparkles, Crown, Gem, Coins, ShoppingCart, Check, Wallet, CheckCircle } from 'lucide-react'

interface OutfitSelectorProps {
  selectedOutfit: PlayerOutfit
  onOutfitSelect: (outfit: PlayerOutfit) => void
  onClose: () => void
}

// ERC721 ABI for outfit NFTs (matches deployed contract)
const OUTFIT_NFT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "metadataURI", "type": "string" },
      { "internalType": "string", "name": "outfitName", "type": "string" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "string", "name": "outfitName", "type": "string" }
    ],
    "name": "ownsOutfit",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getOutfitsByOwner",
    "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getTokensByOwner",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Real BlockcraftOutfits contract on Base Sepolia
const OUTFIT_NFT_CONTRACT = "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF"

export function OutfitSelector({ selectedOutfit, onOutfitSelect, onClose }: OutfitSelectorProps) {
  const { isConnected, address, disconnect, connectWallet } = useWeb3()
  const [purchaseSuccess, setPurchaseSuccess] = useState<PlayerOutfit | null>(null)
  const [ownedOutfits, setOwnedOutfits] = useState<Set<string>>(new Set())
  const [pendingPurchase, setPendingPurchase] = useState<PlayerOutfit | null>(null)
  const [processingOutfitId, setProcessingOutfitId] = useState<number | null>(null)
  
  // Generate canvas fallback image for outfits
  const generateCanvasOutfitImage = (outfit: PlayerOutfit): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 350
    canvas.height = 350
    const ctx = canvas.getContext('2d')!
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 350, 350)
    gradient.addColorStop(0, outfit.colors.primary)
    gradient.addColorStop(0.5, outfit.colors.secondary)
    gradient.addColorStop(1, outfit.colors.accent)
    
    // Fill background
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 350, 350)
    
    // Draw character head (circle)
    ctx.globalAlpha = 0.8
    ctx.fillStyle = outfit.colors.accent
    ctx.beginPath()
    ctx.arc(175, 120, 40, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw character body (rectangle)
    ctx.globalAlpha = 0.9
    ctx.fillStyle = outfit.colors.primary
    ctx.fillRect(135, 160, 80, 100)
    
    // Draw character details (inner rectangle)
    ctx.globalAlpha = 0.7
    ctx.fillStyle = outfit.colors.secondary
    ctx.fillRect(150, 175, 50, 70)
    
    // Add text shadow effect
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.font = 'bold 22px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(outfit.name, 177, 292)
    
    // Add main text
    ctx.fillStyle = 'white'
    ctx.fillText(outfit.name, 175, 290)
    
    // Add rarity text
    ctx.font = '12px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(outfit.rarity.toUpperCase(), 175, 315)
    
    return canvas.toDataURL('image/png')
  }
  
  // Wagmi hooks for real transactions
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Read user's NFT balance
  const { refetch: refetchBalance } = useReadContract({
    address: OUTFIT_NFT_CONTRACT,
    abi: OUTFIT_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  // Read owned outfits using wagmi hook
  const { data: ownedOutfitNames, refetch: refetchOwnedOutfits } = useReadContract({
    address: OUTFIT_NFT_CONTRACT,
    abi: OUTFIT_NFT_ABI,
    functionName: 'getOutfitsByOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  // Function to load owned outfits from blockchain
  const loadOwnedOutfitsFromBlockchain = async () => {
    if (!address || !isConnected) {
      setOwnedOutfits(new Set())
      return
    }

    try {
      // Clear any fake localStorage data first
      const storageKey = `ownedOutfits_${address}`
      localStorage.removeItem(storageKey)
      
      console.log('🔍 Reading real blockchain ownership for:', address)
      
      // Refetch the latest data
      const result = await refetchOwnedOutfits()
      const outfitNames = result.data || []
      
      console.log('📦 Owned outfit names:', outfitNames)
      
      const ownedNames = new Set(outfitNames.filter(name => name && name.length > 0))
      
      setOwnedOutfits(ownedNames)
      saveOwnedOutfits(ownedNames)
      console.log('🎯 Total owned outfits:', ownedNames.size, Array.from(ownedNames))
      
    } catch (error) {
      console.error('Error loading outfits from blockchain:', error)
      setOwnedOutfits(new Set())
    }
  }


  // Function to save owned outfits to localStorage
  const saveOwnedOutfits = (outfits: Set<string>) => {
    if (!address) return
    
    const storageKey = `ownedOutfits_${address}`
    localStorage.setItem(storageKey, JSON.stringify([...outfits]))
  }

  // Load owned outfits when address/connection changes
  useEffect(() => {
    if (address && isConnected) {
      // Add small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        loadOwnedOutfitsFromBlockchain()
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setOwnedOutfits(new Set())
    }
  }, [address, isConnected])

  // Refetch balance and outfits after successful purchase
  useEffect(() => {
    if (isConfirmed) {
      refetchBalance()
      refetchOwnedOutfits()
    }
  }, [isConfirmed, refetchBalance, refetchOwnedOutfits])

  // Update owned outfits when data changes
  useEffect(() => {
    if (ownedOutfitNames && Array.isArray(ownedOutfitNames)) {
      const ownedNames = new Set(ownedOutfitNames.filter(name => name && name.length > 0))
      setOwnedOutfits(ownedNames)
      saveOwnedOutfits(ownedNames)
      console.log('🎯 Updated owned outfits:', ownedNames.size, Array.from(ownedNames))
    }
  }, [ownedOutfitNames])

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Coins className="w-4 h-4" />
      case 'rare': return <Sparkles className="w-4 h-4" />
      case 'epic': return <Gem className="w-4 h-4" />
      case 'legendary': return <Crown className="w-4 h-4" />
      default: return <Coins className="w-4 h-4" />
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-500 bg-gray-100 dark:bg-gray-800'
      case 'rare': return 'text-blue-500 bg-blue-100 dark:bg-blue-900'
      case 'epic': return 'text-purple-500 bg-purple-100 dark:bg-purple-900'
      case 'legendary': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900'
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-800'
    }
  }

  const handlePurchaseOutfit = async (outfit: PlayerOutfit) => {
    if (!isConnected || !address) return
    
    console.log('Purchasing outfit:', outfit.name, 'for', outfit.price, 'ETH')
    
    // Pre-transaction validation
    try {
      // Check if user has enough ETH for the transaction + gas
      const balance = await window.ethereum?.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
      
      const balanceInEth = parseInt(balance, 16) / 1e18
      const requiredEth = parseFloat(outfit.price || '0.0001')
      
      if (balanceInEth < requiredEth + 0.001) { // Add buffer for gas
        alert(`❌ Insufficient Balance\n\nYou need ${requiredEth + 0.001} ETH but only have ${balanceInEth.toFixed(6)} ETH\n\nGet free Base Sepolia ETH from:\nhttps://www.coinbase.com/faucets/base-ethereum-sepolia-faucet`)
        return
      }
    } catch (validationError) {
      console.warn('Balance check failed:', validationError)
      // Continue anyway - let the transaction attempt and show real error
    }
    
    // Set which outfit is being purchased and processed
    setPendingPurchase(outfit)
    setProcessingOutfitId(outfit.id)
    
    // Get IPFS image URL or generate fallback
    const ipfsImageURL = getIPFSImageURL(outfit.name, 'outfit')
    let imageURL = ipfsImageURL
    
    // If no IPFS CID available, generate canvas fallback
    if (!ipfsImageURL) {
      console.log('📦 No IPFS CID found, generating canvas image for:', outfit.name)
      imageURL = generateCanvasOutfitImage(outfit)
    } else {
      console.log('🌐 Using IPFS image for:', outfit.name, ipfsImageURL)
    }
    
    // Create metadata following OpenSea ERC721 standard
    const metadata = JSON.stringify({
      name: outfit.name,
      description: `${outfit.description} - A unique Blockcraft outfit NFT with ${outfit.rarity} rarity.`,
      image: imageURL,
      external_url: "https://blockcraft.game",
      attributes: [
        { trait_type: "Rarity", value: outfit.rarity },
        { trait_type: "Type", value: "Outfit" },
        { trait_type: "Game", value: "Blockcraft" },
        { trait_type: "Primary Color", value: outfit.colors.primary },
        { trait_type: "Secondary Color", value: outfit.colors.secondary },
        { trait_type: "Accent Color", value: outfit.colors.accent }
      ]
    })

    // Use data URI for metadata (alternative to IPFS for testing)
    const dataURI = `data:application/json;base64,${btoa(metadata)}`

    // This will trigger the wallet popup for payment
    writeContract({
      address: OUTFIT_NFT_CONTRACT,
      abi: OUTFIT_NFT_ABI,
      functionName: 'mint',
      args: [address, dataURI, outfit.name], // Use data URI instead of raw JSON
      value: parseEther(outfit.price || '0.0001'), // Use actual outfit price
    })
  }

  // Handle successful transaction
  React.useEffect(() => {
    if (isConfirmed && hash && pendingPurchase) {
      // Mark the purchased outfit as owned and refresh balance
      const newOwnedOutfits = new Set([...ownedOutfits, pendingPurchase.name])
      setOwnedOutfits(newOwnedOutfits)
      saveOwnedOutfits(newOwnedOutfits)
      
      // Don't auto-select or close - let user choose when to equip and close
      setPurchaseSuccess(pendingPurchase)
      setPendingPurchase(null)
      setProcessingOutfitId(null) // Clear processing state
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setPurchaseSuccess(null), 5000)
    }
  }, [isConfirmed, hash, pendingPurchase, ownedOutfits])
  
  // Clear processing state on error
  React.useEffect(() => {
    if (error) {
      setProcessingOutfitId(null)
      setPendingPurchase(null)
    }
  }, [error])

  const handleSelectOutfit = (outfit: PlayerOutfit) => {
    const isOwned = outfit.owned || ownedOutfits.has(outfit.name)
    if (isOwned) {
      onOutfitSelect(outfit)
      onClose() // Close modal when selecting an owned outfit
    }
  }

  // Helper function to check if outfit is owned
  const isOutfitOwned = (outfit: PlayerOutfit) => {
    return outfit.owned || ownedOutfits.has(outfit.name)
  }

  return (
    <div className="w-full max-w-6xl max-h-[95vh] bg-black/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-500/30 overflow-hidden">
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`
        }}></div>
        
        {/* Header */}
        <div className="relative text-center p-6 border-b border-purple-500/20">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              BLOCKCRAFT
            </span>
            <span className="text-white text-2xl ml-3">🧱</span>
          </h1>
          <p className="text-purple-300 text-lg mb-6">Choose Your Web3 Avatar</p>
          
          {/* Wallet Connection */}
          <div className="mx-auto max-w-md">
            {!isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 text-white">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Connect Your Wallet</span>
                </div>
                <Button 
                  onClick={connectWallet}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-xl border border-green-400/30 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-semibold">{address!.slice(0, 8)}...{address!.slice(-6)}</div>
                      <div className="text-xs text-green-400">Base Sepolia</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => disconnect()}
                    className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
                  >
                    Disconnect
                  </Button>
                </div>
                {ownedOutfits.size > 0 && (
                  <div className="bg-purple-500/20 rounded-xl p-3 border border-purple-400/30">
                    <p className="text-purple-200 font-medium text-sm">🎯 Real NFTs Owned: {Array.from(ownedOutfits).join(' • ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="relative p-6 overflow-y-auto" style={{maxHeight: 'calc(95vh - 200px)'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLAYER_OUTFITS.map((outfit) => (
            <div 
              key={outfit.id} 
              className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 space-y-4 transition-all cursor-pointer border-2 hover:scale-105 ${
                selectedOutfit.id === outfit.id 
                  ? 'border-purple-400 bg-gradient-to-br from-purple-900/50 to-blue-900/50 shadow-purple-500/25 shadow-2xl' 
                  : 'border-slate-600/50 hover:border-purple-500/50'
              }`}
              onClick={() => handleSelectOutfit(outfit)}
            >
              {/* Outfit Preview */}
              <div className="relative flex justify-center">
                <PlayerAvatar3D 
                  outfit={outfit} 
                  isSelected={selectedOutfit.id === outfit.id}
                  size="medium"
                />
                {selectedOutfit.id === outfit.id && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center z-10 shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Outfit Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl text-white">{outfit.name}</h3>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium ${getRarityColor(outfit.rarity)}`}>
                    {getRarityIcon(outfit.rarity)}
                    <span className="capitalize">{outfit.rarity}</span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-300">{outfit.description}</p>
                
                {/* Color Palette */}
                <div className="flex gap-2 justify-center">
                  {Object.values(outfit.colors).map((color, index) => (
                    <div 
                      key={index}
                      className="w-5 h-5 rounded-full border-2 border-white/50 shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {isOutfitOwned(outfit) ? (
                  <Button
                    className={`w-full py-3 rounded-xl font-bold ${
                      selectedOutfit.id === outfit.id 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                        : "bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600"
                    }`}
                    onClick={() => handleSelectOutfit(outfit)}
                  >
                    {selectedOutfit.id === outfit.id ? "✨ Currently Equipped" : "Equip Outfit"}
                  </Button>
                ) : outfit.mintable ? (
                  <>
                    {!isConnected ? (
                      <Button
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                        onClick={connectWallet}
                      >
                        <Wallet className="w-5 h-5 mr-2" />
                        Connect to Purchase
                      </Button>
                    ) : (
                      <Button
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white disabled:opacity-50"
                        onClick={() => handlePurchaseOutfit(outfit)}
                        disabled={processingOutfitId === outfit.id && (isPending || isConfirming)}
                      >
                        {processingOutfitId === outfit.id && isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                            Confirm in Wallet...
                          </>
                        ) : processingOutfitId === outfit.id && isConfirming ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            💎 Buy for {outfit.price} ETH
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 text-white" disabled>
                    🆓 Default Outfit
                  </Button>
                )}

                {outfit.mintable && isOutfitOwned(outfit) && (
                  <Button 
                    className="w-full py-2 rounded-lg text-sm font-medium bg-purple-600/20 text-purple-300 border border-purple-500/50 hover:bg-purple-500/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`https://testnets.opensea.io/assets/base_sepolia/${OUTFIT_NFT_CONTRACT.toLowerCase()}`, '_blank')
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    🌊 View on OpenSea
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl border border-purple-400/20">
          <div className="text-center">
            <h4 className="font-bold text-white mb-4 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              About NFT Outfits
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-purple-200">
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">🔗</span>
                <span className="text-center">Mint on Base Sepolia</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">💫</span>
                <span className="text-center">Special Effects</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">🔄</span>
                <span className="text-center">Tradeable NFTs</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">⛓️</span>
                <span className="text-center">Blockchain Owned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {isPending && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-400/30">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-400 border-t-transparent"></div>
              <div>
                <p className="font-bold text-white">
                  🔄 Purchasing outfit...
                </p>
                <p className="text-sm text-blue-300">
                  Please confirm the transaction in your wallet
                </p>
              </div>
            </div>
          </div>
        )}

        {isConfirming && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-400/30">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-400 border-t-transparent"></div>
              <div>
                <p className="font-bold text-white">
                  ⚡ Transaction processing...
                </p>
                <p className="text-sm text-purple-300">
                  Your outfit NFT is being minted on Base Sepolia
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-6 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-2xl border border-red-400/30">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">!</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white mb-2">
                  ❌ Transaction Failed
                </p>
                <p className="text-sm text-red-300 mb-3">
                  {String(error).includes('User rejected') || String(error).includes('User denied') ? 
                    'You cancelled the transaction in your wallet' : 
                    String(error).includes('insufficient funds') ?
                    'Insufficient Base Sepolia ETH for gas fees' :
                    String(error).includes('Simulation') ?
                    'Transaction simulation failed - check your wallet balance' :
                    'Transaction failed - please try again'
                  }
                </p>
                <div className="space-y-2">
                  {String(error).includes('insufficient funds') && (
                    <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-400/30">
                      <p className="text-yellow-200 text-sm font-medium">💡 Need Base Sepolia ETH?</p>
                      <p className="text-yellow-300 text-xs">Get free testnet ETH from the Base Sepolia faucet</p>
                      <button 
                        onClick={() => window.open('https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet', '_blank')}
                        className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg"
                      >
                        🚰 Get Free ETH
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-red-200 font-mono bg-red-900/20 p-2 rounded border max-h-20 overflow-y-auto">
                    {String(error)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {purchaseSuccess && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl border border-green-400/30 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-lg">
                  🎉 Successfully purchased {purchaseSuccess.name}!
                </p>
                <p className="text-sm text-green-300">
                  Your outfit NFT is now in your wallet
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <Button 
            onClick={onClose} 
            className="w-full text-xl py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
          >
            🚀 Start Adventure
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}