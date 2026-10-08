# PayFi

Send USDC from a Sui wallet to the Ethereum address SoFi shows for a USDC deposit.

SoFi credits USDC that arrives on Ethereum. PayFi burns native USDC on Sui with Circle CCTP V2 and a forwarding hook. Circle mints Ethereum USDC at the pasted address. The deposit lands in SoFi Crypto. The Sui wallet pays a little SUI for gas.

```
npm install
npm test
npm run dev
```

Open http://localhost:3030. In SoFi, copy the address from Crypto → Transfer → Receive → USDC, and confirm the network is Ethereum.
