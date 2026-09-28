import { BridgeKit } from '@circle-fin/bridge-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import type { Address } from 'viem'
import { addUsdc } from './format'
import { amountError, sofiAddressError } from './validate'

type Eip1193 = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
}

export type SendStep = {
  name: string
  state: string
  explorerUrl?: string
  txHash?: string
}

export type SendOutcome = {
  state: string
  received: string
  steps: SendStep[]
}

function burnTxHash(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('values' in payload)) return null
  const values = (payload as { values?: unknown }).values
  if (!values || typeof values !== 'object') return null
  const step = values as { state?: unknown; txHash?: unknown }
  if (step.state === 'success' && typeof step.txHash === 'string' && step.txHash) return step.txHash
  return null
}

export async function sendArcUsdcToSofi(opts: {
  provider: Eip1193
  recipient: string
  amount: string
  fee: string
  onArcSent?: (txHash: string) => void
}): Promise<SendOutcome> {
  const addressError = sofiAddressError(opts.recipient)
  if (addressError) throw new Error(addressError)
  const receive = opts.amount.trim()
  const fee = opts.fee.trim()
  const badAmount = amountError(receive)
  if (badAmount) throw new Error(badAmount)
  if (amountError(fee)) throw new Error('Circle did not quote a bridge fee.')
  // Arc rejects source-paid ("receive-exact") fees. Burn the typed amount
  // plus the quoted forwarding cap and pin maxFee to that cap, so the
  // Ethereum mint is at least the amount SoFi should receive.
  const burn = addUsdc(receive, fee)
  const tooMuch = amountError(burn)
  if (tooMuch) throw new Error(tooMuch)

  const adapter = await createViemAdapterFromProvider({
    provider: opts.provider as never,
  })
  const kit = new BridgeKit()
  const params = {
    from: { adapter, chain: 'Arc' as const },
    to: {
      chain: 'Ethereum' as const,
      recipientAddress: opts.recipient.trim() as Address,
      useForwarder: true as const,
    },
    amount: burn,
    token: 'USDC' as const,
    config: {
      transferSpeed: 'SLOW' as const,
      maxFee: fee,
    },
  }
  const estimate = await kit.estimate(params)
  let noted = false
  kit.on('burn', (payload) => {
    if (noted) return
    const txHash = burnTxHash(payload)
    if (!txHash) return
    noted = true
    opts.onArcSent?.(txHash)
  })
  const result = await kit.bridge({
    ...params,
    ...(estimate.quote !== undefined ? { quote: estimate.quote } : {}),
  })
  return {
    state: result.state,
    received: receive,
    steps: result.steps.map((step) => ({
      name: step.name,
      state: step.state,
      explorerUrl: step.explorerUrl,
      txHash: step.txHash,
    })),
  }
}
