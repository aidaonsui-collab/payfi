import { getAddress, isAddress } from 'viem'
import { ARBITRUM_USDC, ARC_USDC, ETHEREUM_USDC, type Destination } from './chains'

const BLOCKED = new Set([ARC_USDC, ETHEREUM_USDC, ARBITRUM_USDC].map((address) => address.toLowerCase()))

export function recipientAddressError(raw: string, to: Destination): string | null {
  const value = raw.trim()
  if (!value) return `Paste the ${to.network} address from ${to.name}.`
  if (!isAddress(value)) return `That is not an ${to.network} address.`
  const address = getAddress(value)
  if (address === '0x0000000000000000000000000000000000000000') return 'That address cannot receive USDC.'
  if (BLOCKED.has(address.toLowerCase())) {
    return `That is a USDC token contract. Paste the receive address ${to.name} shows for your account.`
  }
  return null
}

export function amountError(raw: string): string | null {
  const value = raw.trim()
  if (!/^\d+(\.\d{1,6})?$/.test(value)) return 'Enter a USDC amount with up to 6 decimals.'
  const n = Number(value)
  if (!(n > 0)) return 'Enter an amount greater than 0.'
  if (n > 25_000) return 'PayFi sends at most 25,000 USDC at a time.'
  return null
}
