import { unitsToAmount } from './format'

/** Standard CCTP finality. Sui is not a Fast Transfer source. */
const STANDARD_FINALITY = 2000

function asUnits(value: unknown): bigint | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER) {
    return BigInt(value)
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const units = BigInt(value)
    return units > 0n ? units : null
  }
  return null
}

/**
 * Circle's destination-paid forwarding cap for Sui → Ethereum or Arbitrum.
 * The burn pins `forwardFee.high` as maxFee. The quote is flat;
 * the CCTP protocol fee on this route is zero.
 */
export function forwardFeeFromTiers(payload: unknown): string | null {
  if (!Array.isArray(payload)) return null
  const tier = payload.find((item) => {
    return !!item && typeof item === 'object' && (item as { finalityThreshold?: unknown }).finalityThreshold === STANDARD_FINALITY
  }) as { forwardFee?: { high?: unknown } } | undefined
  const units = asUnits(tier?.forwardFee?.high)
  if (units == null) return null
  return unitsToAmount(units)
}
