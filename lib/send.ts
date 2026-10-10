import { extractStatusFromEffectsBcs } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { fromBase64 } from '@mysten/sui/utils'
import { buildSuiBurn } from './burn'
import type { Destination } from './chains'
import { addUsdc, toUnits } from './format'
import { amountError, recipientAddressError } from './validate'
import { executeSuiBurn } from './wallet'

export async function sendSuiUsdc(opts: {
  address: string
  to: Destination
  recipient: string
  amount: string
  fee: string
  onSent?: (digest: string) => void
}): Promise<string> {
  const addressError = recipientAddressError(opts.recipient, opts.to)
  if (addressError) throw new Error(addressError)
  const receive = opts.amount.trim()
  const fee = opts.fee.trim()
  const badAmount = amountError(receive)
  if (badAmount) throw new Error(badAmount)
  if (amountError(fee)) throw new Error('Circle did not quote a bridge fee.')
  // Sui has no upfront forwarding fee. Burn the typed amount plus the quoted
  // cap and pin maxFee to that cap, so the destination mint is at least the
  // amount the user typed.
  const burn = addUsdc(receive, fee)
  const tooMuch = amountError(burn)
  if (tooMuch) throw new Error(tooMuch)
  const burnUnits = toUnits(burn)
  const feeUnits = toUnits(fee)

  const tx = new Transaction()
  buildSuiBurn(tx, { burnUnits, feeUnits, recipient: opts.recipient.trim(), domain: opts.to.domain })
  const result = await executeSuiBurn(opts.address, tx)
  const status = extractStatusFromEffectsBcs(fromBase64(result.effects))
  if (!status.success) throw new Error('The Sui burn did not succeed.')
  opts.onSent?.(result.digest)
  return result.digest
}
