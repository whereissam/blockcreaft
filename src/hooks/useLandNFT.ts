import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { useState } from 'react'
import { useWeb3 } from './useWeb3'
import type { LandChunk, LandStatus } from '../types/land'

// Land NFT ABI
const LAND_NFT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "plotId", "type": "uint256" }
    ],
    "name": "mintLand",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "plotId", "type": "uint256" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "rentLand", 
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "plotId", "type": "uint256" }
    ],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "plotId", "type": "uint256" }
    ],
    "name": "isRentable",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "plotId", "type": "uint256" }
    ],
    "name": "getRenter",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// For now, using same contract - in production you'd deploy separate LandNFT contract
const LAND_CONTRACT = "0x9a3a4D73d33be7Ca333974377f473f3951fe8EbF"

export function useLandNFT() {
  const { isConnected, address } = useWeb3()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const [lastAction, setLastAction] = useState<string | null>(null)
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Check land ownership
  const { data: landOwner } = useReadContract({
    address: LAND_CONTRACT,
    abi: LAND_NFT_ABI,
    functionName: 'ownerOf',
    args: [1], // Example plot ID
  })

  // Generate land chunk data
  const generateLandChunks = (): LandChunk[] => {
    const chunks: LandChunk[] = []
    let id = 0
    
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 10; z++) {
        chunks.push({
          id: id++,
          x,
          z,
          isForSale: Math.random() > 0.7, // 30% for sale
          salePrice: Math.random() > 0.5 ? Math.floor(Math.random() * 1000) + 100 : undefined,
          rentPrice: Math.random() > 0.6 ? Math.floor(Math.random() * 50) + 10 : undefined,
          resources: [], // Will be populated based on chunk type
          owner: Math.random() > 0.8 ? `0x${Math.random().toString(16).substr(2, 40)}` : undefined
        })
      }
    }
    
    return chunks
  }

  // Buy land NFT
  const buyLand = async (plotId: number) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    console.log('🏗️ Purchasing land plot:', plotId)
    setLastAction(`Buying Plot ${plotId}`)

    try {
      await writeContract({
        address: LAND_CONTRACT,
        abi: LAND_NFT_ABI,
        functionName: 'mintLand',
        args: [BigInt(plotId)],
        value: parseEther('0.001'), // 0.001 ETH per land chunk
      })
      
      console.log('🚀 Land purchase initiated for plot:', plotId)
    } catch (error) {
      console.error('❌ Land purchase failed:', error)
      throw error
    }
  }

  // Rent land 
  const rentLand = async (plotId: number, duration: number) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first')
    }

    console.log('🏠 Renting land plot:', plotId, 'for', duration, 'days')
    setLastAction(`Renting Plot ${plotId}`)

    try {
      await writeContract({
        address: LAND_CONTRACT,
        abi: LAND_NFT_ABI,
        functionName: 'rentLand',
        args: [BigInt(plotId), BigInt(duration)],
        value: parseEther('0.0001'), // 0.0001 ETH per day
      })
      
      console.log('🚀 Land rental initiated for plot:', plotId)
    } catch (error) {
      console.error('❌ Land rental failed:', error)
      throw error
    }
  }

  // Get land status
  const getLandStatus = (plotId: number): LandStatus => {
    // Mock implementation - in production, read from contract
    const isOwned = Math.random() > 0.7
    const isRented = Math.random() > 0.8
    
    return {
      owned: isOwned,
      rented: isRented,
      available: !isOwned && !isRented,
      price: !isOwned ? Math.floor(Math.random() * 1000) + 100 : undefined,
      rentPrice: isOwned && !isRented ? Math.floor(Math.random() * 50) + 10 : undefined,
      owner: isOwned ? `0x${Math.random().toString(16).substr(2, 40)}` : undefined
    }
  }

  return {
    buyLand,
    rentLand,
    getLandStatus,
    generateLandChunks,
    isPending: isPending || isConfirming,
    isConfirmed,
    error,
    hash,
    lastAction,
    landOwner,
  }
}