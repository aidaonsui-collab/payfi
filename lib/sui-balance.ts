import { unitsToAmount } from './format'

function asUnits(value: unknown): bigint | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) {
    return BigInt(value)
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value)
  return null
}

/** Spendable USDC is the SIP-58 address balance. Coin objects are reported beside it. */
export function suiBalanceFromGraphQL(payload: unknown): { balance: string; coins: string } | null {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) return null
  const data = (payload as { data?: unknown }).data
  if (!data || typeof data !== 'object' || !('address' in data)) return null
  const address = (data as { address?: unknown }).address
  if (!address || typeof address !== 'object' || !('balance' in address)) return null
  const balance = (address as { balance?: unknown }).balance
  if (!balance || typeof balance !== 'object') return null
  const row = balance as { addressBalance?: unknown; coinBalance?: unknown }
  const spendable = asUnits(row.addressBalance)
  const coins = asUnits(row.coinBalance)
  if (spendable == null || coins == null) return null
  return { balance: unitsToAmount(spendable), coins: unitsToAmount(coins) }
}
