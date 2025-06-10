import express from 'express';
import Player from '../models/Player.js';

const router = express.Router();

// Get player profile by wallet address
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    let player = await Player.findOne({ address: address.toLowerCase() });
    
    // Create new player if doesn't exist
    if (!player) {
      player = new Player({
        address: address.toLowerCase(),
        ownedOutfits: [1], // Start with Explorer outfit
        selectedOutfit: 1
      });
      await player.save();
    }
    
    // Update last login
    player.lastLogin = new Date();
    await player.save();
    
    res.json({
      success: true,
      player: {
        address: player.address,
        username: player.username,
        selectedOutfit: player.selectedOutfit,
        ownedOutfits: player.ownedOutfits,
        ownedBlocks: player.ownedBlocks,
        landOwned: player.landOwned,
        level: player.level,
        xp: player.xp,
        rank: player.rank,
        totalPlayTime: player.totalPlayTime,
        gameStats: player.gameStats,
        achievements: player.achievements,
        joinedAt: player.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch player data' });
  }
});

// Update player profile
router.put('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const updates = req.body;
    
    const player = await Player.findOneAndUpdate(
      { address: address.toLowerCase() },
      { ...updates, lastLogin: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    res.json({ success: true, player });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ success: false, error: 'Failed to update player data' });
  }
});

// Add XP to player
router.post('/:address/xp', async (req, res) => {
  try {
    const { address } = req.params;
    const { amount, reason } = req.body;
    
    const player = await Player.findOne({ address: address.toLowerCase() });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    const result = player.addXP(amount);
    await player.save();
    
    res.json({
      success: true,
      xpAdded: amount,
      totalXP: player.xp,
      ...result,
      reason
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({ success: false, error: 'Failed to add XP' });
  }
});

// Update game stats
router.post('/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;
    const { statsUpdate } = req.body;
    
    const player = await Player.findOne({ address: address.toLowerCase() });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    // Update stats
    Object.keys(statsUpdate).forEach(key => {
      if (player.gameStats[key] !== undefined) {
        player.gameStats[key] += statsUpdate[key];
      }
    });
    
    await player.save();
    
    res.json({ success: true, gameStats: player.gameStats });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({ success: false, error: 'Failed to update stats' });
  }
});

// Get leaderboard
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    let sortField = {};
    switch (type) {
      case 'xp':
        sortField = { xp: -1 };
        break;
      case 'level':
        sortField = { level: -1, xp: -1 };
        break;
      case 'blocks':
        sortField = { 'gameStats.blocksPlaced': -1 };
        break;
      case 'playtime':
        sortField = { totalPlayTime: -1 };
        break;
      default:
        sortField = { xp: -1 };
    }
    
    const players = await Player.find({})
      .sort(sortField)
      .limit(limit)
      .select('address username level xp gameStats totalPlayTime');
    
    res.json({ success: true, leaderboard: players });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

export default router;