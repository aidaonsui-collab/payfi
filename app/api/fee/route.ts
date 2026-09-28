import { forwardFeeFromTiers } from '@/lib/forward-fee'
import { amountError } from '@/lib/validate'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const amount = new URL(request.url).searchParams.get('amount') ?? ''
  if (amountError(amount)) {
    return Response.json({ error: 'Enter a USDC amount first.' }, { status: 400 })
  }
  const response = await fetch('https://iris-api.circle.com/v2/burn/USDC/fees/26/0?forward=true', {
    cache: 'no-store',
  })
  if (!response.ok) {
    return Response.json({ error: 'Circle did not quote a fee.' }, { status: 502 })
  }
  const fee = forwardFeeFromTiers(await response.json())
  if (!fee) {
    return Response.json({ error: 'Circle did not quote a fee.' }, { status: 502 })
  }
  return Response.json({ fee }, { headers: { 'cache-control': 'no-store' } })
}
