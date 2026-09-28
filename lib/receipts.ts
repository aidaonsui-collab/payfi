export type DepositStatus = 'pending' | 'deposited'

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
  return status === 'deposited' ? 'Deposited to SoFi' : 'Pending deposit to SoFi'
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
    item.status === 'pending' || item.status === 'deposited' ? item.status : links.length > 0 ? 'deposited' : 'pending'
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
