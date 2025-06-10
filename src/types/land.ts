// Land system types for Blockcraft Web3

export interface LandChunk {
  id: number
  x: number
  z: number
  owner?: string
  renter?: string
  rentPrice?: number
  rentDuration?: number
  rentExpires?: number
  isForSale: boolean
  salePrice?: number
  resources: ResourceType[]
  lastHarvested?: number
  isRentable?: boolean
  maxRentDuration?: number
  minRentDuration?: number
  totalRevenue?: number
  lastRented?: number
}

export interface LandRental {
  id: string
  landChunkId: number
  renter: string
  owner: string
  rentPrice: number
  duration: number
  startTime: number
  endTime: number
  isActive: boolean
  autoRenew: boolean
}

export interface ResourceType {
  type: 'wood' | 'stone' | 'iron' | 'diamond' | 'gold'
  amount: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  color: string
  baseValue: number
}

export interface LandStatus {
  owned: boolean
  rented: boolean
  available: boolean
  price?: number
  rentPrice?: number
  owner?: string
  renter?: string
}

export const RESOURCE_TYPES: Record<string, ResourceType> = {
  wood: {
    type: 'wood',
    amount: 1,
    rarity: 'common',
    color: '#8B4513',
    baseValue: 10
  },
  stone: {
    type: 'stone', 
    amount: 1,
    rarity: 'common',
    color: '#696969',
    baseValue: 15
  },
  iron: {
    type: 'iron',
    amount: 1, 
    rarity: 'uncommon',
    color: '#C0C0C0',
    baseValue: 50
  },
  gold: {
    type: 'gold',
    amount: 1,
    rarity: 'rare', 
    color: '#FFD700',
    baseValue: 100
  },
  diamond: {
    type: 'diamond',
    amount: 1,
    rarity: 'legendary',
    color: '#B9F2FF',
    baseValue: 500
  }
}

export const CHUNK_SIZE = 16 // 16x16 blocks per chunk
export const WORLD_SIZE = 10 // 10x10 chunks = 100 total land NFTs