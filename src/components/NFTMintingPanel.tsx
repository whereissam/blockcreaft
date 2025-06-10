import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useBlockcraftNFT } from '../hooks/useBlockcraftNFT'
import { useWeb3 } from '../hooks/useWeb3'
import { PLAYER_OUTFITS, type PlayerOutfit } from '../types/game'
import { Coins, Sparkles, Crown, Gem, CheckCircle, Shirt, X } from 'lucide-react'

interface NFTMintingPanelProps {
  onClose: () => void
}

export function NFTMintingPanel({ onClose }: NFTMintingPanelProps) {
  const { isConnected } = useWeb3()
  const { mintOutfitNFT, nftBalance, isPending, isConfirmed, error, lastMintedItem } = useBlockcraftNFT()
  const [selectedOutfit, setSelectedOutfit] = useState<PlayerOutfit | null>(null)

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
      case 'common': return 'text-gray-500'
      case 'rare': return 'text-blue-500'
      case 'epic': return 'text-purple-500'
      case 'legendary': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const mintableOutfits = PLAYER_OUTFITS.filter(outfit => outfit.mintable && !outfit.owned)

  const handleMintOutfit = async (outfit: PlayerOutfit) => {
    try {
      await mintOutfitNFT(outfit)
    } catch (err) {
      console.error('Failed to mint outfit NFT:', err)
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Shirt className="w-5 h-5 text-purple-400" />
                Outfit NFTs
              </CardTitle>
              <CardDescription className="text-gray-400">
                Connect wallet to mint outfit NFTs
              </CardDescription>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-400 text-center py-8">
            Connect your wallet to start minting outfit NFTs and customize your character!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-hidden">
      <CardHeader className="border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-purple-400" />
              Outfit NFTs
              <Badge className="bg-purple-600 text-white">
                {nftBalance} owned
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Mint and customize your character outfits
            </CardDescription>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 overflow-y-auto max-h-96">
        <div className="space-y-4">{/* Outfit Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mintableOutfits.map((outfit) => (
            <div key={outfit.id} className="border border-gray-700 rounded-lg p-4 space-y-3 bg-gray-900 hover:bg-gray-800 transition-colors">
              {/* Outfit Preview */}
              <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <div 
                  className="w-full h-full opacity-20 absolute inset-0"
                  style={{ backgroundColor: outfit.colors.primary }}
                />
                <div className="text-center z-10">
                  <Shirt className="w-12 h-12 mx-auto mb-2 text-white" />
                  <p className="text-white font-semibold">{outfit.name}</p>
                </div>
              </div>

              {/* Outfit Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">{outfit.name}</h3>
                  <div className={`flex items-center gap-1 ${getRarityColor(outfit.rarity)}`}>
                    {getRarityIcon(outfit.rarity)}
                    <Badge className={`text-xs ${
                      outfit.rarity === 'legendary' ? 'bg-purple-600' :
                      outfit.rarity === 'epic' ? 'bg-orange-600' :
                      outfit.rarity === 'rare' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {outfit.rarity}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm">{outfit.description}</p>
                
                {/* Color Palette */}
                <div className="flex gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: outfit.colors.primary }}
                    title="Primary color"
                  />
                  <div 
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: outfit.colors.secondary }}
                    title="Secondary color"
                  />
                  <div 
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: outfit.colors.accent }}
                    title="Accent color"
                  />
                </div>

                {/* Price and Mint Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-green-400 font-semibold flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    {outfit.price} ETH
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMintOutfit(outfit)}
                    disabled={isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isPending ? 'Minting...' : 'Mint NFT'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mintableOutfits.length === 0 && (
          <div className="text-center py-8">
            <Shirt className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No mintable outfits available</p>
            <p className="text-gray-500 text-sm">Check back later for new outfit drops!</p>
          </div>
        )}

        {/* Transaction Status */}
        {isPending && (
          <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800 mt-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
              <div>
                <p className="text-sm font-medium text-blue-300">
                  Minting {lastMintedItem}...
                </p>
                <p className="text-xs text-blue-400">
                  Please confirm the transaction in your wallet
                </p>
              </div>
            </div>
          </div>
        )}

        {isConfirmed && lastMintedItem && (
          <div className="bg-green-900/20 p-4 rounded-lg border border-green-800 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-300">
                  🎉 Successfully minted {lastMintedItem}!
                </p>
                <p className="text-xs text-green-400">
                  Your NFT will appear in your wallet and inventory
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 p-4 rounded-lg border border-red-800 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-300">
                  Transaction failed
                </p>
                <p className="text-xs text-red-400">
                  {String(error).includes('User rejected') ? 'You cancelled the transaction' : 'Please try again'}
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
}