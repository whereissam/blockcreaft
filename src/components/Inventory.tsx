import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useResourceNFT } from '../hooks/useResourceNFT'
import { useWeb3 } from '../hooks/useWeb3'
import { Package, Coins, TrendingUp, X } from 'lucide-react'

interface InventoryProps {
  isVisible: boolean
  onClose: () => void
}

export function Inventory({ isVisible, onClose }: InventoryProps) {
  const { isConnected } = useWeb3()
  const { getInventory, getTotalValue } = useResourceNFT()
  const [selectedTab, setSelectedTab] = useState<'resources' | 'nfts'>('resources')

  const inventory = getInventory()
  const totalValue = getTotalValue()

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Inventory
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your resources and NFTs
              </CardDescription>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={selectedTab === 'resources' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('resources')}
              className={selectedTab === 'resources' ? 'bg-blue-600' : 'text-gray-400'}
            >
              Resources
            </Button>
            <Button
              variant={selectedTab === 'nfts' ? 'default' : 'ghost'}
              size="sm" 
              onClick={() => setSelectedTab('nfts')}
              className={selectedTab === 'nfts' ? 'bg-blue-600' : 'text-gray-400'}
            >
              NFTs
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-96">
          {!isConnected ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Connect wallet to view inventory</p>
            </div>
          ) : (
            <>
              {selectedTab === 'resources' && (
                <div className="space-y-4">
                  {/* Total Value */}
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <div>
                      <p className="text-gray-400 text-sm">Total Value</p>
                      <p className="text-white font-semibold text-lg">{totalValue} ETH</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>

                  {/* Resource List */}
                  {inventory.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">No resources yet</p>
                      <p className="text-gray-500 text-sm">Start mining blocks to collect resources!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {inventory.map(({ type, amount, resource, value }) => (
                        <div key={type} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: resource?.color || '#666' }}
                            >
                              {type[0].toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-white font-medium capitalize">{type}</h4>
                              <p className="text-gray-400 text-sm">
                                {amount} items • {resource?.rarity}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-green-400 font-semibold flex items-center gap-1">
                              <Coins className="w-4 h-4" />
                              {value}
                            </div>
                            <Badge 
                              className={`text-xs ${
                                resource?.rarity === 'legendary' ? 'bg-purple-600' :
                                resource?.rarity === 'epic' ? 'bg-orange-600' :
                                resource?.rarity === 'rare' ? 'bg-blue-600' :
                                resource?.rarity === 'uncommon' ? 'bg-green-600' : 
                                'bg-gray-600'
                              }`}
                            >
                              {resource?.rarity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'nfts' && (
                <div className="space-y-4">
                  {/* NFT Collection */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Mock NFTs - in production, fetch from contract */}
                    {[
                      { name: 'Cyber Punk Outfit', type: 'Outfit', rarity: 'epic' },
                      { name: 'Diamond Block', type: 'Block', rarity: 'legendary' },
                      { name: 'Land Chunk #42', type: 'Land', rarity: 'rare' }
                    ].map((nft, index) => (
                      <div key={index} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                        <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-600" />
                        </div>
                        <h4 className="text-white font-medium text-sm mb-1">{nft.name}</h4>
                        <p className="text-gray-400 text-xs mb-2">{nft.type}</p>
                        <Badge 
                          className={`text-xs ${
                            nft.rarity === 'legendary' ? 'bg-purple-600' :
                            nft.rarity === 'epic' ? 'bg-orange-600' :
                            nft.rarity === 'rare' ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          {nft.rarity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>

        {isConnected && (
          <div className="border-t border-gray-700 p-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => {
                  onClose()
                  // Note: Parent component will need to handle opening marketplace
                }}
              >
                View Marketplace
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // TODO: Open sell items modal
                  console.log('Opening sell items modal...')
                }}
              >
                Sell Items
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}