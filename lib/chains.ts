export const ARC_CHAIN_ID = 5042
export const ARC_USDC = '0x3600000000000000000000000000000000000000' as const
export const ETHEREUM_USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
export const ARC_RPC = 'https://rpc.mainnet.arc.io'
export const ARC_EXPLORER = 'https://explorer.arc.io'
export const ETH_EXPLORER = 'https://etherscan.io'

export const ARC_ADD_CHAIN = {
  chainId: '0x13b2',
  chainName: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: [ARC_RPC],
  blockExplorerUrls: [ARC_EXPLORER],
} as const
