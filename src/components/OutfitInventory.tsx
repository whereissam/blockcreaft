import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useWeb3 } from '../hooks/useWeb3'
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '../contracts/config'
import { BlockcraftOutfitsABI } from '../contracts/abis/BlockcraftOutfits'
import { BlockcraftLandABI } from '../contracts/abis/BlockcraftLand'
import { BlockcraftResourcesABI } from '../contracts/abis/BlockcraftResources'
import { Package, Coins, TrendingUp, X, Shirt, Map, Pickaxe } from 'lucide-react'
import { PLAYER_OUTFITS, type PlayerOutfit } from '../types/game'

interface OutfitInventoryProps {
  isVisible: boolean
  onClose: () => void
  currentOutfit?: PlayerOutfit
  onOutfitChange?: (outfit: PlayerOutfit) => void
}

interface NFTItem {
  id: string
  name: string
  type: 'outfit' | 'land' | 'resource'
  image: string
  equipped?: boolean
  rarity: string
  tokenId: number
}

export function OutfitInventory({ isVisible, onClose, currentOutfit, onOutfitChange }: OutfitInventoryProps) {
  const { isConnected, address } = useWeb3()
  const [selectedTab, setSelectedTab] = useState<'outfits' | 'land' | 'resources'>('outfits')
  const [ownedNFTs, setOwnedNFTs] = useState<NFTItem[]>([])

  // Read outfit balance
  const { data: outfitBalance } = useReadContract({
    address: CONTRACTS.OUTFITS,
    abi: BlockcraftOutfitsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Read land balance
  const { data: landBalance } = useReadContract({
    address: CONTRACTS.LAND,
    abi: BlockcraftLandABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Read resource balances
  const { data: resourceBalances } = useReadContract({
    address: CONTRACTS.RESOURCES,
    abi: BlockcraftResourcesABI,
    functionName: 'getUserResources',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Generate demo NFTs for now (since we just deployed and no NFTs exist yet)
  useEffect(() => {
    if (!isConnected) return

    const demoNFTs: NFTItem[] = []

    // Add default outfits as "owned"
    PLAYER_OUTFITS.forEach((outfit, index) => {
      demoNFTs.push({
        id: `outfit-${index}`,
        name: outfit.name,
        type: 'outfit',
        image: generateOutfitImage(outfit),
        equipped: currentOutfit?.name === outfit.name,
        rarity: outfit.rarity,
        tokenId: index
      })
    })

    // Add demo land chunks
    for (let i = 0; i < 3; i++) {
      demoNFTs.push({
        id: `land-${i}`,
        name: `Land Chunk (${i * 2}, ${i * 3})`,
        type: 'land',
        image: generateLandImage(i * 2, i * 3),
        rarity: 'common',
        tokenId: i
      })
    }

    // Add demo resources
    const resourceTypes = ['Wood', 'Stone', 'Iron', 'Gold', 'Diamond']
    resourceTypes.forEach((resource, index) => {
      demoNFTs.push({
        id: `resource-${index}`,
        name: `${resource} Resource`,
        type: 'resource',
        image: generateResourceImage(resource),
        rarity: index > 2 ? 'rare' : 'common',
        tokenId: index
      })
    })

    setOwnedNFTs(demoNFTs)
  }, [isConnected, currentOutfit])

  const generateOutfitImage = (outfit: PlayerOutfit): string => {
    const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${outfit.colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${outfit.colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="150" height="150" fill="url(#grad)" rx="10"/>
      <g transform="translate(75, 75)">
        <circle cx="0" cy="-30" r="12" fill="${outfit.colors.primary}" stroke="${outfit.colors.accent}" stroke-width="2"/>
        <rect x="-10" y="-15" width="20" height="25" fill="${outfit.colors.secondary}" rx="3"/>
        <rect x="-15" y="-10" width="6" height="15" fill="${outfit.colors.secondary}" rx="3"/>
        <rect x="9" y="-10" width="6" height="15" fill="${outfit.colors.secondary}" rx="3"/>
        <rect x="-6" y="10" width="5" height="15" fill="${outfit.colors.primary}" rx="2"/>
        <rect x="1" y="10" width="5" height="15" fill="${outfit.colors.primary}" rx="2"/>
      </g>
      <text x="75" y="135" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${outfit.name}</text>
    </svg>`
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  const generateLandImage = (x: number, z: number): string => {
    const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="150" fill="#228B22" rx="10"/>
      <rect x="15" y="15" width="120" height="120" fill="#32CD32" opacity="0.8" rx="5"/>
      <circle cx="40" cy="40" r="5" fill="#8B4513"/>
      <circle cx="110" cy="60" r="4" fill="#8B4513"/>
      <circle cx="75" cy="110" r="8" fill="#4169E1"/>
      <text x="75" y="135" text-anchor="middle" fill="white" font-size="10" font-weight="bold">Land (${x}, ${z})</text>
    </svg>`
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  const generateResourceImage = (resource: string): string => {
    const colors = {
      'Wood': '#8B4513',
      'Stone': '#9E9E9E',
      'Iron': '#C0C0C0',
      'Gold': '#FFD700',
      'Diamond': '#00E5FF'
    }
    
    const color = colors[resource as keyof typeof colors] || '#666'
    
    const svg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="150" fill="${color}" rx="10"/>
      <rect x="15" y="15" width="120" height="120" fill="${color}" opacity="0.8" rx="5"/>
      <rect x="30" y="30" width="90" height="90" fill="${color}" opacity="0.6" rx="5"/>
      <text x="75" y="80" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${resource}</text>
      <text x="75" y="135" text-anchor="middle" fill="white" font-size="10" opacity="0.9">RESOURCE</text>
    </svg>`
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  const handleEquipOutfit = (nft: NFTItem) => {
    if (nft.type === 'outfit' && onOutfitChange) {
      const outfit = PLAYER_OUTFITS.find(o => o.name === nft.name)
      if (outfit) {
        onOutfitChange(outfit)
        // Update equipped status
        setOwnedNFTs(prev => prev.map(item => ({
          ...item,
          equipped: item.type === 'outfit' ? item.id === nft.id : item.equipped
        })))
      }
    }
  }

  const filterNFTs = (type: 'outfits' | 'land' | 'resources') => {
    const typeMap = { outfits: 'outfit', land: 'land', resources: 'resource' }
    return ownedNFTs.filter(nft => nft.type === typeMap[type])
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-gray-800 border-gray-700 max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                My NFT Collection
              </CardTitle>
              <CardDescription className="text-gray-400">
                {isConnected ? 'Manage your Web3 assets' : 'Connect wallet to view your NFTs'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isConnected ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">Connect your wallet to view your NFT collection</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex space-x-2 mb-6">
                <Button
                  variant={selectedTab === 'outfits' ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab('outfits')}
                  className="flex items-center gap-2"
                >
                  <Shirt className="w-4 h-4" />
                  Outfits ({filterNFTs('outfits').length})
                </Button>
                <Button
                  variant={selectedTab === 'land' ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab('land')}
                  className="flex items-center gap-2"
                >
                  <Map className="w-4 h-4" />
                  Land ({filterNFTs('land').length})
                </Button>
                <Button
                  variant={selectedTab === 'resources' ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab('resources')}
                  className="flex items-center gap-2"
                >
                  <Pickaxe className="w-4 h-4" />
                  Resources ({filterNFTs('resources').length})
                </Button>
              </div>

              {/* NFT Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {filterNFTs(selectedTab).map((nft) => (
                  <Card key={nft.id} className="bg-gray-700 border-gray-600 overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                      />
                      {nft.equipped && (
                        <Badge className="absolute top-2 right-2 bg-green-600">
                          Equipped
                        </Badge>
                      )}
                      <Badge className={`absolute top-2 left-2 ${
                        nft.rarity === 'legendary' ? 'bg-purple-600' :
                        nft.rarity === 'epic' ? 'bg-orange-600' :
                        nft.rarity === 'rare' ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        {nft.rarity}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="text-white font-medium text-sm mb-2 truncate">
                        {nft.name}
                      </h4>
                      <div className="flex gap-2">
                        {nft.type === 'outfit' && !nft.equipped && (
                          <Button
                            size="sm"
                            onClick={() => handleEquipOutfit(nft)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            Equip
                          </Button>
                        )}
                        {nft.type === 'land' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            Visit
                          </Button>
                        )}
                        {nft.type === 'resource' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            Use
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filterNFTs(selectedTab).length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">
                    No {selectedTab} found. Start minting to build your collection!
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}