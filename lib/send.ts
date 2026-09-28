import { BridgeKit } from '@circle-fin/bridge-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import type { Address } from 'viem'
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
}): Promise<SendOutcome> {
  const addressError = sofiAddressError(opts.recipient)
  if (addressError) throw new Error(addressError)
  const badAmount = amountError(opts.amount)
  if (badAmount) throw new Error(badAmount)

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
    amount: opts.amount.trim(),
    token: 'USDC' as const,
    config: { feePayment: 'source' as const },
  }
  const estimate = await kit.estimate(params)
  const result = await kit.bridge({
    ...params,
    ...(estimate.quote !== undefined ? { quote: estimate.quote } : {}),
  })
  const received =
    'amountReceived' in estimate && typeof estimate.amountReceived === 'string'
      ? estimate.amountReceived
      : result.amount
  return {
    state: result.state,
    received,
    steps: result.steps.map((step) => ({
      name: step.name,
      state: step.state,
      explorerUrl: step.explorerUrl,
      txHash: step.txHash,
    })),
  }
}
