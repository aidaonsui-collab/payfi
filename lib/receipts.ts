export type DepositStatus = 'pending' | 'deposited' | 'failed'

export type Receipt = {
  id: string
  amount: string
  fee: string | null
  recipient: string
  at: number
  status: DepositStatus
  links: { name: string; url: string }[]
}

const KEY = 'payfi.receipts.v1'

export function depositLabel(status: DepositStatus): string {
  if (status === 'deposited') return 'Deposited to SoFi'
  if (status === 'failed') return 'Delivery to SoFi failed'
  return 'Pending deposit to SoFi'
}

/** The SoFi address of the newest move that reached SoFi, if any. */
export function lastDepositAddress(receipts: Receipt[]): string | null {
  const last = receipts.find((item) => item.status === 'deposited' && /^0x[0-9a-fA-F]{40}$/.test(item.recipient))
  return last ? last.recipient : null
}

export function normalizeReceipt(raw: unknown): Receipt | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<Receipt>
  if (typeof item.id !== 'string' || typeof item.amount !== 'string') return null
  const links = Array.isArray(item.links)
    ? item.links.flatMap((link) => {
        if (!link || typeof link !== 'object') return []
        const row = link as { name?: unknown; url?: unknown }
        if (typeof row.url !== 'string') return []
        return [{ name: typeof row.name === 'string' ? row.name : '', url: row.url }]
      })
    : []
  const status: DepositStatus =
    item.status === 'pending' || item.status === 'deposited' || item.status === 'failed'
      ? item.status
      : links.length > 0
        ? 'deposited'
        : 'pending'
  return {
    id: item.id,
    amount: item.amount,
    fee: typeof item.fee === 'string' ? item.fee : null,
    recipient: typeof item.recipient === 'string' ? item.recipient : '',
    at: typeof item.at === 'number' ? item.at : Date.now(),
    status,
    links,
  }
}

export function loadReceipts(): Receipt[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const receipt = normalizeReceipt(item)
      return receipt ? [receipt] : []
    })
  } catch {
    return []
  }
}

export function saveReceipts(receipts: Receipt[]) {
  window.localStorage.setItem(KEY, JSON.stringify(receipts.slice(0, 40)))
}
