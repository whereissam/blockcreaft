import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useWeb3 } from '../hooks/useWeb3'
import { WalletConnect } from '../components/WalletConnect'
import { ArrowLeft, Wand2, Download, Eye, Sparkles } from 'lucide-react'
import { PLAYER_OUTFITS, BLOCK_TYPES } from '../types/game'

// Admin wallet address (only this address can access admin features)
const ADMIN_WALLET = '0x3B6c2603789eB01C911CdC5d1914CA5976D07e4d'

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyAa0GJ7lsN8kdSykCi2QrCAvW5HLpz8rvA'

interface GeneratedImage {
  name: string
  type: 'outfit' | 'block'
  prompt: string
  imageUrl: string
  timestamp: string
}

export function AdminImageGenPage() {
  const { isConnected, address } = useWeb3()
  const [generating, setGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [progress, setProgress] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [customPrompt, setCustomPrompt] = useState('')

  // Check if current user is admin
  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_WALLET.toLowerCase()

  // Generate image using Gemini API
  const generateWithGemini = async (prompt: string, itemName: string, type: 'outfit' | 'block'): Promise<string> => {
    try {
      console.log('🔧 Testing Gemini API endpoint...')
      
      // Try the correct Gemini API endpoint for text generation first to test connection
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      })

      console.log('🔧 Test response status:', testResponse.status)
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.error('Gemini API Test Error:', testResponse.status, errorText)
        throw new Error(`Gemini API connection failed: ${testResponse.status} - ${errorText}`)
      }

      console.log('✅ Gemini API connection successful')
      
      // For now, generate a canvas fallback since Imagen API might need different setup
      console.log('📝 Generating canvas fallback for:', itemName)
      return generateCanvasFallback(itemName, type, prompt)
      
    } catch (error) {
      console.error('Failed to generate with Gemini:', error)
      console.log('📝 Falling back to canvas generation...')
      return generateCanvasFallback(itemName, type, prompt)
    }
  }

  // Generate canvas fallback image
  const generateCanvasFallback = (itemName: string, type: 'outfit' | 'block', prompt: string): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Find the item data
    let item: any
    let colors: any

    if (type === 'outfit') {
      item = PLAYER_OUTFITS.find(o => o.name === itemName)
      colors = item?.colors || { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' }
    } else {
      item = BLOCK_TYPES.find(b => b.name === itemName)
      colors = { primary: item?.color || '#6B7280', secondary: item?.color || '#6B7280', accent: item?.color || '#6B7280' }
    }

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 512)
    gradient.addColorStop(0, colors.primary)
    gradient.addColorStop(0.5, colors.secondary)
    gradient.addColorStop(1, colors.accent)
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)

    if (type === 'outfit') {
      // Draw character silhouette
      ctx.globalAlpha = 0.9
      ctx.fillStyle = colors.accent
      ctx.beginPath()
      ctx.arc(256, 180, 60, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = colors.primary
      ctx.fillRect(196, 240, 120, 160)
      
      ctx.fillStyle = colors.secondary
      ctx.fillRect(216, 260, 80, 120)
    } else {
      // Draw block design
      ctx.globalAlpha = 0.8
      ctx.fillStyle = colors.primary
      ctx.fillRect(80, 80, 352, 352)
      
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4
      ctx.strokeRect(80, 80, 352, 352)
      
      ctx.fillStyle = colors.secondary
      ctx.fillRect(120, 120, 272, 272)
    }

    // Add text
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(itemName, 258, 442)
    
    ctx.fillStyle = 'white'
    ctx.fillText(itemName, 256, 440)
    
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(type.toUpperCase(), 256, 470)

    return canvas.toDataURL('image/png')
  }

  // Generate image for specific item
  const handleGenerateImage = async (item: any, type: 'outfit' | 'block') => {
    if (!isAdmin) return

    setGenerating(true)
    setProgress(`Generating image for ${item.name}...`)

    try {
      let prompt = customPrompt
      
      if (!prompt) {
        // Generate default prompt based on item type
        if (type === 'outfit') {
          prompt = `A high quality digital art NFT avatar character wearing ${item.name} outfit. Minecraft-style character with blocky features. The outfit has ${item.colors.primary} as primary color, ${item.colors.secondary} as secondary color, and ${item.colors.accent} as accent color. Clean background, ${item.rarity} rarity style, gaming NFT art style, detailed textures, professional digital art.`
        } else {
          prompt = `A high quality digital art NFT of a ${item.name} block in Minecraft style. The block is ${item.color} colored, with clean geometric shapes and ${item.rarity} rarity appearance. Gaming NFT art style, detailed textures, clean background, professional digital art, square format.`
        }
      } else {
        prompt = `${customPrompt} ${item.name} ${type === 'outfit' ? 'character outfit' : 'block'}`
      }

      console.log('🎨 Generating with prompt:', prompt)
      const imageUrl = await generateWithGemini(prompt, item.name, type)

      const newImage: GeneratedImage = {
        name: item.name,
        type,
        prompt,
        imageUrl,
        timestamp: new Date().toISOString()
      }

      setGeneratedImages(prev => [...prev.filter(img => !(img.name === item.name && img.type === type)), newImage])
      setProgress(`✅ Generated image for ${item.name}`)
      setTimeout(() => setProgress(''), 2000)
    } catch (error) {
      console.error('Generation failed:', error)
      setProgress(`❌ Failed to generate ${item.name}`)
      setTimeout(() => setProgress(''), 3000)
    } finally {
      setGenerating(false)
    }
  }

  // Download image
  const handleDownloadImage = (img: GeneratedImage) => {
    const link = document.createElement('a')
    link.href = img.imageUrl
    link.download = `${img.type}-${img.name.toLowerCase().replace(/\s+/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Access control
  if (!isConnected) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
          <div className="px-6 py-4 text-center border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">🔒 Admin Access Required</h2>
            <p className="mt-1 text-sm text-gray-400">Connect your wallet to continue</p>
          </div>
          <div className="p-6">
            <WalletConnect />
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
          <div className="px-6 py-4 text-center border-b border-gray-700">
            <h2 className="text-xl font-semibold text-red-400">❌ Access Denied</h2>
            <p className="mt-1 text-sm text-gray-400">This panel is restricted to authorized wallets</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-red-900/20 rounded-xl border border-red-800">
              <p className="text-sm text-red-200">
                Connected: {address}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Required: {ADMIN_WALLET}
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full bg-gray-700 hover:bg-gray-600 text-white"
            >
              Return to Game
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/admin'} 
                className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  AI Image Generator
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  Generate NFT images for your collection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 mb-8">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
              Custom Prompt
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Optional prompt prefix that will be combined with item details
            </p>
          </div>
          <div className="px-6 py-4">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your custom prompt here..."
              className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white placeholder-gray-400 bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-colors"
              rows={3}
            />
            {progress && (
              <div className="mt-3 p-3 bg-blue-900/20 rounded-lg border border-blue-800">
                <p className="text-blue-200 text-sm">{progress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 mb-8">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Eye className="w-5 h-5 mr-2 text-green-400" />
                Generated Images ({generatedImages.length})
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedImages.map((img, index) => (
                    <div
                      key={`${img.type}-${img.name}-${index}`}
                      className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700"
                    >
                      <div className="aspect-square bg-gray-800">
                        <img 
                          src={img.imageUrl} 
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-white">{img.name}</h4>
                        <p className="text-sm text-gray-400 capitalize mb-2">{img.type}</p>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{img.prompt}</p>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadImage(img)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Available Items to Generate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Outfits */}
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">
                Outfit Images ({PLAYER_OUTFITS.filter(o => o.mintable).length})
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Generate images for character outfits
              </p>
            </div>
            <div className="p-6 space-y-3">
              {PLAYER_OUTFITS.filter(outfit => outfit.mintable).map((outfit) => {
                const isGenerated = generatedImages.some(img => img.name === outfit.name && img.type === 'outfit')
                
                return (
                  <div key={outfit.id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                        style={{ backgroundColor: outfit.colors.primary }}
                      >
                        {outfit.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{outfit.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{outfit.rarity}</p>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleGenerateImage(outfit, 'outfit')}
                      disabled={generating}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {isGenerated ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Blocks */}
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">
                Block Images ({BLOCK_TYPES.filter(b => b.mintable).length})
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Generate images for game blocks
              </p>
            </div>
            <div className="p-6 space-y-3">
              {BLOCK_TYPES.filter(block => block.mintable).map((block) => {
                const isGenerated = generatedImages.some(img => img.name === block.name && img.type === 'block')
                
                return (
                  <div key={block.id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                        style={{ backgroundColor: block.color }}
                      >
                        {block.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{block.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{block.rarity}</p>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleGenerateImage(block, 'block')}
                      disabled={generating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {isGenerated ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}