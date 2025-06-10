import { useAccount, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { useConnectModal } from '@rainbow-me/rainbowkit'

export function useWeb3() {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { openConnectModal } = useConnectModal()

  const isOnBaseSepolia = chainId === baseSepolia.id

  const switchToBaseSepolia = () => {
    if (!isOnBaseSepolia) {
      switchChain({ chainId: baseSepolia.id })
    }
  }

  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal()
    }
  }

  const getShortAddress = (addr?: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return {
    address,
    isConnected,
    isConnecting,
    balance,
    chainId,
    isOnBaseSepolia,
    connectWallet,
    disconnect,
    switchToBaseSepolia,
    getShortAddress,
  }
}