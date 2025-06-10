import { Canvas } from '@react-three/fiber'
import { Sky, PointerLockControls } from '@react-three/drei'
import { MinecraftWorld } from './MinecraftWorld'
import { Player } from './Player'
import { NFTMintingPanel } from './NFTMintingPanel'
import { LandUI } from './LandUI'
import { Inventory } from './Inventory'
import { OutfitInventory } from './OutfitInventory'
import { Suspense, useState, useEffect } from 'react'
import { BLOCK_TYPES, type BlockType, type PlayerOutfit, PLAYER_OUTFITS } from '../types/game'
import { Button } from './ui/button'
import { Sparkles, Wallet, Package, Map, ShoppingCart, Camera } from 'lucide-react'
import { useWeb3 } from '../hooks/useWeb3'
import { useResourceNFT } from '../hooks/useResourceNFT'
import type { LandChunk } from '../types/land'
import { Link } from 'react-router-dom'

interface SceneProps {
  selectedBlock: BlockType
  onBlockSelect: (block: BlockType) => void
  selectedOutfit?: PlayerOutfit
  onOutfitChange?: (outfit: PlayerOutfit) => void
}


export function Scene({ selectedBlock, onBlockSelect, selectedOutfit = PLAYER_OUTFITS[0], onOutfitChange }: SceneProps) {
  const [pointerLocked, setPointerLocked] = useState(false)
  const [showNFTPanel, setShowNFTPanel] = useState(false)
  const [showLandUI, setShowLandUI] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showOutfitInventory, setShowOutfitInventory] = useState(false)
  const [selectedLand, setSelectedLand] = useState<LandChunk | null>(null)
  const [wantToMint, setWantToMint] = useState(false)
  const [cameraMode, setCameraMode] = useState<'first-person' | 'third-person' | 'top-down'>('third-person')
  const [outfitChangeNotification, setOutfitChangeNotification] = useState<string | null>(null)
  const { isConnected, connectWallet } = useWeb3()
  const { harvestResource, lastHarvested } = useResourceNFT()

  const handleMintClick = () => {
    // Exit pointer lock first to show UI
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
    
    if (!isConnected) {
      // Mark that user wants to mint, then connect wallet
      setWantToMint(true)
      connectWallet()
    } else {
      // Show NFT minting panel immediately
      setShowNFTPanel(true)
    }
  }

  // Auto-open mint panel when user connects wallet after wanting to mint
  const handleConnectSuccess = () => {
    if (wantToMint && isConnected) {
      setShowNFTPanel(true)
      setWantToMint(false)
    }
  }

  // Handle block mining/harvesting
  const handleBlockMined = async (blockType: BlockType) => {
    if (!isConnected) return
    
    try {
      await harvestResource(blockType.name)
      console.log('🎉 Resource harvested:', blockType.name)
    } catch (error) {
      console.error('Failed to harvest resource:', error)
    }
  }

  // Handle land chunk selection
  const handleLandSelect = (chunk: LandChunk) => {
    setSelectedLand(chunk)
    setShowLandUI(true)
    setPointerLocked(false) // Unlock cursor for UI interaction
  }

  // Handle outfit changes with notification
  const handleOutfitChange = (outfit: PlayerOutfit) => {
    if (onOutfitChange) {
      onOutfitChange(outfit)
      setOutfitChangeNotification(`✨ Equipped: ${outfit.name}`)
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setOutfitChangeNotification(null)
      }, 3000)
    }
  }

  // Watch for connection changes
  useEffect(() => {
    handleConnectSuccess()
  }, [isConnected, wantToMint])

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ 
          position: [0, 20, 0], 
          fov: 75,
          near: 0.1,
          far: 1000 
        }}
        shadows
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true
        }}
        style={{ 
          pointerEvents: (showNFTPanel || showInventory || showLandUI || showOutfitInventory) ? 'none' : 'auto'
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault()
            console.log('WebGL context lost, attempting to restore...')
          })
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored')
          })
        }}
      >
        <Suspense fallback={null}>
          <Sky 
            sunPosition={[100, 20, 100]} 
            inclination={0.6}
            azimuth={0.25}
          />
          
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[50, 50, 50]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={200}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          
          <PointerLockControls 
            onLock={() => setPointerLocked(true)}
            onUnlock={() => setPointerLocked(false)}
            enabled={!showNFTPanel && !showInventory && !showLandUI && !showOutfitInventory}
          />
          
          <Player selectedBlock={selectedBlock} outfit={selectedOutfit} cameraMode={cameraMode} />
          <MinecraftWorld onBlockMined={handleBlockMined} onLandSelect={handleLandSelect} />
        </Suspense>
      </Canvas>
      
      {!pointerLocked && !showNFTPanel && !showInventory && !showLandUI && !showOutfitInventory && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xl z-10 pointer-events-none">
          Click to play
        </div>
      )}
      
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black bg-opacity-50 rounded-lg p-4">
          <h3 className="text-white font-bold mb-2">🎮 Controls</h3>
          <div className="text-white text-sm space-y-1">
            <div>🖱️ <strong>Click screen</strong> - Enter game</div>
            <div>⌨️ <strong>ESC</strong> - Exit game/Access wallet</div>
            <div>WASD - Move around</div>
            <div>Mouse - Look around</div>
            <div>Left Click - Remove block</div>
            <div>Right Click - Place block</div>
            <div>Space - Fly up</div>
            <div>Shift - Fly down</div>
            <div>1-9 - Select block type</div>
            <div>Scroll - Change block</div>
          </div>
          <div className="text-purple-300 text-xs mt-2 border-t border-gray-600 pt-2">
            📷 <strong>Camera:</strong> {cameraMode === 'first-person' ? '1st Person' : cameraMode === 'third-person' ? '3rd Person' : 'Top Down'}
          </div>
          <div className="text-yellow-300 text-xs mt-1">
            💡 Press ESC to access wallet and change outfits!
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black bg-opacity-50 rounded-lg p-2">
          <div className="flex space-x-2">
            {BLOCK_TYPES.slice(0, 9).map((blockType, index) => (
              <button
                key={blockType.id}
                onClick={() => onBlockSelect(blockType)}
                className={`w-12 h-12 rounded border-2 flex items-center justify-center text-white font-bold relative ${
                  selectedBlock.id === blockType.id 
                    ? 'border-white' 
                    : 'border-gray-500 hover:border-gray-300'
                }`}
                style={{ backgroundColor: blockType.color }}
                title={`${index + 1}. ${blockType.name} ${blockType.mintable ? '(Mintable NFT)' : ''}`}
              >
                {index + 1}
                {blockType.mintable && (
                  <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />
                )}
              </button>
            ))}
          </div>
          <div className="text-white text-center mt-2 text-sm space-y-1">
            <div>
              Selected: {selectedBlock.name}
              {selectedBlock.mintable && (
                <span className="ml-2 text-yellow-300">✨ NFT</span>
              )}
            </div>
            {selectedBlock.mintable && (
              <div className="space-y-1">
                <Button
                  onClick={handleMintClick}
                  size="sm"
                  className={isConnected ? "bg-purple-600 hover:bg-purple-700 text-xs" : "bg-blue-600 hover:bg-blue-700 text-xs"}
                >
                  {isConnected ? (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mint as NFT
                    </>
                  ) : (
                    <>
                      <Wallet className="w-3 h-3 mr-1" />
                      Connect to Mint
                    </>
                  )}
                </Button>
                {wantToMint && !isConnected && (
                  <div className="text-xs text-yellow-300 text-center">
                    Please connect your wallet to continue minting...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <div 
          className="w-4 h-4 border-2 rounded-full opacity-80"
          style={{ borderColor: selectedBlock.color }}
        />
      </div>

      {/* Game UI Controls */}
      {!pointerLocked && (
        <div className="absolute top-4 right-4 z-10 space-y-2">
          <Button
            onClick={() => setShowInventory(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Resources
          </Button>
          
          <Button
            onClick={() => setShowOutfitInventory(true)}
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            My NFTs
          </Button>
          
          <Button
            onClick={() => setShowLandUI(true)}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <Map className="w-4 h-4" />
            Land Map
          </Button>
          
          <Link to="/marketplace">
            <Button
              className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Marketplace
            </Button>
          </Link>
          
          <Button
            onClick={() => {
              const modes: Array<typeof cameraMode> = ['first-person', 'third-person', 'top-down']
              const currentIndex = modes.indexOf(cameraMode)
              const nextIndex = (currentIndex + 1) % modes.length
              setCameraMode(modes[nextIndex])
            }}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
            title={`Camera: ${cameraMode}`}
          >
            <Camera className="w-4 h-4" />
            {cameraMode === 'first-person' ? '1st' : cameraMode === 'third-person' ? '3rd' : 'Top'}
          </Button>
        </div>
      )}

      {/* Resource Harvest Notification */}
      {lastHarvested && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
            🎉 Harvested: {lastHarvested}
          </div>
        </div>
      )}

      {/* Outfit Change Notification */}
      {outfitChangeNotification && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse border border-purple-400">
            👔 {outfitChangeNotification}
          </div>
        </div>
      )}

      {/* UI Overlays */}
      <NFTMintingPanel 
        isVisible={showNFTPanel} 
        onClose={() => setShowNFTPanel(false)} 
      />
      
      <LandUI
        selectedChunk={selectedLand}
        isVisible={showLandUI}
        onClose={() => {
          setShowLandUI(false)
          setSelectedLand(null)
        }}
      />
      
      <Inventory
        isVisible={showInventory}
        onClose={() => setShowInventory(false)}
      />
      
      
      <OutfitInventory
        isVisible={showOutfitInventory}
        onClose={() => setShowOutfitInventory(false)}
        currentOutfit={selectedOutfit}
        onOutfitChange={handleOutfitChange}
      />

      {/* NFT Minting Panel */}
      {showNFTPanel && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <NFTMintingPanel 
            onClose={() => setShowNFTPanel(false)} 
          />
        </div>
      )}
    </div>
  )
}