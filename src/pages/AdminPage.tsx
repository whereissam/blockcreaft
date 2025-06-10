import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { uploadOutfitImage, uploadBlockImage, testPinataConnection } from '../services/pinataService'
import { PLAYER_OUTFITS, BLOCK_TYPES } from '../types/game'
import { useWeb3 } from '../hooks/useWeb3'
import { WalletConnect } from '../components/WalletConnect'
import { Trash2, Upload, Eye, Copy, CheckCircle, AlertCircle, Settings, Wand2 } from 'lucide-react'

// Admin wallet address (only this address can access admin features)
const ADMIN_WALLET = '0x3B6c2603789eB01C911CdC5d1914CA5976D07e4d'

interface UploadedImage {
  name: string
  type: 'outfit' | 'block'
  cid: string
  ipfsUrl: string
  uploadTime: string
}

export function AdminPage() {
  const { isConnected, address, connectWallet } = useWeb3()
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [progress, setProgress] = useState('')
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [connectionStatus, setConnectionStatus] = useState<string>('')

  // Check if current user is admin
  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_WALLET.toLowerCase()

  // Load uploaded images from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-uploaded-images')
    if (saved) {
      setUploadedImages(JSON.parse(saved))
    }
  }, [])

  // Save uploaded images to localStorage
  const saveUploadedImages = (images: UploadedImage[]) => {
    setUploadedImages(images)
    localStorage.setItem('admin-uploaded-images', JSON.stringify(images))
  }

  const handleUploadSingle = async (item: any, type: 'outfit' | 'block') => {
    if (!isAdmin) return

    setUploading(true)
    setProgress(`Uploading ${item.name}...`)

    try {
      const cid = type === 'outfit' 
        ? await uploadOutfitImage(item)
        : await uploadBlockImage(item)

      const newImage: UploadedImage = {
        name: item.name,
        type,
        cid,
        ipfsUrl: `ipfs://${cid}`,
        uploadTime: new Date().toISOString()
      }

      const updatedImages = [...uploadedImages.filter(img => img.name !== item.name || img.type !== type), newImage]
      saveUploadedImages(updatedImages)
      setProgress(`✅ Uploaded ${item.name}`)

      setTimeout(() => setProgress(''), 2000)
    } catch (error) {
      console.error('Upload failed:', error)
      setProgress(`❌ Failed to upload ${item.name}`)
      setTimeout(() => setProgress(''), 3000)
    } finally {
      setUploading(false)
    }
  }

  const handleTestConnection = async () => {
    setProgress('Testing Pinata connection...')
    try {
      const result = await testPinataConnection()
      setConnectionStatus(result.message)
      setProgress(result.success ? '✅ Connection test complete' : '❌ Connection test failed')
    } catch (error) {
      setConnectionStatus('❌ Connection test error')
      setProgress('❌ Connection test failed')
    }
    setTimeout(() => setProgress(''), 3000)
  }

  const handleUploadAll = async () => {
    if (!isAdmin) return

    setUploading(true)
    const newImages: UploadedImage[] = []

    try {
      // Upload outfit images
      for (const outfit of PLAYER_OUTFITS.filter(o => o.mintable)) {
        setProgress(`Uploading outfit: ${outfit.name}...`)
        const cid = await uploadOutfitImage(outfit)
        newImages.push({
          name: outfit.name,
          type: 'outfit',
          cid,
          ipfsUrl: `ipfs://${cid}`,
          uploadTime: new Date().toISOString()
        })
      }

      // Upload block images
      for (const block of BLOCK_TYPES.filter(b => b.mintable)) {
        setProgress(`Uploading block: ${block.name}...`)
        const cid = await uploadBlockImage(block)
        newImages.push({
          name: block.name,
          type: 'block',
          cid,
          ipfsUrl: `ipfs://${cid}`,
          uploadTime: new Date().toISOString()
        })
      }

      // Merge with existing images (replace duplicates)
      const updatedImages = [...uploadedImages]
      newImages.forEach(newImg => {
        const existingIndex = updatedImages.findIndex(
          img => img.name === newImg.name && img.type === newImg.type
        )
        if (existingIndex >= 0) {
          updatedImages[existingIndex] = newImg
        } else {
          updatedImages.push(newImg)
        }
      })

      saveUploadedImages(updatedImages)
      setProgress('✅ All images uploaded successfully!')
      setTimeout(() => setProgress(''), 3000)

    } catch (error) {
      console.error('Batch upload failed:', error)
      setProgress('❌ Batch upload failed')
      setTimeout(() => setProgress(''), 3000)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = (name: string, type: 'outfit' | 'block') => {
    if (!isAdmin) return
    
    const updatedImages = uploadedImages.filter(img => !(img.name === name && img.type === type))
    saveUploadedImages(updatedImages)
  }

  const handleToggleSelect = (key: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedImages(newSelected)
  }

  const handleCopyMapping = () => {
    const outfitCIDs = uploadedImages
      .filter(img => img.type === 'outfit')
      .map(img => `  "${img.name}": "${img.cid}",`)
      .join('\n')
    
    const blockCIDs = uploadedImages
      .filter(img => img.type === 'block')
      .map(img => `  "${img.name}": "${img.cid}",`)
      .join('\n')

    const mappingCode = `// Update src/config/ipfsMapping.ts with these CIDs:

export const OUTFIT_IMAGE_CIDS: Record<string, string> = {
${outfitCIDs}
}

export const BLOCK_IMAGE_CIDS: Record<string, string> = {
${blockCIDs}
}`

    navigator.clipboard.writeText(mappingCode)
    alert('Mapping code copied to clipboard!')
  }

  const getImageKey = (img: UploadedImage) => `${img.type}-${img.name}`

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
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Admin Panel
              </h1>
              <p className="mt-2 text-lg text-gray-400">
                Manage NFT images and IPFS uploads for your collection
              </p>
              <div className="mt-4 flex items-center space-x-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Authorized as {address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Controls */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 mb-8">
          <div className="px-8 py-6 border-b border-gray-700">
            <h2 className="text-2xl font-semibold text-white">
              Upload Controls
            </h2>
            <p className="mt-1 text-gray-400">
              Test connections and manage your image uploads
            </p>
          </div>
          <div className="px-8 py-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                onClick={handleTestConnection}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Test Connection
              </Button>
              
              <Button
                onClick={() => window.location.href = '/admin/generate'}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Generator
              </Button>
              
              <Button
                onClick={handleUploadAll}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {uploading ? '⏳ Uploading...' : 'Upload All Images'}
              </Button>
              
              {uploadedImages.length > 0 && (
                <Button
                  onClick={handleCopyMapping}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Mapping
                </Button>
              )}
            </div>

            {connectionStatus && (
              <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 mb-4">
                <p className="text-gray-300 text-sm">{connectionStatus}</p>
              </div>
            )}

            {progress && (
              <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-800">
                <p className="text-blue-200 text-sm">{progress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 mb-8">
            <div className="px-8 py-6 border-b border-gray-700">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <Eye className="w-6 h-6 mr-3 text-blue-400" />
                Uploaded Images ({uploadedImages.length})
              </h2>
              <p className="mt-1 text-gray-400">
                Manage your IPFS uploaded images
              </p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploadedImages.map((img) => {
                  const key = getImageKey(img)
                  const isSelected = selectedImages.has(key)
                  
                  return (
                    <div
                      key={key}
                      className={`relative bg-gray-900 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                        isSelected 
                          ? 'border-purple-500 ring-2 ring-purple-500/20' 
                          : 'border-gray-700'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{img.name}</h3>
                            <p className="text-sm text-gray-400 capitalize">{img.type}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteImage(img.name, img.type)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 rounded-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="text-gray-400 font-medium">CID:</label>
                            <p className="font-mono text-green-400 break-all mt-1">{img.cid}</p>
                          </div>
                          <div>
                            <label className="text-gray-400 font-medium">IPFS URL:</label>
                            <p className="font-mono text-blue-400 break-all mt-1">{img.ipfsUrl}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${img.cid}`, '_blank')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs py-1"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(img.ipfsUrl)}
                            className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg text-xs py-1"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Available Items to Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Outfits */}
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
            <div className="px-8 py-6 border-b border-gray-700">
              <h2 className="text-2xl font-semibold text-white">
                👔 Outfits ({PLAYER_OUTFITS.filter(o => o.mintable).length})
              </h2>
              <p className="mt-1 text-gray-400">
                Upload character outfit images
              </p>
            </div>
            <div className="p-6 space-y-3">
              {PLAYER_OUTFITS.filter(outfit => outfit.mintable).map((outfit) => {
                const isUploaded = uploadedImages.some(img => img.name === outfit.name && img.type === 'outfit')
                
                return (
                  <div key={outfit.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: outfit.colors.primary }}
                      >
                        {outfit.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">{outfit.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{outfit.rarity}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {isUploaded && <CheckCircle className="w-5 h-5 text-green-400" />}
                      <Button
                        size="sm"
                        onClick={() => handleUploadSingle(outfit, 'outfit')}
                        disabled={uploading}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                          isUploaded 
                            ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' 
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                      >
                        {isUploaded ? 'Re-upload' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Blocks */}
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
            <div className="px-8 py-6 border-b border-gray-700">
              <h2 className="text-2xl font-semibold text-white">
                🧱 Blocks ({BLOCK_TYPES.filter(b => b.mintable).length})
              </h2>
              <p className="mt-1 text-gray-400">
                Upload game block images
              </p>
            </div>
            <div className="p-6 space-y-3">
              {BLOCK_TYPES.filter(block => block.mintable).map((block) => {
                const isUploaded = uploadedImages.some(img => img.name === block.name && img.type === 'block')
                
                return (
                  <div key={block.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: block.color }}
                      >
                        {block.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">{block.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{block.rarity}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {isUploaded && <CheckCircle className="w-5 h-5 text-green-400" />}
                      <Button
                        size="sm"
                        onClick={() => handleUploadSingle(block, 'block')}
                        disabled={uploading}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                          isUploaded 
                            ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' 
                            : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                        }`}
                      >
                        {isUploaded ? 'Re-upload' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Back to Game */}
        <div className="text-center mt-12">
          <Button 
            onClick={() => window.location.href = '/'} 
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium text-lg"
          >
            🎮 Return to Game
          </Button>
        </div>
      </div>
    </div>
  )
}