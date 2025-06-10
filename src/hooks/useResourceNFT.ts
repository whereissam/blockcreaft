import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { useState } from 'react'
import { useWeb3 } from './useWeb3'
import { RESOURCE_TYPES, type ResourceType } from '../types/land'
import { CONTRACTS } from '../contracts/config'
import { BlockcraftResourcesABI, RESOURCE_TYPES as CONTRACT_RESOURCE_TYPES } from '../contracts/abis/BlockcraftResources'

export function useResourceNFT() {
  const { isConnected, address } = useWeb3()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const [lastHarvested, setLastHarvested] = useState<string | null>(null)
  const [inventory, setInventory] = useState<Record<string, number>>({})
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Harvest resource from block mining
  const harvestResource = async (blockType: string, amount: number = 1) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    // Map block type to resource
    const resourceType = getResourceFromBlock(blockType)
    if (!resourceType) {
      throw new Error(`No resource mapping for block type: ${blockType}`)
    }

    console.log('⛏️ Harvesting resource:', resourceType, 'amount:', amount)
    setLastHarvested(`${amount}x ${resourceType}`)

    // Check if resource should be minted (cooldown, rarity, etc)
    const shouldMint = checkHarvestConditions(resourceType)
    if (!shouldMint) {
      console.log('⏳ Harvest conditions not met, try again later')
      return
    }

    try {
      // const resourceId = RESOURCE_IDS[resourceType as keyof typeof RESOURCE_IDS] // Legacy code
      
      // Real contract call to mint resource NFTs
      const contractResourceId = getContractResourceId(resourceType)
      if (!contractResourceId) {
        throw new Error(`Invalid resource type: ${resourceType}`)
      }

      await writeContract({
        address: CONTRACTS.RESOURCES,
        abi: BlockcraftResourcesABI,
        functionName: 'mintResource',
        args: [address, BigInt(contractResourceId), BigInt(amount)],
      })
      
      // Also update local inventory for immediate UI feedback
      updateLocalInventory(resourceType, amount)
      
      console.log('🎉 Resource harvested successfully!')
    } catch (error) {
      console.error('❌ Resource harvest failed:', error)
      throw error
    }
  }

  // Map block types to resources
  const getResourceFromBlock = (blockType: string): string | null => {
    const mapping: Record<string, string> = {
      'Grass': 'wood',
      'Dirt': 'stone', 
      'Stone': 'stone',
      'Diamond': 'diamond',
      'Gold': 'gold',
      'Emerald': 'iron',
      'Obsidian': 'stone'
    }
    
    return mapping[blockType] || null
  }

  // Map resource names to contract resource IDs
  const getContractResourceId = (resourceType: string): number | null => {
    const mapping: Record<string, number> = {
      'wood': CONTRACT_RESOURCE_TYPES.WOOD,
      'stone': CONTRACT_RESOURCE_TYPES.STONE,
      'iron': CONTRACT_RESOURCE_TYPES.IRON,
      'gold': CONTRACT_RESOURCE_TYPES.GOLD,
      'diamond': CONTRACT_RESOURCE_TYPES.DIAMOND
    }
    
    return mapping[resourceType] || null
  }

  // Check harvest conditions (cooldowns, rarity, etc)
  const checkHarvestConditions = (resourceType: string): boolean => {
    const resource = RESOURCE_TYPES[resourceType]
    if (!resource) return false

    // Rarity-based chance
    const rarityChance = {
      common: 0.8,
      uncommon: 0.5, 
      rare: 0.3,
      epic: 0.1,
      legendary: 0.05
    }

    return Math.random() < rarityChance[resource.rarity]
  }

  // Update local inventory (for demo)
  const updateLocalInventory = (resourceType: string, amount: number) => {
    setInventory(prev => ({
      ...prev,
      [resourceType]: (prev[resourceType] || 0) + amount
    }))
  }

  // Get inventory summary
  const getInventory = () => {
    return Object.entries(inventory).map(([type, amount]) => ({
      type,
      amount,
      resource: RESOURCE_TYPES[type],
      value: (RESOURCE_TYPES[type]?.baseValue || 0) * amount
    }))
  }

  // Calculate total inventory value
  const getTotalValue = (): number => {
    return getInventory().reduce((total, item) => total + item.value, 0)
  }

  return {
    harvestResource,
    getResourceFromBlock,
    inventory,
    getInventory,
    getTotalValue,
    isPending: isPending || isConfirming,
    isConfirmed,
    error,
    hash,
    lastHarvested,
  }
}