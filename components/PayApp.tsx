'use client'

import { useEffect, useState } from 'react'
import {
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  Clock,
  Delete,
  House,
  Lock,
} from 'lucide-react'
import type { Address } from 'viem'
import { Mark } from '@/components/Mark'
import {
  addUsdc,
  dayLabel,
  formatExact,
  formatMoney,
  formatTyping,
  formatWhen,
  pushAmountKey,
  shortAddress,
  toUnits,
} from '@/lib/format'
import { loadReceipts, saveReceipts, type Receipt } from '@/lib/receipts'
import { sendArcUsdcToSofi, type SendStep } from '@/lib/send'
import { amountError, sofiAddressError } from '@/lib/validate'
import { arcUsdcBalance, connectArc, injectedProvider } from '@/lib/wallet'

type View = 'home' | 'move' | 'activity' | 'guide'
type Step = 'amount' | 'address' | 'review' | 'sending' | 'done'

const NAV: { id: View; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'move', label: 'Move', icon: ArrowLeftRight },
  { id: 'activity', label: 'Activity', icon: Clock },
  { id: 'guide', label: 'Guide', icon: BookOpen },
]

const PATH = [
  { title: 'Arc', body: 'USDC leaves the Arc wallet.' },
  { title: 'Circle', body: 'Burns it on Arc.' },
  { title: 'Ethereum', body: 'Mints USDC at the SoFi address.' },
  { title: 'SoFi', body: 'Credits the deposit in SoFi Crypto.' },
]

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const

