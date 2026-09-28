import { amountError } from '@/lib/validate'
import { toUnits } from '@/lib/format'
import { ARC_USDC } from '@/lib/chains'

export async function GET(request: Request) {
  const amount = new URL(request.url).searchParams.get('amount') ?? ''
  if (amountError(amount)) {
    return Response.json({ error: 'Enter a USDC amount first.' }, { status: 400 })
  }
  const response = await fetch('https://iris-api.circle.com/v2/quote/burn/usdc/26/0', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: toUnits(amount).toString(),
      feeToken: ARC_USDC,
      requests: [{ type: 'FORWARD' }],
    }),
  })
  if (!response.ok) {
    return Response.json({ error: 'Circle did not quote a fee.' }, { status: 502 })
  }
  const data = (await response.json()) as { feeTotalAmount?: string }
  if (!data.feeTotalAmount) {
    return Response.json({ error: 'Circle did not quote a fee.' }, { status: 502 })
  }
  const fee = (Number(data.feeTotalAmount) / 1_000_000).toFixed(2)
  return Response.json({ fee })
}
