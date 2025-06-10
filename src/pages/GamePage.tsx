import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scene } from '../components/Scene'
import { OutfitSelector } from '../components/OutfitSelector'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { WalletConnect } from '../components/WalletConnect'
import { Settings, User, ShoppingCart } from 'lucide-react'
import { BLOCK_TYPES, PLAYER_OUTFITS, type BlockType, type PlayerOutfit } from '../types/game'

export function GamePage() {
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<BlockType>(BLOCK_TYPES[0])
  const [selectedOutfit, setSelectedOutfit] = useState<PlayerOutfit>(PLAYER_OUTFITS[0])
  const [showOutfitSelector, setShowOutfitSelector] = useState(true) // Show outfit selector first
  const [showMenu, setShowMenu] = useState(true)

  const startGame = () => {
    setGameStarted(true)
    setShowMenu(false)
  }

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  const handleBlockSelect = (blockType: BlockType) => {
    setSelectedBlock(blockType)
  }

  const handleOutfitSelect = (outfit: PlayerOutfit) => {
    setSelectedOutfit(outfit)
    setShowOutfitSelector(false)
  }

  // First screen: Outfit selection (character creation/login)
  if (showOutfitSelector && !gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-green-900 flex items-center justify-center p-4">
        <OutfitSelector
          selectedOutfit={selectedOutfit}
          onOutfitSelect={handleOutfitSelect}
          onClose={() => setShowOutfitSelector(false)}
        />
      </div>
    )
  }

  // Second screen: Game menu/start screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-green-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              🧱 Blockcraft
            </CardTitle>
            <CardDescription className="text-lg">
              Build, explore, and own your digital world
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedOutfit.colors.primary }}
                >
                  {selectedOutfit.name[0]}
                </div>
                <span className="font-semibold">Ready to play as {selectedOutfit.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your avatar is equipped and ready for adventure!
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={startGame}
                  size="lg" 
                  className="w-full max-w-xs mx-auto text-lg py-6"
                >
                  🚀 Enter World
                </Button>
                
                <Button 
                  onClick={() => setShowOutfitSelector(true)}
                  variant="outline"
                  size="lg"
                  className="w-full max-w-xs mx-auto text-lg py-4"
                >
                  <User className="w-5 h-5 mr-2" />
                  👔 Change Outfit
                </Button>

                <Link to="/marketplace">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="w-full max-w-xs mx-auto text-lg py-4"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    🛒 Visit Marketplace
                  </Button>
                </Link>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Connect your wallet to mint items and own land</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative">
      <Scene 
        selectedBlock={selectedBlock} 
        onBlockSelect={handleBlockSelect} 
        selectedOutfit={selectedOutfit}
        onOutfitChange={setSelectedOutfit}
      />
      
      {showMenu && (
        <div className="absolute top-4 right-4 z-50">
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="text-lg">🧱 Blockcraft</CardTitle>
              <CardDescription>Web3 Game Menu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <WalletConnect />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowOutfitSelector(true)}
              >
                <User className="w-4 h-4 mr-2" />
                Change Outfit
              </Button>
              <Link to="/marketplace">
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Visit Marketplace
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/admin'}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowMenu(false)}
              >
                Resume Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Button
        onClick={toggleMenu}
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-40"
        style={{ display: showMenu ? 'none' : 'flex' }}
      >
        <Settings className="w-4 h-4" />
      </Button>

      {/* Outfit Selector Modal */}
      {showOutfitSelector && gameStarted && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <OutfitSelector
            selectedOutfit={selectedOutfit}
            onOutfitSelect={handleOutfitSelect}
            onClose={() => setShowOutfitSelector(false)}
          />
        </div>
      )}
    </div>
  )
}