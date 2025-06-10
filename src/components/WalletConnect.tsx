import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWeb3 } from '../hooks/useWeb3'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface WalletConnectProps {
  className?: string
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { isConnected, isOnBaseSepolia, switchToBaseSepolia, address, balance, getShortAddress } = useWeb3()

  if (!isConnected) {
    return (
      <div className={className}>
        <ConnectButton.Custom>
          {({ openConnectModal, connectModalOpen }) => (
            <Button
              onClick={openConnectModal}
              disabled={connectModalOpen}
              className="w-full"
            >
              Connect Wallet
            </Button>
          )}
        </ConnectButton.Custom>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            {getShortAddress(address)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="font-mono text-sm">
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 ETH'}
            </p>
          </div>
          
          {!isOnBaseSepolia && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Wrong Network</span>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                Please switch to Base Sepolia to play Blockcraft
              </p>
              <Button
                onClick={switchToBaseSepolia}
                size="sm"
                className="w-full"
              >
                Switch to Base Sepolia
              </Button>
            </div>
          )}

          {isOnBaseSepolia && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ready to Play!</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Connected to Base Sepolia testnet
              </p>
            </div>
          )}

          <ConnectButton />
        </CardContent>
      </Card>
    </div>
  )
}