export function PayApp() {
  const [view, setView] = useState<View>('home')
  const [step, setStep] = useState<Step>('amount')
  const [account, setAccount] = useState<Address | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [attested, setAttested] = useState(false)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [last, setLast] = useState<Receipt | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setReceipts(loadReceipts())
  }, [])

  function openMove() {
    setError('')
    setStep('amount')
    setView('move')
  }

  async function connect() {
    setError('')
    const provider = injectedProvider()
    if (!provider) {
      setError('Open PayFi in a browser with a wallet extension.')
      return
    }
    setBusy(true)
    try {
      const address = await connectArc(provider)
      setAccount(address)
      setBalance(await arcUsdcBalance(address))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-screen mx-auto flex w-full max-w-lg bg-paper md:max-w-6xl">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <div className="flex items-center gap-2 px-2">
          <Mark className="size-8 text-accent" />
          <div>
            <p className="text-base font-medium tracking-tight text-ink">PayFi</p>
            <p className="text-xs text-muted">Arc to SoFi</p>
          </div>
        </div>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
          {NAV.map((item) => {
            const active = view === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (item.id === 'move' ? openMove() : setView(item.id))}
                className={`press flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                  active ? 'bg-tint text-accent' : 'text-muted'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <p className="mt-auto px-3 text-xs leading-relaxed text-faint">
          A move uses your Arc wallet. Circle mints Ethereum USDC at the SoFi address.
        </p>
      </aside>

      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col md:mx-auto md:max-w-xl">
        {view !== 'move' ? (
          <div className="hidden items-center gap-2 border-b border-line px-10 py-4 md:flex">
            <p className="text-sm text-muted">USDC from Arc into the Ethereum address SoFi gives you.</p>
          </div>
        ) : null}

        {view === 'home' ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Brand />
            <Home
              balance={balance}
              account={account}
              receipts={receipts}
              error={error}
              busy={busy}
              onConnect={connect}
              onMove={openMove}
              onActivity={() => setView('activity')}
            />
          </div>
        ) : null}
        {view === 'activity' ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Brand />
            <Activity receipts={receipts} onMove={openMove} />
          </div>
        ) : null}
        {view === 'guide' ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Brand />
            <Guide onMove={openMove} />
          </div>
        ) : null}
        {view === 'move' ? (
          <Move
            account={account}
            balance={balance}
            amount={amount}
            recipient={recipient}
            attested={attested}
            step={step}
            busy={busy}
            error={error}
            last={last}
            onAmount={setAmount}
            onRecipient={setRecipient}
            onAttested={setAttested}
            onStep={setStep}
            onHome={() => setView('home')}
            onActivity={() => setView('activity')}
            onConnect={connect}
            onSent={(receipt, nextBalance) => {
              const next = [receipt, ...receipts]
              setReceipts(next)
              saveReceipts(next)
              setLast(receipt)
              setBalance(nextBalance)
              setStep('done')
            }}
            onError={setError}
            onBusy={setBusy}
          />
        ) : null}

        {view !== 'move' ? (
          <nav className="safe-b grid shrink-0 grid-cols-4 border-t border-line bg-card md:hidden" aria-label="Primary">
            {NAV.map((item) => {
              const active = view === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => (item.id === 'move' ? openMove() : setView(item.id))}
                  className={`press flex h-14 flex-col items-center justify-center gap-1 text-xs font-medium ${
                    active ? 'text-accent' : 'text-faint'
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        ) : null}
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="safe-x safe-t flex items-center gap-2 md:hidden">
      <Mark className="size-7 text-accent" />
      <p className="text-base font-medium tracking-tight text-ink">PayFi</p>
    </div>
  )
}

function Home({
  balance,
  account,
  receipts,
  error,
  busy,
  onConnect,
  onMove,
  onActivity,
}: {
  balance: string | null
  account: Address | null
  receipts: Receipt[]
  error: string
  busy: boolean
  onConnect: () => void
  onMove: () => void
  onActivity: () => void
}) {
  const recent = receipts.slice(0, 3)
  return (
    <div className="safe-x flex flex-col gap-5 pb-6 pt-4 md:px-10 md:pt-10">
      <header className="flex items-end justify-between gap-3 pt-2">
        <div>
          <p className="text-sm font-medium text-muted">Available on Arc</p>
          <p className="hero-num mt-2 text-ink">{balance == null ? '0.00' : formatMoney(balance)}</p>
          <p className="mt-2 text-sm font-medium text-accent">USDC</p>
        </div>
        <p className="mb-1 max-w-36 text-right text-xs text-muted">
          {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Not connected'}
        </p>
      </header>
      <button
        type="button"
        onClick={account ? onMove : onConnect}
        disabled={busy}
        className="press flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-medium text-on-accent disabled:opacity-40"
      >
        {account ? 'Move to SoFi' : 'Connect Arc'}
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </button>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <section className="panel p-3">
        <h2 className="px-2 pt-1 text-sm font-medium text-ink">How a move settles</h2>
        <ol className="mt-2">
          {PATH.map((item, index) => (
            <li key={item.title} className="flex gap-3 px-2 py-3">
              <span className="num mt-0.5 w-4 text-sm font-medium text-accent">{index + 1}</span>
              <span>
                <span className="block text-sm font-medium text-ink">{item.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{item.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Recent</h2>
          {receipts.length > 0 ? (
            <button type="button" onClick={onActivity} className="press h-11 px-1 text-sm font-medium text-muted">
              See all
            </button>
          ) : null}
        </div>
        {recent.length === 0 ? (
          <div className="panel px-4 py-5">
            <p className="text-sm text-muted">No moves yet. A SoFi deposit will show up here.</p>
          </div>
        ) : (
          <ul className="panel divide-y divide-line">
            {recent.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">To SoFi</span>
                  <span className="mt-0.5 block truncate text-sm text-muted">
                    {shortAddress(item.recipient)} · {formatWhen(item.at)}
                  </span>
                </span>
                <span className="num shrink-0 text-sm font-medium text-ink">−{formatMoney(item.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="px-1 text-sm leading-relaxed text-muted">
        SoFi receives the amount you enter. PayFi adds the live Circle bridge fee, your Arc wallet pays
        both, and Circle takes the fee out on Ethereum, plus a little Arc gas. A wrong address cannot
        be reversed.
      </p>
    </div>
  )
}

function Activity({ receipts, onMove }: { receipts: Receipt[]; onMove: () => void }) {
  const groups: { label: string; items: Receipt[] }[] = []
  for (const item of receipts) {
    const label = dayLabel(item.at)
    const last = groups[groups.length - 1]
    if (!last || last.label !== label) groups.push({ label, items: [item] })
    else last.items.push(item)
  }
  return (
    <div className="safe-x pb-6 pt-4 md:px-10 md:pt-10">
      <h1 className="pt-2 text-2xl font-medium tracking-tight text-ink">Activity</h1>
      <p className="mt-1 text-sm text-muted">Receipts stay on this device.</p>
      {receipts.length === 0 ? (
        <div className="panel mt-6 px-4 py-8 text-center">
          <p className="text-base font-medium text-ink">No moves yet</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
            A finished send to SoFi shows the amount, address, and explorer links here.
          </p>
          <button
            type="button"
            onClick={onMove}
            className="press mt-5 h-12 rounded-xl bg-accent px-5 text-sm font-medium text-on-accent"
          >
            Move to SoFi
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 text-sm font-medium text-muted">{group.label}</h2>
              <ul className="panel divide-y divide-line">
                {group.items.map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">To SoFi</span>
                        <span className="mt-0.5 block truncate font-mono text-sm text-muted">
                          {shortAddress(item.recipient)}
                        </span>
                        <span className="mt-0.5 block text-xs text-faint">{formatWhen(item.at)}</span>
                      </span>
                      <span className="num shrink-0 text-sm font-medium text-ink">−{formatMoney(item.amount)}</span>
                    </div>
                    {item.links.length > 0 ? (
                      <p className="mt-2 flex flex-wrap gap-3 text-xs">
                        {item.links.map((link) => (
                          <a key={link.url} className="font-medium text-accent" href={link.url} target="_blank" rel="noreferrer">
                            {link.name}
                          </a>
                        ))}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function Guide({ onMove }: { onMove: () => void }) {
  const steps = [
    { title: 'Copy the address in SoFi', body: 'Open Crypto, then Transfer, then Receive, and choose USDC.' },
    { title: 'Check the network', body: 'It must say Ethereum. PayFi always sends to Ethereum USDC.' },
    {
      title: 'Send from Arc',
      body: 'Circle burns USDC on Arc and mints Ethereum USDC at that address. SoFi credits it in SoFi Crypto.',
    },
  ]
  const rows = [
    ['SoFi receives', 'The amount you enter'],
    ['Circle bridge fee', 'Added from your Arc balance'],
    ['You also pay', 'A little Arc gas'],
    ['Per move', 'Up to 25,000 USDC'],
    ['Network', 'Ethereum only'],
    ['Reversal', 'Not possible'],
  ]
  return (
    <div className="safe-x flex flex-col gap-5 pb-8 pt-4 md:px-10 md:pt-10">
      <header className="pt-2">
        <h1 className="text-2xl font-medium tracking-tight text-ink">Before you move</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          PayFi is the rail from an Arc USDC balance into the Ethereum address SoFi shows you.
        </p>
      </header>
      <ol className="panel">
        {steps.map((item, index) => (
          <li key={item.title} className="flex gap-3 border-b border-line px-4 py-4 last:border-b-0">
            <span className="num mt-0.5 text-sm font-medium text-accent">{index + 1}</span>
            <span>
              <span className="block text-sm font-medium text-ink">{item.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted">{item.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <section className="panel divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
            <span className="text-sm text-muted">{label}</span>
            <span className="text-right text-sm font-medium text-ink">{value}</span>
          </div>
        ))}
      </section>
      <button type="button" onClick={onMove} className="press h-12 w-full rounded-xl bg-accent text-base font-medium text-on-accent">
        Move to SoFi
      </button>
    </div>
  )
}

async function loadBridgeFee(amount: string): Promise<string | null> {
  const response = await fetch(`/api/fee?amount=${encodeURIComponent(amount)}`)
  const data = (await response.json()) as { fee?: string }
  if (!response.ok || !data.fee || amountError(data.fee)) return null
  return data.fee
}

function Move(props: {
  account: Address | null
  balance: string | null
  amount: string
  recipient: string
  attested: boolean
  step: Step
  busy: boolean
  error: string
  last: Receipt | null
  onAmount: (value: string) => void
  onRecipient: (value: string) => void
  onAttested: (value: boolean) => void
  onStep: (step: Step) => void
  onHome: () => void
  onActivity: () => void
  onConnect: () => void
  onSent: (receipt: Receipt, balance: string) => void
  onError: (message: string) => void
  onBusy: (value: boolean) => void
}) {
  const [tried, setTried] = useState(false)
  const [fee, setFee] = useState<string | null>(null)
  const [feeState, setFeeState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const balanceValue = props.balance ?? '0'
  const problem = !props.account
    ? 'Connect an Arc wallet first.'
    : amountError(props.amount) ||
      (toUnits(props.amount) > toUnits(balanceValue) ? 'That is more than the Arc balance.' : null)
  const destination = sofiAddressError(props.recipient)
  const title =
    props.step === 'amount'
      ? 'Amount'
      : props.step === 'address'
        ? 'SoFi address'
        : props.step === 'review'
          ? 'Review'
          : props.step === 'sending'
            ? 'Settling'
            : 'Receipt'
  const index = props.step === 'amount' ? '1' : props.step === 'address' ? '2' : props.step === 'review' ? '3' : ''

  const paid = fee ? addUsdc(props.amount, fee) : null
  const reviewProblem =
    feeState === 'failed'
      ? 'Circle did not quote a bridge fee.'
      : paid && amountError(paid)
        ? amountError(paid)
        : paid && props.balance != null && toUnits(paid) > toUnits(props.balance)
          ? 'The bridge fee makes this more than the Arc balance.'
          : null

  useEffect(() => {
    if (props.step !== 'review' || amountError(props.amount)) return
    let cancelled = false
    setFee(null)
    setFeeState('loading')
    loadBridgeFee(props.amount)
      .then((next) => {
        if (cancelled) return
        if (!next) {
          setFeeState('failed')
          return
        }
        setFee(next)
        setFeeState('ready')
      })
      .catch(() => {
        if (!cancelled) setFeeState('failed')
      })
    return () => {
      cancelled = true
    }
  }, [props.step, props.amount])

  function goBack() {
    if (props.step === 'address') props.onStep('amount')
    else if (props.step === 'review') props.onStep('address')
    else if (props.step !== 'sending') props.onHome()
  }

  async function onContinue() {
    if (props.step === 'amount') {
      if (problem) return
      props.onStep('address')
      return
    }
    if (props.step === 'address') {
      setTried(true)
      if (destination || !props.attested) return
      props.onStep('review')
      return
    }
    if (props.step !== 'review' || !props.account || !fee || reviewProblem) return
    const provider = injectedProvider()
    if (!provider) {
      props.onError('Open PayFi in a browser with a wallet extension.')
      return
    }
    props.onError('')
    props.onBusy(true)
    try {
      const fresh = await loadBridgeFee(props.amount)
      if (!fresh) {
        setFeeState('failed')
        props.onError('Circle did not quote a bridge fee.')
        return
      }
      if (fresh !== fee) {
        setFee(fresh)
        setFeeState('ready')
        props.onError('The bridge fee changed. Check the new total, then confirm.')
        return
      }
      props.onStep('sending')
      const result = await sendArcUsdcToSofi({
        provider,
        recipient: props.recipient,
        amount: props.amount,
        fee,
      })
      if (result.state !== 'success') {
        props.onStep('review')
        props.onError(`The bridge ended in ${result.state}.`)
        return
      }
      const nextBalance = await arcUsdcBalance(props.account)
      props.onSent(
        {
          id: result.steps.find((step) => step.txHash)?.txHash?.slice(0, 10) ?? `pf_${Date.now()}`,
          amount: props.amount,
          fee,
          recipient: props.recipient.trim(),
          at: Date.now(),
          links: linksFrom(result.steps),
        },
        nextBalance,
      )
    } catch (err) {
      props.onStep('review')
      props.onError(err instanceof Error ? err.message : 'The send failed.')
    } finally {
      props.onBusy(false)
    }
  }

  const showFooter = props.step === 'amount' || props.step === 'address' || props.step === 'review'
  const continueDisabled =
    props.busy ||
    (props.step === 'amount' && !!problem) ||
    (props.step === 'address' && (!!destination || !props.attested)) ||
    (props.step === 'review' && (feeState !== 'ready' || !!reviewProblem))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="safe-x safe-t grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center pt-1 md:px-10">
        <button
          type="button"
          onClick={goBack}
          disabled={props.step === 'sending'}
          className="press flex size-11 items-center justify-center rounded-full text-ink disabled:opacity-30"
          aria-label="Back"
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
        <h1 className="text-center text-sm font-medium text-ink">{title}</h1>
        <span className="text-right text-xs font-medium text-faint">{index ? `${index}/3` : ''}</span>
      </header>
      <div className="safe-x min-h-0 flex-1 overflow-y-auto md:px-10">
        {props.step === 'amount' ? (
          <div className="pt-4">
            {!props.account ? (
              <button type="button" onClick={props.onConnect} className="press mb-4 h-11 w-full rounded-xl bg-tint text-sm font-medium text-accent">
                Connect Arc to see your balance
              </button>
            ) : null}
            <p className="text-center text-sm text-muted">USDC to SoFi</p>
            <p className={`hero-num mt-3 text-center ${props.amount ? 'text-ink' : 'text-faint'}`}>{formatTyping(props.amount)}</p>
            <p className="mt-3 text-center text-sm text-muted">
              Available {props.balance == null ? '—' : formatMoney(props.balance)} USDC
            </p>
            <p className="mt-1 text-center text-sm text-muted">A bridge fee is added before you confirm.</p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {['100', '500', '1000'].map((chip) => (
                <button key={chip} type="button" onClick={() => props.onAmount(chip)} className="press h-11 rounded-full bg-tint text-sm font-medium text-accent">
                  {Number(chip).toLocaleString('en-US')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => props.onAmount(props.balance && Number(props.balance) > 25000 ? '25000' : props.balance || '0')}
                className="press h-11 rounded-full bg-tint text-sm font-medium text-accent"
              >
                Max
              </button>
            </div>
            <p className="mt-3 min-h-5 text-center text-sm text-bad" role="alert">
              {props.amount && problem ? problem : ''}
            </p>
          </div>
        ) : null}
        {props.step === 'address' ? (
          <Address
            recipient={props.recipient}
            attested={props.attested}
            destination={destination}
            tried={tried}
            onRecipient={(value) => {
              props.onRecipient(value)
              setTried(false)
            }}
            onAttest={props.onAttested}
          />
        ) : null}
        {props.step === 'review' ? (
          <div className="flex flex-col gap-4 pt-2">
            <div className="text-center">
              <p className="text-sm text-muted">SoFi receives</p>
              <p className="hero-num mt-2 text-ink">{formatExact(props.amount)}</p>
              <p className="mt-2 text-sm text-muted">USDC on Ethereum</p>
            </div>
            <dl className="panel divide-y divide-line">
              <Row label="To" value="SoFi Crypto" />
              <Row label="Network" value="Ethereum" />
              <Row label="Address" value={shortAddress(props.recipient)} mono />
              <Row label="Bridge fee" value={fee ? `$${formatExact(fee)}` : feeState === 'failed' ? 'Unavailable' : 'Quoting Circle…'} />
              <Row label="You pay" value={paid ? `${formatExact(paid)} USDC` : '—'} />
            </dl>
            <p className="px-1 text-sm leading-relaxed text-muted">
              Circle burns what you pay on Arc and mints the amount above on Ethereum. The bridge fee is the
              difference, taken out on Ethereum. A wrong address cannot be reversed.
            </p>
            {reviewProblem ? <p className="text-sm text-bad">{reviewProblem}</p> : null}
            {props.error ? <p className="text-sm text-bad">{props.error}</p> : null}
          </div>
        ) : null}
        {props.step === 'sending' ? (
          <div className="pt-8">
            <p className="text-sm text-muted">Waiting for your wallet, then Circle mints on Ethereum.</p>
          </div>
        ) : null}
        {props.step === 'done' && props.last ? (
          <div className="flex flex-col items-center pt-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-on-accent">
              <Check className="size-6" aria-hidden="true" />
            </span>
            <p className="mt-5 text-sm text-muted">SoFi receives</p>
            <p className="hero-num mt-2 text-ink">{formatExact(props.last.amount)}</p>
            <p className="mt-2 text-sm text-muted">USDC on Ethereum</p>
            <dl className="panel mt-8 w-full divide-y divide-line text-left">
              <Row label="Address" value={shortAddress(props.last.recipient)} mono />
              <Row
                label="You paid"
                value={props.last.fee ? `${formatExact(addUsdc(props.last.amount, props.last.fee))} USDC` : '—'}
              />
              <Row label="Bridge fee" value={props.last.fee ? `$${formatExact(props.last.fee)}` : 'Quoted at send'} />
              <Row label="Arc balance" value={props.balance ? `${formatMoney(props.balance)} USDC` : '—'} />
            </dl>
            {props.last.links.length > 0 ? (
              <p className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
                {props.last.links.map((link) => (
                  <a key={link.url} className="font-medium text-accent" href={link.url} target="_blank" rel="noreferrer">
                    {link.name}
                  </a>
                ))}
              </p>
            ) : null}
            <button type="button" onClick={props.onHome} className="press mt-6 h-12 w-full rounded-xl bg-accent text-base font-medium text-on-accent">
              Done
            </button>
            <button type="button" onClick={props.onActivity} className="press mt-1 h-12 w-full text-sm font-medium text-muted">
              View activity
            </button>
          </div>
        ) : null}
      </div>
      {showFooter ? (
        <footer className="safe-x safe-b shrink-0 bg-paper pt-2 md:px-10">
          {props.step === 'amount' ? (
            <div className="grid grid-cols-3 gap-2" aria-label="Amount keypad">
              {KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => props.onAmount(pushAmountKey(props.amount, key))}
                  className="press key text-ink"
                  aria-label={key === 'back' ? 'Delete' : key}
                >
                  {key === 'back' ? <Delete className="mx-auto size-5" aria-hidden="true" /> : key}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled}
            className="press mt-3 h-12 w-full rounded-xl bg-accent text-base font-medium text-on-accent disabled:opacity-40"
          >
            {props.busy ? 'Sending…' : props.step === 'review' ? 'Confirm move' : 'Continue'}
          </button>
        </footer>
      ) : null}
    </div>
  )
}

function Address({
  recipient,
  attested,
  destination,
  tried,
  onRecipient,
  onAttest,
}: {
  recipient: string
  attested: boolean
  destination: string | null
  tried: boolean
  onRecipient: (value: string) => void
  onAttest: (value: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div>
        <label htmlFor="sofi-address" className="text-sm font-medium text-ink">
          Ethereum USDC address
        </label>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          From SoFi: Crypto, Transfer, Receive, USDC. The network must say Ethereum.
        </p>
      </div>
      <textarea
        id="sofi-address"
        value={recipient}
        onChange={(event) => onRecipient(event.target.value)}
        placeholder="0x"
        spellCheck={false}
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-fill px-4 py-3 font-mono text-base leading-relaxed text-ink outline-none placeholder:text-faint"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            onRecipient((await navigator.clipboard.readText()).trim())
          } catch {
            onRecipient(recipient)
          }
        }}
        className="press h-11 self-start rounded-full bg-tint px-4 text-sm font-medium text-accent"
      >
        Paste
      </button>
      <div className="panel flex items-center justify-between px-4 py-3">
        <span className="text-sm text-muted">Network</span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <Lock className="size-3.5" aria-hidden="true" />
          Ethereum
        </span>
      </div>
      <button
        type="button"
        role="checkbox"
        aria-checked={attested}
        onClick={() => onAttest(!attested)}
        className="press flex min-h-14 items-start gap-3 rounded-xl border border-line bg-fill px-4 py-3 text-left"
      >
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
            attested ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card text-transparent'
          }`}
          aria-hidden="true"
        >
          <Check className="size-3.5" />
        </span>
        <span className="text-sm leading-relaxed text-ink">
          I confirmed this is the Ethereum address SoFi shows for my USDC deposit.
        </span>
      </button>
      <p className="min-h-5 text-sm text-bad" role="alert">
        {destination && recipient.trim() ? destination : tried && !attested ? 'Confirm the SoFi network is Ethereum.' : ''}
      </p>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`text-right text-sm font-medium text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function linksFrom(steps: SendStep[]) {
  return steps
    .filter((step) => step.explorerUrl)
    .map((step) => ({ name: step.name, url: step.explorerUrl as string }))
}
