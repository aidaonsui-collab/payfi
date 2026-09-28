export type Receipt = {
  id: string
  amount: string
  fee: string | null
  recipient: string
  at: number
  links: { name: string; url: string }[]
}

const KEY = 'payfi.receipts.v1'

export function loadReceipts(): Receipt[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Receipt[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveReceipts(receipts: Receipt[]) {
  window.localStorage.setItem(KEY, JSON.stringify(receipts.slice(0, 40)))
}
