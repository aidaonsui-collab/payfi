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

## Logos

`public/logos/sofi.svg` is the SoFi icon from [selfh.st/icons](https://github.com/selfhst/icons) (CC BY 4.0), set on a white tile. `public/logos/cash-app.svg` is the Cash App icon from [Simple Icons](https://simpleicons.org) (CC0 1.0, traced from https://cash.app/press). SoFi is a trademark of SoFi Technologies, Inc. and Cash App is a trademark of Block, Inc.; PayFi shows them only to name where the USDC goes.
