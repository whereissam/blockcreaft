import { type PlayerOutfit, type BlockType } from '../types/game'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages'

interface ImagenResponse {
  generatedImages?: Array<{
    bytesBase64Encoded: string
    mimeType: string
  }>
}

export async function generateOutfitImage(outfit: PlayerOutfit): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found, falling back to Canvas generation')
    return generateCanvasOutfitImage(outfit)
  }

  try {
    const prompt = `Create a detailed digital art image of a ${outfit.rarity} rarity gaming outfit called "${outfit.name}". ${outfit.description}. The outfit should have these colors: primary ${outfit.colors.primary}, secondary ${outfit.colors.secondary}, accent ${outfit.colors.accent}. Style: modern gaming avatar, clean digital art, fantasy RPG character outfit, high quality render. Make it look like a professional NFT artwork suitable for a blockchain game collection.`

    console.log('🧪 Testing Imagen API with prompt:', prompt)

    const response = await fetch(`${IMAGEN_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        number_of_images: 1,
        aspect_ratio: "1:1"
      })
    })

    console.log('📡 API Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error response:', errorText)
      throw new Error(`Imagen API error: ${response.status} - ${errorText}`)
    }

    const data: ImagenResponse = await response.json()
    console.log('📦 API Response data:', data)

    if (data.generatedImages?.[0]) {
      const image = data.generatedImages[0]
      return `data:${image.mimeType};base64,${image.bytesBase64Encoded}`
    } else {
      throw new Error('No image generated')
    }
  } catch (error) {
    console.error('Error generating image with Imagen:', error)
    // Fallback to Canvas generation
    return generateCanvasOutfitImage(outfit)
  }
}

export async function generateBlockImage(blockType: BlockType): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found, falling back to Canvas generation')
    return generateCanvasBlockImage(blockType)
  }

  try {
    const prompt = `Create a detailed 350x350 pixel digital art image of a ${blockType.rarity} rarity minecraft-style block called "${blockType.name}". The block should be primarily colored ${blockType.color}. Style: isometric 3D block, clean pixelated edges, professional game asset, high quality render suitable for NFT collection. Make it look like a premium Minecraft block with modern digital art styling.`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          response_modalities: ["TEXT", "IMAGE"]
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiImageResponse = await response.json()
    const imagePart = data.candidates?.[0]?.content?.parts?.find(part => part.inlineData)

    if (imagePart?.inlineData) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
    } else {
      throw new Error('No image generated')
    }
  } catch (error) {
    console.error('Error generating image with Gemini:', error)
    // Fallback to Canvas generation
    return generateCanvasBlockImage(blockType)
  }
}

// Fallback Canvas generation functions
function generateCanvasOutfitImage(outfit: PlayerOutfit): string {
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
  
  return canvas.toDataURL('image/png')
}

function generateCanvasBlockImage(blockType: BlockType): string {
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
  
  return canvas.toDataURL('image/png')
}