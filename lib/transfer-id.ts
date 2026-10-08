import { ARC_CCTP_DOMAIN, SUI_CCTP_DOMAIN } from './chains'

const ARC_TX = /^0x[0-9a-fA-F]{64}$/
/** Sui transaction digests are 32 bytes of base58, without a 0x prefix. */
const SUI_DIGEST = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/

export function irisDomain(tx: string): number | null {
  if (SUI_DIGEST.test(tx)) return SUI_CCTP_DOMAIN
  if (ARC_TX.test(tx)) return ARC_CCTP_DOMAIN
  return null
}
