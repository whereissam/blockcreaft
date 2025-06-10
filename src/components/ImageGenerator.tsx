import React, { useState } from 'react'
import { Button } from './ui/button'
import { uploadOutfitImage, uploadBlockImage } from '../services/pinataService'
import { PLAYER_OUTFITS, BLOCK_TYPES } from '../types/game'

export function ImageGenerator() {
  const [uploading, setUploading] = useState(false)
  const [uploadedCIDs, setUploadedCIDs] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState('')

  const handleUploadAllToIPFS = async () => {
    setUploading(true)
    setProgress('Starting upload...')
    const cids: Record<string, string> = {}

    try {
      // Upload outfit images
      setProgress('Uploading outfit images...')
      for (const outfit of PLAYER_OUTFITS) {
        if (outfit.mintable) {
          setProgress(`Uploading: ${outfit.name}...`)
          const cid = await uploadOutfitImage(outfit)
          cids[`outfit-${outfit.name}`] = cid
          console.log(`✅ ${outfit.name}: ${cid}`)
        }
      }

      // Upload block images
      setProgress('Uploading block images...')
      const mintableBlocks = BLOCK_TYPES.filter(block => block.mintable)
      for (const block of mintableBlocks) {
        setProgress(`Uploading: ${block.name}...`)
        const cid = await uploadBlockImage(block)
        cids[`block-${block.name}`] = cid
        console.log(`✅ ${block.name}: ${cid}`)
      }

      setUploadedCIDs(cids)
      setProgress('✅ All images uploaded!')
      
      // Generate code to copy-paste
      const outfitCIDs = PLAYER_OUTFITS
        .filter(outfit => outfit.mintable)
        .map(outfit => `  "${outfit.name}": "${cids[`outfit-${outfit.name}`]}",`)
        .join('\n')
      
      const blockCIDs = BLOCK_TYPES
        .filter(block => block.mintable)
        .map(block => `  "${block.name}": "${cids[`block-${block.name}`]}",`)
        .join('\n')

      const updateCode = `
// Update src/config/ipfsMapping.ts with these CIDs:

export const OUTFIT_IMAGE_CIDS: Record<string, string> = {
${outfitCIDs}
}

export const BLOCK_IMAGE_CIDS: Record<string, string> = {
${blockCIDs}
}`

      console.log('🎉 IPFS Upload Complete!')
      console.log(updateCode)
      alert('Upload complete! Check console for CID mapping code to copy-paste.')

    } catch (error) {
      console.error('Upload failed:', error)
      setProgress('❌ Upload failed - check console')
    } finally {
      setUploading(false)
    }
  }

  const handleShowCIDs = () => {
    const cidList = Object.entries(uploadedCIDs)
      .map(([name, cid]) => `${name}: ${cid}`)
      .join('\n')
    alert(`Uploaded CIDs:\n\n${cidList}`)
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 p-4 rounded-lg border border-purple-500/50 backdrop-blur max-w-xs">
      <h3 className="text-white font-bold mb-3">🖼️ IPFS Uploader</h3>
      <div className="space-y-2">
        <Button
          onClick={handleUploadAllToIPFS}
          disabled={uploading}
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="sm"
        >
          {uploading ? '⏳ Uploading...' : '🚀 Upload All to IPFS'}
        </Button>
        
        {Object.keys(uploadedCIDs).length > 0 && (
          <Button
            onClick={handleShowCIDs}
            className="w-full bg-green-600 hover:bg-green-700"
            size="sm"
          >
            📋 Show CIDs
          </Button>
        )}
        
        {progress && (
          <p className="text-xs text-blue-300 break-words">
            {progress}
          </p>
        )}
        
        <p className="text-xs text-gray-400 mt-2">
          This will upload all images to Pinata IPFS and generate the CID mapping code.
        </p>
      </div>
    </div>
  )
}