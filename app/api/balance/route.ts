import { SUI_GRAPHQL, SUI_USDC_TYPE } from '@/lib/chains'
import { suiBalanceFromGraphQL } from '@/lib/sui-balance'

export const dynamic = 'force-dynamic'

const QUERY = `query($address: SuiAddress!, $coinType: String!) {
  address(address: $address) {
    balance(coinType: $coinType) { addressBalance coinBalance }
  }
}`

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('address') ?? ''
  const hex = raw.trim().toLowerCase().replace(/^0x/, '')
  if (!/^[0-9a-f]{1,64}$/.test(hex)) {
    return Response.json({ error: 'Missing Sui address.' }, { status: 400 })
  }
  const address = `0x${hex.padStart(64, '0')}`
  const response = await fetch(SUI_GRAPHQL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { address, coinType: SUI_USDC_TYPE } }),
    cache: 'no-store',
  })
  if (!response.ok) {
    return Response.json({ error: 'Sui did not return a balance.' }, { status: 502 })
  }
  const parsed = suiBalanceFromGraphQL(await response.json())
  if (!parsed) {
    return Response.json({ error: 'Sui did not return a balance.' }, { status: 502 })
  }
  return Response.json(parsed, { headers: { 'cache-control': 'no-store' } })
}
