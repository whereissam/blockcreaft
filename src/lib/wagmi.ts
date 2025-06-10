import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Blockcraft',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
  chains: [baseSepolia],
  ssr: false,
})

// Base Sepolia configuration
export const baseSepoliaConfig = {
  chainId: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://sepolia.base.org'] },
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { 
      name: 'BaseScan', 
      url: 'https://sepolia.basescan.org' 
    },
  },
  testnet: true,
}