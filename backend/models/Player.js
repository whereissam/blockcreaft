import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    trim: true,
    maxlength: 20
  },
  selectedOutfit: {
    type: Number,
    default: 1 // Explorer outfit by default
  },
  ownedOutfits: [{
    type: Number
  }],
  ownedBlocks: [{
    blockId: Number,
    quantity: Number,
    tokenId: String
  }],
  landOwned: [{
    chunkX: Number,
    chunkZ: Number,
    tokenId: String,
    purchasedAt: Date
  }],
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  totalPlayTime: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  achievements: [{
    id: String,
    unlockedAt: Date
  }],
  gameStats: {
    blocksPlaced: { type: Number, default: 0 },
    blocksDestroyed: { type: Number, default: 0 },
    distanceTraveled: { type: Number, default: 0 },
    timeSpentBuilding: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for better query performance
playerSchema.index({ address: 1 });
playerSchema.index({ username: 1 });
playerSchema.index({ level: -1 });

// Virtual for player rank based on XP
playerSchema.virtual('rank').get(function() {
  if (this.xp < 100) return 'Beginner';
  if (this.xp < 500) return 'Builder';
  if (this.xp < 1000) return 'Architect';
  if (this.xp < 5000) return 'Master';
  return 'Legend';
});

// Method to add XP and handle level ups
playerSchema.methods.addXP = function(amount) {
  this.xp += amount;
  const newLevel = Math.floor(this.xp / 100) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    return { leveledUp: true, newLevel: this.level };
  }
  return { leveledUp: false, newLevel: this.level };
};

// Method to unlock outfit
playerSchema.methods.unlockOutfit = function(outfitId) {
  if (!this.ownedOutfits.includes(outfitId)) {
    this.ownedOutfits.push(outfitId);
  }
};

export default mongoose.model('Player', playerSchema);