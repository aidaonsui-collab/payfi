import { getAddress, isAddress } from 'viem'
import { ARC_USDC, ETHEREUM_USDC } from './chains'

const BLOCKED = new Set([ARC_USDC.toLowerCase(), ETHEREUM_USDC.toLowerCase()])

export function sofiAddressError(raw: string): string | null {
  const value = raw.trim()
  if (!value) return 'Paste the Ethereum address from SoFi.'
  if (!isAddress(value)) return 'That is not an Ethereum address.'
  const address = getAddress(value)
  if (address === '0x0000000000000000000000000000000000000000') return 'That address cannot receive USDC.'
  if (BLOCKED.has(address.toLowerCase())) {
    return 'That is the USDC token contract. Paste the receive address SoFi shows for your account.'
  }
  return null
}

export function amountError(raw: string): string | null {
  const value = raw.trim()
  if (!/^\d+(\.\d{1,6})?$/.test(value)) return 'Enter a USDC amount with up to 6 decimals.'
  const n = Number(value)
  if (!(n > 0)) return 'Enter an amount greater than 0.'
  if (n > 25_000) return 'ArcFi sends at most 25,000 USDC at a time.'
  return null
}
