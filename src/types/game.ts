export interface BlockType {
  id: number;
  name: string;
  color: string;
  texture?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  mintable: boolean;
  tradeable: boolean;
  description?: string;
}

export interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

export interface Chunk {
  x: number;
  z: number;
  blocks: Map<string, BlockType>;
}

export interface PlayerOutfit {
  id: number;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  mintable: boolean;
  owned: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  parts: {
    head: string;
    body: string;
    legs: string;
    feet: string;
  };
  price?: string; // in ETH
}

export interface PlayerProfile {
  address: string;
  username?: string;
  selectedOutfit: PlayerOutfit;
  ownedOutfits: PlayerOutfit[];
  ownedBlocks: BlockType[];
  landOwned: number[];
  level: number;
  xp: number;
  joinedAt: Date;
}

export interface GameState {
  chunks: Map<string, Chunk>;
  selectedBlock: BlockType;
  inventory: BlockType[];
  playerPosition: [number, number, number];
  playerProfile?: PlayerProfile;
}

export const BLOCK_TYPES: BlockType[] = [
  { 
    id: 1, 
    name: "Grass", 
    color: "#4CAF50", 
    rarity: 'common', 
    mintable: false, 
    tradeable: false,
    description: "Basic grass block for terrain"
  },
  { 
    id: 2, 
    name: "Dirt", 
    color: "#8D6E63", 
    rarity: 'common', 
    mintable: false, 
    tradeable: false,
    description: "Simple dirt block"
  },
  { 
    id: 3, 
    name: "Stone", 
    color: "#9E9E9E", 
    rarity: 'common', 
    mintable: false, 
    tradeable: false,
    description: "Basic stone block"
  },
  { 
    id: 4, 
    name: "Diamond Block", 
    color: "#00E5FF", 
    rarity: 'rare', 
    mintable: true, 
    tradeable: true,
    description: "Sparkling diamond block - mint as NFT!"
  },
  { 
    id: 5, 
    name: "Gold Block", 
    color: "#FFD700", 
    rarity: 'rare', 
    mintable: true, 
    tradeable: true,
    description: "Precious gold block - tradeable NFT"
  },
  { 
    id: 6, 
    name: "Ruby Block", 
    color: "#E91E63", 
    rarity: 'epic', 
    mintable: true, 
    tradeable: true,
    description: "Rare ruby block with magical properties"
  },
  { 
    id: 7, 
    name: "Emerald Block", 
    color: "#4CAF50", 
    rarity: 'epic', 
    mintable: true, 
    tradeable: true,
    description: "Mystical emerald block"
  },
  { 
    id: 8, 
    name: "Obsidian Block", 
    color: "#1A1A1A", 
    rarity: 'epic', 
    mintable: true, 
    tradeable: true,
    description: "Volcanic obsidian with unique patterns"
  },
  { 
    id: 9, 
    name: "Rainbow Block", 
    color: "#FF6B6B", 
    rarity: 'legendary', 
    mintable: true, 
    tradeable: true,
    description: "Ultra-rare rainbow block - changes colors!"
  },
];

export const PLAYER_OUTFITS: PlayerOutfit[] = [
  {
    id: 1,
    name: "Explorer",
    description: "A basic explorer outfit for new adventurers",
    rarity: 'common',
    mintable: false,
    owned: true,
    colors: {
      primary: "#8B4513",
      secondary: "#DEB887",
      accent: "#654321"
    },
    parts: {
      head: "brown_cap",
      body: "leather_vest",
      legs: "brown_pants", 
      feet: "leather_boots"
    }
  },
  {
    id: 2,
    name: "Cyber Punk",
    description: "Futuristic cyber outfit with neon accents",
    rarity: 'rare',
    mintable: true,
    owned: false,
    colors: {
      primary: "#0F0F23",
      secondary: "#00FFFF",
      accent: "#FF00FF"
    },
    parts: {
      head: "cyber_helmet",
      body: "neon_jacket",
      legs: "tech_pants",
      feet: "cyber_boots"
    },
    price: "0.0001"
  },
  {
    id: 3,
    name: "Royal Knight",
    description: "Noble knight armor with golden details",
    rarity: 'epic',
    mintable: true,
    owned: false,
    colors: {
      primary: "#4A4A4A",
      secondary: "#FFD700",
      accent: "#8B0000"
    },
    parts: {
      head: "knight_helmet",
      body: "plate_armor",
      legs: "armored_legs",
      feet: "steel_boots"
    },
    price: "0.0002"
  },
  {
    id: 4,
    name: "Space Marine",
    description: "Advanced space marine combat suit",
    rarity: 'epic',
    mintable: true,
    owned: false,
    colors: {
      primary: "#2E2E2E",
      secondary: "#0080FF",
      accent: "#FF4500"
    },
    parts: {
      head: "space_helmet",
      body: "combat_suit",
      legs: "tactical_pants",
      feet: "mag_boots"
    },
    price: "0.0003"
  },
  {
    id: 5,
    name: "Rainbow Mystic",
    description: "Legendary mystic outfit that changes colors",
    rarity: 'legendary',
    mintable: true,
    owned: false,
    colors: {
      primary: "#FF6B6B",
      secondary: "#4ECDC4", 
      accent: "#45B7D1"
    },
    parts: {
      head: "mystic_crown",
      body: "rainbow_robe",
      legs: "mystic_pants",
      feet: "ethereal_boots"
    },
    price: "0.0005"
  }
];

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 64;