import express from 'express';
import Player from '../models/Player.js';

const router = express.Router();

// Available outfits data (mirrors frontend data)
const OUTFITS = [
  {
    id: 1,
    name: "Explorer",
    description: "A basic explorer outfit for new adventurers",
    rarity: 'common',
    mintable: false,
    owned: true,
    colors: { primary: "#8B4513", secondary: "#DEB887", accent: "#654321" },
    parts: { head: "brown_cap", body: "leather_vest", legs: "brown_pants", feet: "leather_boots" }
  },
  {
    id: 2,
    name: "Cyber Punk",
    description: "Futuristic cyber outfit with neon accents",
    rarity: 'rare',
    mintable: true,
    owned: false,
    colors: { primary: "#0F0F23", secondary: "#00FFFF", accent: "#FF00FF" },
    parts: { head: "cyber_helmet", body: "neon_jacket", legs: "tech_pants", feet: "cyber_boots" },
    price: 0.02
  },
  {
    id: 3,
    name: "Royal Knight",
    description: "Noble knight armor with golden details",
    rarity: 'epic',
    mintable: true,
    owned: false,
    colors: { primary: "#4A4A4A", secondary: "#FFD700", accent: "#8B0000" },
    parts: { head: "knight_helmet", body: "plate_armor", legs: "armored_legs", feet: "steel_boots" },
    price: 0.05
  },
  {
    id: 4,
    name: "Space Marine",
    description: "Advanced space marine combat suit",
    rarity: 'epic',
    mintable: true,
    owned: false,
    colors: { primary: "#2E2E2E", secondary: "#0080FF", accent: "#FF4500" },
    parts: { head: "space_helmet", body: "combat_suit", legs: "tactical_pants", feet: "mag_boots" },
    price: 0.08
  },
  {
    id: 5,
    name: "Rainbow Mystic",
    description: "Legendary mystic outfit that changes colors",
    rarity: 'legendary',
    mintable: true,
    owned: false,
    colors: { primary: "#FF6B6B", secondary: "#4ECDC4", accent: "#45B7D1" },
    parts: { head: "mystic_crown", body: "rainbow_robe", legs: "mystic_pants", feet: "ethereal_boots" },
    price: 0.1
  }
];

// Get all outfits for a player
router.get('/player/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const player = await Player.findOne({ address: address.toLowerCase() });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    const outfitsWithOwnership = OUTFITS.map(outfit => ({
      ...outfit,
      owned: player.ownedOutfits.includes(outfit.id),
      selected: player.selectedOutfit === outfit.id
    }));
    
    res.json({ 
      success: true, 
      outfits: outfitsWithOwnership,
      selectedOutfit: player.selectedOutfit 
    });
  } catch (error) {
    console.error('Error fetching player outfits:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch outfits' });
  }
});

// Select/equip an outfit
router.post('/player/:address/select', async (req, res) => {
  try {
    const { address } = req.params;
    const { outfitId } = req.body;
    
    const player = await Player.findOne({ address: address.toLowerCase() });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    // Check if player owns the outfit
    if (!player.ownedOutfits.includes(outfitId)) {
      return res.status(403).json({ success: false, error: 'You do not own this outfit' });
    }
    
    player.selectedOutfit = outfitId;
    await player.save();
    
    res.json({ 
      success: true, 
      selectedOutfit: outfitId,
      message: 'Outfit equipped successfully!'
    });
  } catch (error) {
    console.error('Error selecting outfit:', error);
    res.status(500).json({ success: false, error: 'Failed to select outfit' });
  }
});

// Purchase an outfit (before minting NFT)
router.post('/player/:address/purchase', async (req, res) => {
  try {
    const { address } = req.params;
    const { outfitId, transactionHash } = req.body;
    
    const player = await Player.findOne({ address: address.toLowerCase() });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    // Check if outfit exists and is purchasable
    const outfit = OUTFITS.find(o => o.id === outfitId);
    if (!outfit || !outfit.mintable) {
      return res.status(400).json({ success: false, error: 'Invalid outfit or not purchasable' });
    }
    
    // Check if already owned
    if (player.ownedOutfits.includes(outfitId)) {
      return res.status(400).json({ success: false, error: 'Outfit already owned' });
    }
    
    // Add outfit to player's collection
    player.unlockOutfit(outfitId);
    
    // Add purchase record (you might want to verify the transaction hash on-chain)
    if (!player.ownedBlocks) player.ownedBlocks = [];
    
    await player.save();
    
    // Award XP for purchasing outfit
    player.addXP(50);
    await player.save();
    
    res.json({ 
      success: true, 
      message: 'Outfit purchased successfully!',
      outfitId,
      transactionHash 
    });
  } catch (error) {
    console.error('Error purchasing outfit:', error);
    res.status(500).json({ success: false, error: 'Failed to purchase outfit' });
  }
});

// Get outfit marketplace data
router.get('/marketplace', async (req, res) => {
  try {
    const marketplace = OUTFITS.filter(outfit => outfit.mintable).map(outfit => ({
      id: outfit.id,
      name: outfit.name,
      description: outfit.description,
      rarity: outfit.rarity,
      price: outfit.price,
      colors: outfit.colors,
      totalMinted: 0, // TODO: Get from blockchain
      totalSupply: outfit.rarity === 'legendary' ? 100 : outfit.rarity === 'epic' ? 500 : 1000
    }));
    
    res.json({ success: true, marketplace });
  } catch (error) {
    console.error('Error fetching marketplace:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch marketplace data' });
  }
});

export default router;