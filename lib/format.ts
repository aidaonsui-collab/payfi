const SCALE = 1_000_000n

export function toUnits(raw: string): bigint {
  const value = raw.trim()
  if (!/^\d+(\.\d{1,6})?$/.test(value)) return 0n
  const [whole, frac = ''] = value.split('.')
  return BigInt(whole) * SCALE + BigInt(frac.padEnd(6, '0'))
}

export function formatMoney(raw: string): string {
  const units = toUnits(raw || '0')
  const whole = units / SCALE
  const frac = (units % SCALE).toString().padStart(6, '0').slice(0, 2)
  return `${whole.toLocaleString('en-US')}.${frac}`
}

export function formatExact(raw: string): string {
  const units = toUnits(raw)
  const whole = units / SCALE
  const frac = (units % SCALE).toString().padStart(6, '0').replace(/0+$/, '')
  return frac ? `${whole.toLocaleString('en-US')}.${frac}` : whole.toLocaleString('en-US')
}

export function formatTyping(raw: string): string {
  if (!raw) return '0'
  const [whole, frac] = raw.split('.')
  const formatted = Number(whole || '0').toLocaleString('en-US')
  if (raw.endsWith('.')) return `${formatted}.`
  if (frac !== undefined) return `${formatted}.${frac}`
  return formatted
}

export function shortAddress(raw: string): string {
  const value = raw.trim()
  if (value.length < 12) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

export function formatWhen(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(ts)
}

export function dayLabel(ts: number): string {
  const date = new Date(ts)
  const today = new Date()
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = (start(today) - start(date)) / 86_400_000
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(date)
}

export function pushAmountKey(prev: string, key: string): string {
  if (key === 'back') return prev.slice(0, -1)
  if (key === '.') {
    if (prev.includes('.')) return prev
    return `${prev || '0'}.`
  }
  if (!/^\d$/.test(key)) return prev
  const base = prev === '0' ? '' : prev
  const next = base + key
  const [whole, frac] = next.split('.')
  if (whole.length > 5) return prev
  if (frac && frac.length > 6) return prev
  return next
}
