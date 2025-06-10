// Quick test script to verify blockchain integration
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org')
})

const CONTRACTS = {
  OUTFITS: '0xaf7175E3c5499278a6f58CAa9Adf6cFD4CEaF309',
  LAND: '0x5D67dE98d3602797A8A3D1BF024dF595bF11CF7E',
  RESOURCES: '0x9bA6E7ce42CEA106Def5E462f4D2Bc9444aC69A5',
  MARKETPLACE: '0x021a84FA7A7082278169cE12311A992F9661FE0B',
}

// ERC721 totalSupply function
const totalSupplyABI = [{
  name: 'totalSupply',
  type: 'function',
  stateMutability: 'view',
  inputs: [],
  outputs: [{ type: 'uint256' }]
}]

// Test contract calls
async function testContracts() {
  console.log('🧪 Testing Blockcraft contracts on Base Sepolia...\n')
  
  try {
    // Test Outfits contract
    console.log('👕 Testing Outfits Contract...')
    const outfitSupply = await client.readContract({
      address: CONTRACTS.OUTFITS,
      abi: totalSupplyABI,
      functionName: 'totalSupply'
    })
    console.log(`   ✅ Outfits total supply: ${outfitSupply}`)
    
    // Test Land contract  
    console.log('\n🏞️ Testing Land Contract...')
    const landSupply = await client.readContract({
      address: CONTRACTS.LAND, 
      abi: totalSupplyABI,
      functionName: 'totalSupply'
    })
    console.log(`   ✅ Land total supply: ${landSupply}`)
    
    // Test network connectivity
    console.log('\n🌐 Testing Network...')
    const blockNumber = await client.getBlockNumber()
    console.log(`   ✅ Current block number: ${blockNumber}`)
    
    console.log('\n🎉 All blockchain tests passed! The contracts are live and working.')
    console.log('\n📊 Contract Status:')
    console.log(`   • Outfits NFTs minted: ${outfitSupply}`)
    console.log(`   • Land chunks owned: ${landSupply}`)
    console.log(`   • Network: Base Sepolia (Chain ID: 84532)`)
    console.log(`   • Current block: ${blockNumber}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testContracts()