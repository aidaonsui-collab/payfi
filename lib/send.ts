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

export async function sendArcUsdcToSofi(opts: {
  provider: Eip1193
  recipient: string
  amount: string
  fee: string
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
