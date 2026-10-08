import { irisMessagesUrl } from '@/lib/chains'
import { depositStatusFromIris } from '@/lib/deposit-status'
import { irisDomain } from '@/lib/transfer-id'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const tx = new URL(request.url).searchParams.get('tx') ?? ''
  const domain = irisDomain(tx)
  if (domain == null) {
    return Response.json({ error: 'Missing transfer.' }, { status: 400 })
  }
  const response = await fetch(irisMessagesUrl(domain, tx), {
    cache: 'no-store',
  })
  if (!response.ok) {
    return Response.json({ status: 'pending' }, { headers: { 'cache-control': 'no-store' } })
  }
  const status = depositStatusFromIris(await response.json())
  return Response.json({ status }, { headers: { 'cache-control': 'no-store' } })
}
