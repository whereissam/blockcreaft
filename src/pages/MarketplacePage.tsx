import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useMarketplace } from '../hooks/useMarketplace'
import { useWeb3 } from '../hooks/useWeb3'
import { 
  ShoppingCart, 
  Tag, 
  TrendingUp, 
  Filter, 
  Search, 
  ArrowLeft,
  Coins,
  Shirt,
  Package,
  Map,
  Sparkles,
  Crown,
  Gem,
  Home
} from 'lucide-react'

export function MarketplacePage() {
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
    if (!isConnected) {
      console.log('👛 Wallet not connected, prompting user...')
      connectWallet()
      return
    }

    try {
      await buyNFT(listingId)
    } catch (error) {
      console.error('Failed to buy NFT:', error)
      alert('Failed to purchase NFT. Please check your wallet connection and try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 relative">
      {/* Header Navigation */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Game
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">NFT Marketplace</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Home className="w-4 h-4 mr-2" />
                  Game World
                </Button>
              </Link>
              {isConnected ? (
                <Button 
                  onClick={() => setShowListingModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  List Item
                </Button>
              ) : (
                <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8 bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
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
                      selectedCategory === key ? 'bg-blue-600 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
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
                      priceFilter === key ? 'bg-purple-600 text-white' : 'border-white/20 text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Stats */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6 text-center">
                <p className="text-white/70 text-sm">Total Listings</p>
                <p className="text-white font-semibold text-xl">{listings.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6 text-center">
                <p className="text-white/70 text-sm">Floor Price</p>
                <p className="text-green-400 font-semibold text-xl">
                  {Math.min(...listings.map(l => l.price)).toFixed(4)} ETH
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6 text-center">
                <p className="text-white/70 text-sm">Volume (24h)</p>
                <p className="text-blue-400 font-semibold text-xl">2.34 ETH</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6 text-center">
                <p className="text-white/70 text-sm">Active Traders</p>
                <p className="text-purple-400 font-semibold text-xl">127</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Items Grid */}
        {!isConnected ? (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <h3 className="text-white text-xl mb-2">Connect wallet to browse marketplace</h3>
              <p className="text-white/70 mb-4">Buy and sell NFTs with other players</p>
              <Button onClick={connectWallet} className="bg-green-600 hover:bg-green-700">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : filteredListings.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <h3 className="text-white text-xl mb-2">No items found</h3>
              <p className="text-white/70">Try adjusting your filters or be the first to list an item!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-6">
                  {/* NFT Preview */}
                  <div className="aspect-square bg-white/5 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    {listing.image ? (
                      <img src={listing.image} alt={listing.name} className="w-full h-full object-cover rounded-lg" />
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold truncate">{listing.name}</h3>
                      <div className="flex items-center gap-1 text-white/50">
                        {getRarityIcon(listing.rarity)}
                      </div>
                    </div>

                    <p className="text-white/70 text-sm">
                      Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </p>

                    {/* Price and Buy Button */}
                    <div className="space-y-3 pt-2">
                      <div className="text-green-400 font-bold flex items-center gap-1 text-lg">
                        <Coins className="w-5 h-5" />
                        {listing.price} ETH
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleBuyNFT(listing.id)}
                        disabled={isPending || purchasedItems.includes(listing.id)}
                        className={`w-full ${
                          purchasedItems.includes(listing.id) 
                            ? "bg-green-500 hover:bg-green-600" 
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {purchasedItems.includes(listing.id) 
                          ? '✅ Owned' 
                          : isPending 
                            ? 'Buying...' 
                            : 'Buy Now'
                        }
                      </Button>
                    </div>

                    {/* Additional Stats */}
                    <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/10">
                      <span>Listed {Math.floor(Math.random() * 5) + 1}h ago</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Floor: {(listing.price * 0.8).toFixed(4)} ETH</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Success notification */}
      {isSuccess && successMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse border border-green-500 z-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="font-semibold">{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}