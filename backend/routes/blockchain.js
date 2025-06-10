import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

// Base Sepolia provider
const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');

// Verify transaction on blockchain
router.post('/verify-transaction', async (req, res) => {
  try {
    const { transactionHash, expectedValue, expectedTo } = req.body;
    
    if (!transactionHash) {
      return res.status(400).json({ success: false, error: 'Transaction hash required' });
    }
    
    // Get transaction details
    const transaction = await provider.getTransaction(transactionHash);
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    // Get transaction receipt to check if it was successful
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt) {
      return res.status(400).json({ success: false, error: 'Transaction not yet confirmed' });
    }
    
    if (receipt.status !== 1) {
      return res.status(400).json({ success: false, error: 'Transaction failed' });
    }
    
    // Verify transaction details if provided
    let verified = true;
    let verificationDetails = {};
    
    if (expectedValue) {
      const valueMatch = transaction.value.toString() === expectedValue.toString();
      verificationDetails.valueMatch = valueMatch;
      if (!valueMatch) verified = false;
    }
    
    if (expectedTo) {
      const toMatch = transaction.to?.toLowerCase() === expectedTo.toLowerCase();
      verificationDetails.toMatch = toMatch;
      if (!toMatch) verified = false;
    }
    
    res.json({
      success: true,
      verified,
      transaction: {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value.toString(),
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        confirmations: await transaction.confirmations()
      },
      verificationDetails
    });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({ success: false, error: 'Failed to verify transaction' });
  }
});

// Get contract events
router.get('/events/:contractAddress', async (req, res) => {
  try {
    const { contractAddress } = req.params;
    const { fromBlock = 'latest', toBlock = 'latest', eventName } = req.query;
    
    // Basic event filtering (you'd want to add proper ABI and event filtering)
    const filter = {
      address: contractAddress,
      fromBlock: fromBlock === 'latest' ? -10 : parseInt(fromBlock),
      toBlock: toBlock === 'latest' ? 'latest' : parseInt(toBlock)
    };
    
    const logs = await provider.getLogs(filter);
    
    res.json({
      success: true,
      events: logs.map(log => ({
        address: log.address,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        topics: log.topics,
        data: log.data
      }))
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contract events' });
  }
});

// Get wallet NFTs (simplified - you'd use proper indexing service in production)
router.get('/nfts/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // In a real implementation, you'd use services like Alchemy, Moralis, or your own indexer
    // For now, return mock data structure
    res.json({
      success: true,
      nfts: {
        blocks: [], // Block NFTs owned
        outfits: [], // Outfit NFTs owned  
        land: [] // Land NFTs owned
      },
      message: 'NFT fetching not fully implemented - use direct contract calls for now'
    });
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch NFTs' });
  }
});

// Get Base Sepolia network stats
router.get('/network-stats', async (req, res) => {
  try {
    const [blockNumber, gasPrice, network] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
      provider.getNetwork()
    ]);
    
    res.json({
      success: true,
      stats: {
        chainId: network.chainId.toString(),
        blockNumber,
        gasPrice: {
          gasPrice: gasPrice.gasPrice?.toString(),
          maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching network stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch network stats' });
  }
});

export default router;