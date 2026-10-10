# PayFi

Send USDC from a Sui wallet to SoFi or Cash App.

PayFi burns native USDC on Sui with Circle CCTP V2 and a forwarding hook, and Circle mints USDC at the pasted address on the network that app watches:

- **SoFi** credits USDC on Ethereum only. In SoFi, copy the address from Crypto → Transfer → Receive → USDC, and confirm the network is Ethereum.
- **Cash App** takes the same address on Ethereum, Polygon and Arbitrum. PayFi mints on Arbitrum, where minting costs Circle's relayer far less gas than on Ethereum, so the bridge fee is smaller. In Cash App's USDC deposit screen, pick Arbitrum.

The Sui wallet pays a little SUI for gas. Send a small amount first to a new address.

```
npm install
npm test
npm run dev
```

Open http://localhost:3030.
