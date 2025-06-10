// IPFS CID mapping for NFT images
// Update these CIDs after uploading images to Pinata

export const OUTFIT_IMAGE_CIDS: Record<string, string> = {
  // Add your uploaded CIDs from admin panel here
  // Format: "Outfit Name": "QmHashHere"
  "Royal Knight": "", 
  "Cyber Punk": "",   
  "Mystic Mage": "",  
  "Shadow Assassin": "",
}

export const BLOCK_IMAGE_CIDS: Record<string, string> = {
  // Add your uploaded CIDs from admin panel here  
  // Format: "Block Name": "QmHashHere"
  "Diamond": "",    
  "Emerald": "",    
  "Gold": "",       
  "Obsidian": "",   
}

// Helper function to get IPFS URL
export function getIPFSImageURL(name: string, type: 'outfit' | 'block'): string {
  const mapping = type === 'outfit' ? OUTFIT_IMAGE_CIDS : BLOCK_IMAGE_CIDS
  const cid = mapping[name]
  
  if (!cid) {
    console.warn(`No IPFS CID found for ${type}: ${name}`)
    return '' // Return empty string if no CID found
  }
  
  return `ipfs://${cid}`
}

// Pinata setup instructions
export const PINATA_SETUP_INSTRUCTIONS = `
📋 IPFS Setup Instructions:

1. **Create Pinata Account**
   - Go to https://pinata.cloud
   - Sign up for free account (1GB free storage)

2. **Upload Images**
   - Click "Upload" → "File"
   - Upload all generated PNG files
   - Get the CID (Content Identifier) for each image

3. **Update CID Mapping**
   - Copy each image's CID from Pinata
   - Update the OUTFIT_IMAGE_CIDS and BLOCK_IMAGE_CIDS objects
   - Replace empty strings with actual CIDs

4. **Test IPFS URLs**
   - Format: ipfs://QmYourCIDHere
   - Test in browser: https://gateway.pinata.cloud/ipfs/QmYourCIDHere

5. **Deploy Updated Code**
   - New NFTs will use IPFS images
   - Much better OpenSea compatibility
   - Decentralized storage (recommended by OpenSea)

Example CID format: QmTy8w65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStJb
`