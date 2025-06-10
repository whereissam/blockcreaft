import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useLandNFT } from '../hooks/useLandNFT'
import { useWeb3 } from '../hooks/useWeb3'
import { MapPin, Coins, Clock, User, ShoppingCart } from 'lucide-react'
import type { LandChunk } from '../types/land'

interface LandUIProps {
  selectedChunk: LandChunk | null
  onClose: () => void
  isVisible: boolean
}

export function LandUI({ selectedChunk, onClose, isVisible }: LandUIProps) {
  const { isConnected } = useWeb3()
  const { buyLand, rentLand, getLandStatus, isPending } = useLandNFT()
  const [landStatus, setLandStatus] = useState<any>(null)
  const [rentDuration, setRentDuration] = useState(7) // Default 7 days

  useEffect(() => {
    if (selectedChunk) {
      const status = getLandStatus(selectedChunk.id)
      setLandStatus(status)
    }
  }, [selectedChunk, getLandStatus])

  const handleBuyLand = async () => {
    if (!selectedChunk) return
    
    try {
      await buyLand(selectedChunk.id)
    } catch (error) {
      console.error('Failed to buy land:', error)
    }
  }

  const handleRentLand = async () => {
    if (!selectedChunk) return
    
    try {
      await rentLand(selectedChunk.id, rentDuration)
    } catch (error) {
      console.error('Failed to rent land:', error)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                {selectedChunk ? `Land Chunk #${selectedChunk.id}` : 'Land Browser'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {selectedChunk 
                  ? `Coordinates: (${selectedChunk.x}, ${selectedChunk.z})`
                  : 'Browse and manage land chunks'
                }
              </CardDescription>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400">
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto">
          {selectedChunk ? (
            <div className="space-y-4">
              {/* Land Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  <div className="flex gap-2">
                    {landStatus?.owned && (
                      <Badge className="bg-green-600 text-white">Owned</Badge>
                    )}
                    {landStatus?.rented && (
                      <Badge className="bg-yellow-600 text-white">Rented</Badge>
                    )}
                    {landStatus?.available && (
                      <Badge className="bg-blue-600 text-white">Available</Badge>
                    )}
                  </div>
                </div>

                {landStatus?.owner && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Owner:</span>
                    <span className="text-blue-400 font-mono text-sm">
                      {landStatus.owner.slice(0, 6)}...{landStatus.owner.slice(-4)}
                    </span>
                  </div>
                )}

                {landStatus?.price && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Sale Price:</span>
                    <span className="text-green-400 font-semibold flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {landStatus.price} ETH
                    </span>
                  </div>
                )}

                {landStatus?.rentPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rent Price:</span>
                    <span className="text-yellow-400 font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {landStatus.rentPrice} ETH/day
                    </span>
                  </div>
                )}
              </div>

              {/* Land Resources */}
              <div className="space-y-2">
                <h4 className="text-white font-medium">Available Resources:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['Wood', 'Stone', 'Iron'].map((resource) => (
                    <div key={resource} className="text-center p-2 bg-gray-900 rounded border border-gray-700">
                      <div className="text-xs text-gray-400">{resource}</div>
                      <div className="text-white font-semibold">{Math.floor(Math.random() * 50) + 10}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {isConnected && (
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  {landStatus?.available && landStatus?.price && (
                    <Button
                      onClick={handleBuyLand}
                      disabled={isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {isPending ? 'Purchasing...' : `Buy for ${landStatus.price} ETH`}
                    </Button>
                  )}

                  {landStatus?.rentPrice && !landStatus?.rented && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-gray-400 text-sm">Rent Duration:</label>
                        <select 
                          value={rentDuration}
                          onChange={(e) => setRentDuration(Number(e.target.value))}
                          className="bg-gray-900 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                        >
                          <option value={1}>1 day</option>
                          <option value={7}>7 days</option>
                          <option value={30}>30 days</option>
                        </select>
                      </div>
                      <Button
                        onClick={handleRentLand}
                        disabled={isPending}
                        className="w-full bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {isPending ? 'Renting...' : `Rent for ${(landStatus.rentPrice * rentDuration).toFixed(4)} ETH`}
                      </Button>
                    </div>
                  )}

                  {landStatus?.owned && (
                    <div className="text-center p-3 bg-green-900/20 rounded border border-green-700">
                      <User className="w-5 h-5 mx-auto mb-1 text-green-400" />
                      <p className="text-green-400 text-sm">You own this land!</p>
                    </div>
                  )}

                  {landStatus?.rented && (
                    <div className="text-center p-3 bg-yellow-900/20 rounded border border-yellow-700">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                      <p className="text-yellow-400 text-sm">This land is currently rented</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <h3 className="text-white font-semibold mb-2">Available Land Chunks</h3>
                <p className="text-gray-400 text-sm">Right-click on blocks in the 3D world to view specific chunks</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 1001, x: 1, z: 0, price: 0.001, rented: false },
                  { id: 1002, x: 1, z: 1, price: 0.0015, rented: false },
                  { id: 1003, x: 0, z: 1, price: 0.001, rented: true },
                  { id: 1004, x: -1, z: 0, price: 0.002, rented: false }
                ].map((chunk) => (
                  <div key={chunk.id} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium text-sm">Chunk #{chunk.id}</h4>
                      <Badge className={chunk.rented ? "bg-yellow-600" : "bg-green-600"}>
                        {chunk.rented ? "Rented" : "Available"}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs mb-2">Coords: ({chunk.x}, {chunk.z})</p>
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-semibold flex items-center gap-1 text-sm">
                        <Coins className="w-3 h-3" />
                        {chunk.price} ETH
                      </span>
                      {!chunk.rented && (
                        <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-sm">
                  💡 <strong>Tip:</strong> Right-click blocks in the 3D world to interact with specific land chunks
                </p>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="text-center p-3 bg-red-900/20 rounded border border-red-700">
              <p className="text-red-400 text-sm">Connect wallet to interact with land</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}