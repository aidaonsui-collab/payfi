'use client'

import { useState } from 'react'
import { Eye, EyeOff, Smartphone } from 'lucide-react'
import { Sheet } from '@/components/Sheet'
import { SUI_CCTP_DOMAIN, SUI_EXPLORER } from '@/lib/chains'
import { dayLabel, formatExact, formatMoney, formatWhen, shortAddress } from '@/lib/format'
import { depositLabel, type Receipt } from '@/lib/receipts'
import { irisDomain } from '@/lib/transfer-id'

export function HomeView({
  balance,
  account,
  name,
  hidden,
  receipts,
  error,
  coinNote,
  onToggleHidden,
  onConnect,
  onMove,
  onActivity,
  onGuide,
  onSendAgain,
}: {
  balance: string | null
  account: string | null
  name: string | null
  hidden: boolean
  receipts: Receipt[]
  error: string
  coinNote: boolean
  onToggleHidden: () => void
  onConnect: () => void
  onMove: () => void
  onActivity: () => void
  onGuide: () => void
  onSendAgain: (address: string) => void
}) {
  const recent = receipts.slice(0, 4)
  const again: Receipt[] = []
  const seen = new Set<string>()
  for (const item of receipts) {
    const key = item.recipient.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    again.push(item)
    if (again.length === 5) break
  }
  const figure = hidden ? '••••' : balance == null ? '0.00' : formatMoney(balance)
  return (
    <div className="safe-x grid gap-4 pt-4 pb-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6 lg:pt-6">
      <div className="flex flex-col gap-4">
        <section className="rounded-card border border-line bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">USDC balance</h2>
            <button
              type="button"
              onClick={onToggleHidden}
              className="press flex size-10 items-center justify-center rounded-full text-muted"
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
            >
              {hidden ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </button>
          </div>
          <p className="num mt-3 text-hero font-semibold leading-none tracking-tight text-ink">{figure}</p>
          <p className="mt-3 text-sm text-muted">Available{account ? ` · ${name ?? shortAddress(account)}` : ' on Sui'}</p>
          <button type="button" onClick={onMove} className="press mt-5 h-10 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent">
            Move to SoFi
          </button>
        </section>

        {!account || coinNote || error ? (
          <section className="flex items-start gap-3 rounded-card border border-line bg-card p-5 shadow-card">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent">
              <Smartphone className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">{account ? 'USDC is still in coins' : 'Connect your Sui wallet'}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {error
                  ? error
                  : coinNote
                    ? 'PayFi spends the Sui address balance, not leftover coin objects.'
                    : 'Set up a wallet to send and receive USDC.'}
              </p>
              {!account ? (
                <button type="button" onClick={onConnect} className="press mt-3 text-sm font-semibold text-accent">
                  Connect wallet
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="rounded-card border border-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Recent</h2>
            {receipts.length > 0 ? (
              <button type="button" onClick={onActivity} className="press h-10 px-1 text-sm font-semibold text-accent">
                See all
              </button>
            ) : null}
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">A SoFi deposit shows up here after you send.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {recent.map((item) => (
                <li key={item.id}>
                  <ReceiptRow item={item} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="text-base font-semibold text-ink">Send again</h2>
          {again.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">Addresses you send to will show up here.</p>
          ) : (
            <ul className="mt-4 flex gap-4 overflow-x-auto pb-1">
              {again.map((item) => (
                <li key={item.recipient} className="w-16 shrink-0">
                  <button type="button" onClick={() => onSendAgain(item.recipient)} className="press flex w-full flex-col items-center gap-2">
                    <span className="flex size-14 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent">
                      {item.recipient.replace(/^0x/i, '').slice(-2).toUpperCase()}
                    </span>
                    <span className="w-full truncate text-center text-xs text-ink">{shortAddress(item.recipient)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card bg-nav p-5 text-nav-ink shadow-card">
          <h2 className="max-w-xs text-3xl font-semibold tracking-tight">USDC, into SoFi</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-nav-ink/80">
            Circle burns it on Sui and mints Ethereum USDC at the address SoFi shows you.
          </p>
          <button type="button" onClick={onGuide} className="press mt-6 h-10 rounded-full bg-card px-4 text-sm font-semibold text-ink">
            Read the guide
          </button>
        </section>

        <p className="text-sm leading-relaxed text-muted">
          SoFi receives the amount you enter. PayFi adds the live Circle bridge fee. A wrong address cannot be reversed.
        </p>
      </div>
    </div>
  )
}

export function ActivityView({ receipts, onMove }: { receipts: Receipt[]; onMove: () => void }) {
  const [open, setOpen] = useState<Receipt | null>(null)
  const groups: { label: string; items: Receipt[] }[] = []
  for (const item of receipts) {
    const label = dayLabel(item.at)
    const last = groups[groups.length - 1]
    if (!last || last.label !== label) groups.push({ label, items: [item] })
    else last.items.push(item)
  }
  return (
    <div className="safe-x pt-4 pb-8 md:pt-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Activity</h1>
      <p className="mt-1 text-sm text-muted">Saved in this browser only.</p>
      {receipts.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-card px-4 py-8 text-center">
          <p className="text-base font-semibold text-ink">No moves yet</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">A send shows up here as soon as it leaves your Sui wallet.</p>
          <button type="button" onClick={onMove} className="btn-primary press mx-auto mt-5 max-w-xs">
            Move to SoFi
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 text-sm font-medium text-muted">{group.label}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => setOpen(item)} className="press w-full px-4 text-left">
                      <ReceiptRow item={item} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {open ? <ReceiptDetail item={open} onClose={() => setOpen(null)} /> : null}
    </div>
  )
}

function ReceiptRow({ item }: { item: Receipt }) {
  return (
    <span className="flex items-center gap-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-semibold text-accent">SF</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">SoFi Crypto</span>
        <span className="mt-0.5 block truncate text-sm text-muted">
          {depositLabel(item.status)} · {formatWhen(item.at)}
        </span>
      </span>
      <span className="num shrink-0 text-right text-sm font-semibold text-ink">−{formatMoney(item.amount)}</span>
    </span>
  )
}

function ReceiptDetail({ item, onClose }: { item: Receipt; onClose: () => void }) {
  const explorer = irisDomain(item.id) === SUI_CCTP_DOMAIN ? `${SUI_EXPLORER}/${item.id}` : null
  return (
    <Sheet title="Move" onClose={onClose}>
      <div className="flex flex-col items-center pb-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-tint text-sm font-semibold text-accent">SF</span>
        <p className="mt-3 text-sm text-muted">To SoFi Crypto</p>
        <p className="num mt-1 text-3xl font-semibold tracking-tight text-ink">−{formatExact(item.amount)}</p>
        <p className={`mt-2 text-sm font-medium ${item.status === 'deposited' ? 'text-accent' : 'text-muted'}`}>{depositLabel(item.status)}</p>
      </div>
      <dl className="mt-4 divide-y divide-line border-t border-line">
        <Detail label="When" value={formatWhen(item.at)} />
        <Detail label="Network" value="Ethereum" />
        <Detail label="Address" value={shortAddress(item.recipient)} mono />
        <Detail label="Bridge fee" value={item.fee ? `${formatExact(item.fee)} USDC` : '—'} />
      </dl>
      {explorer ? (
        <a href={explorer} target="_blank" rel="noreferrer" className="press mt-4 mb-2 flex h-12 items-center justify-center rounded-full bg-fill text-sm font-semibold text-ink">
          View on Sui
        </a>
      ) : (
        <div className="h-4" />
      )}
    </Sheet>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`text-right text-sm font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

export function GuideView({ onMove }: { onMove: () => void }) {
  const steps = [
    { title: 'Copy the address in SoFi', body: 'Open Crypto, then Transfer, then Receive, and choose USDC.' },
    { title: 'Check the network', body: 'It must say Ethereum. PayFi always sends to Ethereum USDC.' },
    {
      title: 'Send from Sui',
      body: 'Circle burns USDC on Sui and mints Ethereum USDC at that address. SoFi credits it in SoFi Crypto.',
    },
  ]
  const rows = [
    ['SoFi receives', 'The amount you enter'],
    ['Circle bridge fee', 'Added from your Sui balance'],
    ['You also pay', 'A little SUI for gas'],
    ['Per move', 'Up to 25,000 USDC'],
    ['Network', 'Ethereum only'],
    ['Reversal', 'Not possible'],
  ]
  return (
    <div className="safe-x flex flex-col gap-5 pt-4 pb-8 md:pt-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Before you move</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">PayFi is the rail from a Sui USDC balance into the Ethereum address SoFi shows you.</p>
      </header>
      <ol className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
        {steps.map((item, index) => (
          <li key={item.title} className="flex gap-3 px-4 py-4">
            <span className="num mt-0.5 text-sm font-semibold text-accent">{index + 1}</span>
            <span>
              <span className="block text-sm font-semibold text-ink">{item.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted">{item.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <section className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
            <span className="text-sm text-muted">{label}</span>
            <span className="text-right text-sm font-semibold text-ink">{value}</span>
          </div>
        ))}
      </section>
      <button type="button" onClick={onMove} className="btn-primary press">
        Move to SoFi
      </button>
    </div>
  )
}
