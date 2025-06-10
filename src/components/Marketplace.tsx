import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useMarketplace } from '../hooks/useMarketplace'
import { useWeb3 } from '../hooks/useWeb3'
import { 
  ShoppingCart, 
  Tag, 
  TrendingUp, 
  Filter, 
  Search, 
  X, 
  Coins,
  Shirt,
  Package,
  Map,
  Sparkles,
  Crown,
  Gem
} from 'lucide-react'

interface MarketplaceProps {
  isVisible: boolean
  onClose: () => void
}

export function Marketplace({ isVisible, onClose }: MarketplaceProps) {
  const { isConnected, connectWallet } = useWeb3()
  const { 
    getMarketplaceListings, 
    buyNFT, 
    listNFTForSale, 
    cancelListing,
    isPending,
    isSuccess,
    purchasedItems,
    successMessage
  } = useMarketplace()
  
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'outfits' | 'resources' | 'land'>('all')
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'high'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showListingModal, setShowListingModal] = useState(false)

  const listings = getMarketplaceListings()

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Coins className="w-4 h-4" />
      case 'rare': return <Sparkles className="w-4 h-4" />
      case 'epic': return <Gem className="w-4 h-4" />
      case 'legendary': return <Crown className="w-4 h-4" />
      default: return <Coins className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'outfit': return <Shirt className="w-5 h-5" />
      case 'resource': return <Package className="w-5 h-5" />
      case 'land': return <Map className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  const filteredListings = listings.filter(listing => {
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'outfits' && listing.type === 'outfit') ||
      (selectedCategory === 'resources' && listing.type === 'resource') ||
      (selectedCategory === 'land' && listing.type === 'land')
    
    const matchesSearch = searchTerm === '' || 
      listing.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPrice = priceFilter === 'all' ||
      (priceFilter === 'low' && listing.price <= 0.001) ||
      (priceFilter === 'high' && listing.price > 0.001)
    
    return matchesCategory && matchesSearch && matchesPrice
  })

  const handleBuyNFT = async (listingId: string) => {
    // Check if wallet is connected first
    if (!isConnected) {
      console.log('👛 Wallet not connected, prompting user...')
      connectWallet()
      return
    }

    try {
      await buyNFT(listingId)
    } catch (error) {
      console.error('Failed to buy NFT:', error)
      // Show user-friendly error message
      alert('Failed to purchase NFT. Please check your wallet connection and try again.')
    }
  }

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }}
      onMouseDown={(e) => {
        e.preventDefault() 
        e.stopPropagation()
        e.stopImmediatePropagation()
      }}
      onMouseUp={(e) => {
        e.preventDefault()
        e.stopPropagation() 
        e.stopImmediatePropagation()
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }}
      onPointerUp={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }}
    >
      <Card className="w-full max-w-6xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                NFT Marketplace
              </CardTitle>
              <CardDescription className="text-gray-400">
                Buy and sell player-owned NFTs
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowListingModal(true)}
                className="bg-green-600 hover:bg-green-700"
                disabled={!isConnected}
              >
                <Tag className="w-4 h-4 mr-2" />
                List Item
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            {/* Category Filter */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All Items', icon: <Filter className="w-4 h-4" /> },
                { key: 'outfits', label: 'Outfits', icon: <Shirt className="w-4 h-4" /> },
                { key: 'resources', label: 'Resources', icon: <Package className="w-4 h-4" /> },
                { key: 'land', label: 'Land', icon: <Map className="w-4 h-4" /> }
              ].map(({ key, label, icon }) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(key as any)}
                  className={`flex items-center gap-2 ${
                    selectedCategory === key ? 'bg-blue-600' : 'text-gray-400'
                  }`}
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>

            {/* Price Filter */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All Prices' },
                { key: 'low', label: '< 0.001 ETH' },
                { key: 'high', label: '> 0.001 ETH' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={priceFilter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriceFilter(key as any)}
                  className={`text-xs ${
                    priceFilter === key ? 'bg-purple-600' : 'border-gray-600 text-gray-300'
                  }`}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-96">
          {!isConnected ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">Connect wallet to browse marketplace</p>
              <p className="text-gray-500 mb-4">Buy and sell NFTs with other players</p>
              <Button onClick={connectWallet} className="bg-green-600 hover:bg-green-700">
                Connect Wallet
              </Button>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">No items found</p>
              <p className="text-gray-500">Try adjusting your filters or be the first to list an item!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                  {/* NFT Preview */}
                  <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    {listing.image ? (
                      <img src={listing.image} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        {getCategoryIcon(listing.type)}
                        <p className="text-white text-sm mt-2">{listing.name}</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={`text-xs ${
                        listing.rarity === 'legendary' ? 'bg-purple-600' :
                        listing.rarity === 'epic' ? 'bg-orange-600' :
                        listing.rarity === 'rare' ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        {listing.rarity}
                      </Badge>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold truncate">{listing.name}</h3>
                      <div className="flex items-center gap-1 text-gray-400">
                        {getRarityIcon(listing.rarity)}
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm">
                      Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </p>

                    {/* Price and Buy Button */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-green-400 font-bold flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        {listing.price} ETH
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.stopImmediatePropagation()
                          handleBuyNFT(listing.id)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.stopImmediatePropagation()
                        }}
                        onMouseUp={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.stopImmediatePropagation()
                        }}
                        disabled={isPending || purchasedItems.includes(listing.id)}
                        className={
                          purchasedItems.includes(listing.id) 
                            ? "bg-green-500 hover:bg-green-600" 
                            : isConnected 
                              ? "bg-blue-600 hover:bg-blue-700" 
                              : "bg-green-600 hover:bg-green-700"
                        }
                      >
                        {purchasedItems.includes(listing.id) 
                          ? '✅ Owned' 
                          : isPending 
                            ? 'Buying...' 
                            : isConnected 
                              ? 'Buy Now' 
                              : 'Connect Wallet'
                        }
                      </Button>
                    </div>

                    {/* Additional Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <span>Listed {Math.floor(Math.random() * 5) + 1}h ago</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Floor: {(listing.price * 0.8).toFixed(4)} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Marketplace Stats Footer */}
        {isConnected && (
          <div className="border-t border-gray-700 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm">Total Listings</p>
                <p className="text-white font-semibold">{listings.length}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Floor Price</p>
                <p className="text-green-400 font-semibold">
                  {Math.min(...listings.map(l => l.price)).toFixed(4)} ETH
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Volume (24h)</p>
                <p className="text-blue-400 font-semibold">2.34 ETH</p>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Success notification */}
      {isSuccess && successMessage && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse border border-green-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="font-semibold">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}