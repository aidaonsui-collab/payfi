const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

/** Keep a SuiNS domain the owner set as this address's default name. */
export function suinsName(domain: string): string | null {
  const name = domain.trim().toLowerCase()
  if (!name.endsWith('.sui') || name.length > 80) return null
  const labels = name.slice(0, -4).split('.')
  if (labels.length === 0 || labels.some((label) => !LABEL.test(label))) return null
  return name
}

/** `null` name means the address has no default SuiNS name. `null` result means the response was unusable. */
export function suinsNameFromGraphQL(payload: unknown): { name: string | null } | null {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) return null
  const data = (payload as { data?: unknown }).data
  if (!data || typeof data !== 'object' || !('address' in data)) return null
  const address = (data as { address?: unknown }).address
  if (address == null) return { name: null }
  if (typeof address !== 'object' || !('defaultNameRecord' in address)) return null
  const record = (address as { defaultNameRecord?: unknown }).defaultNameRecord
  if (record == null) return { name: null }
  if (typeof record !== 'object' || !('domain' in record)) return null
  const domain = (record as { domain?: unknown }).domain
  if (typeof domain !== 'string') return null
  return { name: suinsName(domain) }
}
