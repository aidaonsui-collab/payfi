import { depositStatusFromIris } from '@/lib/deposit-status'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const tx = new URL(request.url).searchParams.get('tx') ?? ''
  if (!/^0x[0-9a-fA-F]{64}$/.test(tx)) {
    return Response.json({ error: 'Missing transfer.' }, { status: 400 })
  }
  const response = await fetch(`https://iris-api.circle.com/v2/messages/26?transactionHash=${tx}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    return Response.json({ status: 'pending' }, { headers: { 'cache-control': 'no-store' } })
  }
  const status = depositStatusFromIris(await response.json())
  return Response.json({ status }, { headers: { 'cache-control': 'no-store' } })
}
