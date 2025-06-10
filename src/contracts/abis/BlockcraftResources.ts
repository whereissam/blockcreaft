export const BlockcraftResourcesABI = [
  {
    type: 'constructor',
    inputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'mintResource',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'resourceType', type: 'uint256', internalType: 'uint256' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'id', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserResources',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'resourceTypes', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'balances', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getResourceInfo',
    inputs: [{ name: 'resourceType', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'rarity', type: 'string', internalType: 'string' },
      { name: 'totalSupply', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ResourceMinted',
    inputs: [
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'resourceType', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

export const RESOURCE_TYPES = {
  WOOD: 1,
  STONE: 2,
  IRON: 3,
  GOLD: 4,
  DIAMOND: 5,
} as const;