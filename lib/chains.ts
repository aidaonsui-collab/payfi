export const ETHEREUM_USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
/** Still rejected as a SoFi receive address. */
export const ARC_USDC = '0x3600000000000000000000000000000000000000' as const

export const SUI_USDC_TYPE =
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'

export const SUI_GRAPHQL = 'https://graphql.mainnet.sui.io/graphql'
export const SUI_EXPLORER = 'https://suiscan.xyz/mainnet/tx'

/** CCTP domain 8. Fast Transfer does not apply; standard finality is 2000. */
export const SUI_CCTP_DOMAIN = 8
export const ETHEREUM_CCTP_DOMAIN = 0
/** Earlier PayFi burns. Pending receipts from that path still settle here. */
export const ARC_CCTP_DOMAIN = 26

export const IRIS = 'https://iris-api.circle.com'
export const IRIS_FORWARD_FEE = `${IRIS}/v2/burn/USDC/fees/${SUI_CCTP_DOMAIN}/${ETHEREUM_CCTP_DOMAIN}?forward=true`

export function irisMessagesUrl(domain: number, tx: string): string {
  return `${IRIS}/v2/messages/${domain}?transactionHash=${encodeURIComponent(tx)}`
}

/**
 * Mainnet CCTP V2 packages. `deposit_for_burn` takes hook bytes, so the
 * version-0 `cctp-forward` hook can ask Circle to mint on Ethereum.
 * Sui is not a forwarding destination. Ethereum is.
 */
export const CCTP = {
  tmmPackage: '0xeb14978abfe93a37c5d5bf86a0623b923553a5f0e794daac7724f1e2fdbfb830',
  tmmState: '0x06fb166941cd7bc095edc019d054a753ec3f1e4c25f28f2ecc4a6cfa0a9b1167',
  mtPackage: '0x16bcfcfc465f96281663a344641c017de84529370e11aa3879d0dce43ad6db87',
  mtState: '0x0c067f7d325e5b60e3179712e7783534ba1556cbb3d359d8161497e37689230c',
  handlerPackage: '0x185ed207c4d64fc594882ab927f9f3c6ff957aad03df8a731ba64378faeeb2bf',
  handlerState: '0xa32de8a6dd0178fb05f662929d55cddb69a25c26bde4b83f89e36d17ead94c41',
  treasury: '0x57d6725e7a8b49a7b2a612f6bd66ab5f39fc95332ca48be421c3229d514a6de7',
  denyList: '0x403',
  finality: 2000,
} as const

/** Version-0 forwarding hook: `cctp-forward`, version 0, empty extra data. */
export const FORWARD_HOOK = Uint8Array.from([
  0x63, 0x63, 0x74, 0x70, 0x2d, 0x66, 0x6f, 0x72, 0x77, 0x61, 0x72, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
])
