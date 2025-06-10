// Pinata IPFS service for uploading NFT images

const PINATA_API_KEY = 'dda23c374f7ef693aa5c'
const PINATA_SECRET = '4ca07ed35ba95015569ac2dd72fa3404944cbada41e140c71279469c38dba985'
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1MWUwYzZjOC1hZTNlLTRhMDItOGU1NC00NzI5MDliZWZjYzciLCJlbWFpbCI6InNhbTEzNTY0MkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZGRhMjNjMzc0ZjdlZjY5M2FhNWMiLCJzY29wZWRLZXlTZWNyZXQiOiI0Y2EwN2VkMzViYTk1MDE1NTY5YWMyZGQ3MmZhMzQwNDk0NGNiYWRhNDFlMTQwYzcxMjc5NDY5YzM4ZGJhOTg1IiwiZXhwIjoxNzgwOTA5MDQ4fQ.Ojfl0dRkTlYzRfWT8c0VdwjmHE3kFdlHNletv3NwtCE'

// Test Pinata API connection
export async function testPinataConnection(): Promise<{ success: boolean, message: string }> {
  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, message: `✅ Connected as: ${data.message}` }
    } else {
      const errorText = await response.text()
      return { success: false, message: `❌ Auth failed: ${errorText}` }
    }
  } catch (error) {
    return { success: false, message: `❌ Connection error: ${error}` }
  }
}

interface PinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

// Convert canvas to blob
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
}

// Upload image to Pinata IPFS
export async function uploadImageToPinata(canvas: HTMLCanvasElement, filename: string): Promise<string> {
  console.log('🔧 Pinata upload attempt - using fallback generation instead...')
  
  // For now, skip Pinata and just generate a mock CID since the API key needs scope configuration
  // This allows testing the UI while the Pinata dashboard is configured properly
  
  const mockCID = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
  console.log(`📝 Generated mock CID for ${filename}:`, mockCID)
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return mockCID

  // TODO: Uncomment below when Pinata API key has proper scopes configured
  /*
  try {
    const blob = await canvasToBlob(canvas)
    const formData = new FormData()
    formData.append('file', blob, filename)
    
    // Try with minimal metadata first
    const options = JSON.stringify({
      cidVersion: 0
    })
    formData.append('pinataOptions', options)

    console.log('🔧 Attempting upload with JWT token...')
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata API Error:', response.status, errorText)
      throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`)
    }

    const data: PinataResponse = await response.json()
    console.log(`✅ Uploaded ${filename} to IPFS:`, data.IpfsHash)
    return data.IpfsHash
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error)
    throw error
  }
  */
}

// Generate canvas image
function generateCanvasImage(config: {
  name: string
  colors: { primary: string, secondary: string, accent: string }
  rarity: string
  type: 'outfit' | 'block'
}): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 350
  canvas.height = 350
  const ctx = canvas.getContext('2d')!

  if (config.type === 'outfit') {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 350, 350)
    gradient.addColorStop(0, config.colors.primary)
    gradient.addColorStop(0.5, config.colors.secondary)
    gradient.addColorStop(1, config.colors.accent)
    
    // Fill background
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 350, 350)
    
    // Draw character head (circle)
    ctx.globalAlpha = 0.8
    ctx.fillStyle = config.colors.accent
    ctx.beginPath()
    ctx.arc(175, 120, 40, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw character body (rectangle)
    ctx.globalAlpha = 0.9
    ctx.fillStyle = config.colors.primary
    ctx.fillRect(135, 160, 80, 100)
    
    // Draw character details (inner rectangle)
    ctx.globalAlpha = 0.7
    ctx.fillStyle = config.colors.secondary
    ctx.fillRect(150, 175, 50, 70)
    
    // Add text shadow effect
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.font = 'bold 22px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(config.name, 177, 292)
    
    // Add main text
    ctx.fillStyle = 'white'
    ctx.fillText(config.name, 175, 290)
    
    // Add rarity text
    ctx.font = '12px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(config.rarity.toUpperCase(), 175, 315)
  } else {
    // Block type
    const gradient = ctx.createLinearGradient(0, 0, 350, 350)
    gradient.addColorStop(0, config.colors.primary)
    gradient.addColorStop(1, config.colors.primary + 'BB')
    
    // Fill background with gradient
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 350, 350)
    
    // Draw outer border
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, 350, 350)
    
    // Draw main block
    ctx.globalAlpha = 0.8
    ctx.fillStyle = config.colors.primary
    ctx.fillRect(40, 40, 270, 270)
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.strokeRect(40, 40, 270, 270)
    
    // Draw inner block
    ctx.globalAlpha = 0.6
    ctx.fillStyle = config.colors.primary
    ctx.fillRect(80, 80, 190, 190)
    
    // Add text shadow
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.font = 'bold 26px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(config.name, 177, 192)
    
    // Add main text
    ctx.fillStyle = 'white'
    ctx.fillText(config.name, 175, 190)
    
    // Add "BLOCK" text
    ctx.font = '14px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText('BLOCK', 175, 220)
  }

  return canvas
}

// Upload outfit image and return IPFS CID
export async function uploadOutfitImage(outfit: {
  name: string
  colors: { primary: string, secondary: string, accent: string }
  rarity: string
}): Promise<string> {
  const canvas = generateCanvasImage({
    name: outfit.name,
    colors: outfit.colors,
    rarity: outfit.rarity,
    type: 'outfit'
  })
  
  const filename = `outfit-${outfit.name.toLowerCase().replace(/\s+/g, '-')}.png`
  return await uploadImageToPinata(canvas, filename)
}

// Upload block image and return IPFS CID
export async function uploadBlockImage(block: {
  name: string
  color: string
  rarity: string
}): Promise<string> {
  const canvas = generateCanvasImage({
    name: block.name,
    colors: { primary: block.color, secondary: block.color, accent: block.color },
    rarity: block.rarity,
    type: 'block'
  })
  
  const filename = `block-${block.name.toLowerCase().replace(/\s+/g, '-')}.png`
  return await uploadImageToPinata(canvas, filename)
}