export const CONTRACTS = {
  OUTFITS: import.meta.env.VITE_BLOCKCRAFT_OUTFITS_ADDRESS as `0x${string}`,
  LAND: import.meta.env.VITE_BLOCKCRAFT_LAND_ADDRESS as `0x${string}`,
  RESOURCES: import.meta.env.VITE_BLOCKCRAFT_RESOURCES_ADDRESS as `0x${string}`,
  MARKETPLACE: import.meta.env.VITE_BLOCKCRAFT_MARKETPLACE_ADDRESS as `0x${string}`,
} as const;

export const CHAIN_ID = 84532; // Base Sepolia
export const CHAIN_NAME = 'Base Sepolia';