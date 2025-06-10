import { PLAYER_OUTFITS, BLOCK_TYPES, type PlayerOutfit, type BlockType } from '../types/game'

// Generate and download outfit image
export function generateAndDownloadOutfitImage(outfit: PlayerOutfit): void {
  const canvas = document.createElement('canvas')
  canvas.width = 350
  canvas.height = 350
  const ctx = canvas.getContext('2d')!
  
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
  
  // Download the image
  const link = document.createElement('a')
  link.download = `outfit-${outfit.name.toLowerCase().replace(/\s+/g, '-')}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// Generate and download block image
export function generateAndDownloadBlockImage(blockType: BlockType): void {
  const canvas = document.createElement('canvas')
  canvas.width = 350
  canvas.height = 350
  const ctx = canvas.getContext('2d')!
  
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
  
  // Download the image
  const link = document.createElement('a')
  link.download = `block-${blockType.name.toLowerCase().replace(/\s+/g, '-')}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// Download all images
export function downloadAllImages(): void {
  console.log('🎨 Downloading all outfit images...')
  
  // Download outfit images
  PLAYER_OUTFITS.forEach((outfit, index) => {
    if (outfit.mintable) {
      setTimeout(() => {
        generateAndDownloadOutfitImage(outfit)
        console.log(`✅ Downloaded: outfit-${outfit.name.toLowerCase().replace(/\s+/g, '-')}.png`)
      }, index * 500) // Stagger downloads
    }
  })
  
  // Download block images
  const mintableBlocks = BLOCK_TYPES.filter(block => block.mintable)
  mintableBlocks.forEach((blockType, index) => {
    setTimeout(() => {
      generateAndDownloadBlockImage(blockType)
      console.log(`✅ Downloaded: block-${blockType.name.toLowerCase().replace(/\s+/g, '-')}.png`)
    }, (PLAYER_OUTFITS.length + index) * 500) // Continue after outfits
  })
  
  setTimeout(() => {
    console.log('🎉 All images downloaded!')
    console.log('📋 Next steps:')
    console.log('1. Go to https://pinata.cloud and create account')
    console.log('2. Upload all images to get IPFS CIDs')
    console.log('3. Update metadata to use ipfs:// URLs')
  }, (PLAYER_OUTFITS.length + mintableBlocks.length) * 500 + 1000)
}