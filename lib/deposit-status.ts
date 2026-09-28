export function depositStatusFromIris(payload: unknown): 'pending' | 'deposited' {
  if (!payload || typeof payload !== 'object' || !('messages' in payload)) return 'pending'
  const messages = (payload as { messages?: unknown }).messages
  if (!Array.isArray(messages)) return 'pending'
  const confirmed = messages.some((message) => {
    if (!message || typeof message !== 'object') return false
    const row = message as { forwardState?: unknown; forwardTxHash?: unknown }
    const done = row.forwardState === 'CONFIRMED' || row.forwardState === 'COMPLETE'
    return done && typeof row.forwardTxHash === 'string' && row.forwardTxHash.length > 2
  })
  return confirmed ? 'deposited' : 'pending'
}
