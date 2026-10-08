import type { DepositStatus } from './receipts'

export function depositStatusFromIris(payload: unknown): DepositStatus {
  if (!payload || typeof payload !== 'object' || !('messages' in payload)) return 'pending'
  const messages = (payload as { messages?: unknown }).messages
  if (!Array.isArray(messages)) return 'pending'
  const rows = messages.flatMap((message) => {
    if (!message || typeof message !== 'object') return []
    return [message as { forwardState?: unknown; forwardTxHash?: unknown }]
  })
  const confirmed = rows.some((row) => {
    const done = row.forwardState === 'CONFIRMED' || row.forwardState === 'COMPLETE'
    return done && typeof row.forwardTxHash === 'string' && row.forwardTxHash.length > 2
  })
  if (confirmed) return 'deposited'
  // Circle burned the USDC but its relayer gave up on the Ethereum mint.
  return rows.some((row) => row.forwardState === 'FAILED') ? 'failed' : 'pending'
}
