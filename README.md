# PayFi

Send USDC from an Arc wallet to the Ethereum address SoFi shows for a USDC deposit.

SoFi credits USDC that arrives on Ethereum. PayFi uses Circle Bridge Kit: the wallet burns USDC on Arc, and Circle mints Ethereum USDC at the pasted address. The deposit lands in SoFi Crypto.

```
npm install
npm test
npm run dev
```

Open http://localhost:3030. In SoFi, copy the address from Crypto → Transfer → Receive → USDC, and confirm the network is Ethereum.
