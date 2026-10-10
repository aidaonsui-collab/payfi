import { DESTINATIONS, irisForwardFeeUrl, isDestinationId } from '@/lib/chains'
import { forwardFeeFromTiers } from '@/lib/forward-fee'
import { amountError } from '@/lib/validate'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const amount = params.get('amount') ?? ''
  const to = params.get('to')
  if (amountError(amount)) {
    return Response.json({ error: 'Enter a USDC amount first.' }, { status: 400 })
  }
  if (!isDestinationId(to)) {
    return Response.json({ error: 'Choose where to send.' }, { status: 400 })
  }
  const response = await fetch(irisForwardFeeUrl(DESTINATIONS[to].domain), {
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
