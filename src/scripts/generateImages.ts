import { PLAYER_OUTFITS, BLOCK_TYPES } from '../types/game'
import fs from 'fs'
import path from 'path'

// Create images directory
const imagesDir = path.join(process.cwd(), 'generated-images')
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

// Function to generate outfit image
function generateOutfitImage(outfit: any): Buffer {
  // Note: This would run in Node.js with node-canvas
  // For browser, we'll use a different approach
  const { createCanvas } = require('canvas')
  const canvas = createCanvas(350, 350)
  const ctx = canvas.getContext('2d')
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 350, 350)
  gradient.addColorStop(0, outfit.colors.primary)
  gradient.addColorStop(0.5, outfit.colors.secondary)
  gradient.addColorStop(1, outfit.colors.accent)
  
  // Fill background
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 350, 350)
  
  // Draw character head (circle)
  ctx.globalAlpha = 0.8
  ctx.fillStyle = outfit.colors.accent
  ctx.beginPath()
  ctx.arc(175, 120, 40, 0, Math.PI * 2)
  ctx.fill()
  
  // Draw character body (rectangle)
  ctx.globalAlpha = 0.9
  ctx.fillStyle = outfit.colors.primary
  ctx.fillRect(135, 160, 80, 100)
  
  // Draw character details (inner rectangle)
  ctx.globalAlpha = 0.7
  ctx.fillStyle = outfit.colors.secondary
  ctx.fillRect(150, 175, 50, 70)
  
  // Add text shadow effect
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.font = 'bold 22px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(outfit.name, 177, 292)
  
  // Add main text
  ctx.fillStyle = 'white'
  ctx.fillText(outfit.name, 175, 290)
  
  // Add rarity text
  ctx.font = '12px Arial'
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText(outfit.rarity.toUpperCase(), 175, 315)
  
  return canvas.toBuffer('image/png')
}

// Function to generate block image
function generateBlockImage(blockType: any): Buffer {
  const { createCanvas } = require('canvas')
  const canvas = createCanvas(350, 350)
  const ctx = canvas.getContext('2d')
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 350, 350)
  gradient.addColorStop(0, blockType.color)
  gradient.addColorStop(1, blockType.color + 'BB')
  
  // Fill background with gradient
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 350, 350)
  
  // Draw outer border
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, 350, 350)
  
  // Draw main block
  ctx.globalAlpha = 0.8
  ctx.fillStyle = blockType.color
  ctx.fillRect(40, 40, 270, 270)
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, 270, 270)
  
  // Draw inner block
  ctx.globalAlpha = 0.6
  ctx.fillStyle = blockType.color
  ctx.fillRect(80, 80, 190, 190)
  
  // Add text shadow
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.font = 'bold 26px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(blockType.name, 177, 192)
  
  // Add main text
  ctx.fillStyle = 'white'
  ctx.fillText(blockType.name, 175, 190)
  
  // Add "BLOCK" text
  ctx.font = '14px Arial'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText('BLOCK', 175, 220)
  
  return canvas.toBuffer('image/png')
}

// Generate all outfit images
console.log('🎨 Generating outfit images...')
PLAYER_OUTFITS.forEach(outfit => {
  if (outfit.mintable) {
    const imageBuffer = generateOutfitImage(outfit)
    const filename = `outfit-${outfit.name.toLowerCase().replace(/\s+/g, '-')}.png`
    fs.writeFileSync(path.join(imagesDir, filename), imageBuffer)
    console.log(`✅ Generated: ${filename}`)
  }
})

// Generate mintable block images
console.log('🧱 Generating block images...')
BLOCK_TYPES.forEach(blockType => {
  if (blockType.mintable) {
    const imageBuffer = generateBlockImage(blockType)
    const filename = `block-${blockType.name.toLowerCase().replace(/\s+/g, '-')}.png`
    fs.writeFileSync(path.join(imagesDir, filename), imageBuffer)
    console.log(`✅ Generated: ${filename}`)
  }
})

console.log('🎉 All images generated in:', imagesDir)
console.log('📋 Next steps:')
console.log('1. Upload images to Pinata (https://pinata.cloud)')
console.log('2. Get IPFS CIDs for each image')
console.log('3. Update the metadata to use ipfs:// URLs')