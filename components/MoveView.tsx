'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronLeft, Delete, Lock } from 'lucide-react'
import {
  addressGroups,
  addUsdc,
  formatExact,
  formatMoney,
  formatTyping,
  pushAmountKey,
  shortAddress,
  toUnits,
} from '@/lib/format'
import type { Receipt } from '@/lib/receipts'
import { sendSuiUsdcToSofi } from '@/lib/send'
import { amountError, sofiAddressError } from '@/lib/validate'

export type Step = 'amount' | 'address' | 'review' | 'sending' | 'sent'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const
const CHIPS = ['100', '500', '1000'] as const

async function loadBridgeFee(amount: string): Promise<string | null> {
  const response = await fetch(`/api/fee?amount=${encodeURIComponent(amount)}`)
  const data = (await response.json()) as { fee?: string }
  if (!response.ok || !data.fee || amountError(data.fee)) return null
  return data.fee
}

export function MoveView(props: {
  account: string | null
  balance: string | null
  amount: string
  recipient: string
  lastAddress: string | null
  attested: boolean
  step: Step
  busy: boolean
  error: string
  onAmount: (value: string) => void
  onRecipient: (value: string) => void
  onAttested: (value: boolean) => void
  onStep: (step: Step) => void
  onHome: () => void
  onConnect: () => void
  onSent: (receipt: Receipt) => void
  onError: (message: string) => void
  onBusy: (value: boolean) => void
  onDone: () => void
}) {
  const [tried, setTried] = useState(false)
  const [fee, setFee] = useState<string | null>(null)
  const [feeState, setFeeState] = useState<'loading' | 'ready' | 'failed'>('loading')

  const balanceValue = props.balance ?? '0'
  const typedProblem = amountError(props.amount)
  const overBalance =
    props.account && props.balance != null && props.amount && !typedProblem && toUnits(props.amount) > toUnits(balanceValue)
      ? 'That is more than the Sui balance.'
      : null
  const problem = typedProblem || overBalance
  const destination = sofiAddressError(props.recipient)
  // The last SoFi address when this one differs from it, to warn about a swapped paste.
  const changedFrom =
    !destination && props.lastAddress && props.lastAddress.toLowerCase() !== props.recipient.trim().toLowerCase()
      ? props.lastAddress
      : null
  const title =
    props.step === 'amount' ? 'Amount' : props.step === 'address' ? 'SoFi address' : props.step === 'review' ? 'Review' : props.step === 'sending' ? 'Sending' : 'Sent'
  const progress = props.step === 'amount' ? 1 : props.step === 'address' ? 2 : 3
  const index = props.step === 'amount' ? '1 of 3' : props.step === 'address' ? '2 of 3' : props.step === 'review' ? '3 of 3' : ''
  const paid = fee ? addUsdc(props.amount, fee) : null
  const reviewProblem =
    feeState === 'failed'
      ? 'Circle did not quote a bridge fee.'
      : paid && amountError(paid)
        ? amountError(paid)
        : paid && props.account && props.balance != null && toUnits(paid) > toUnits(props.balance)
          ? 'The bridge fee makes this more than the Sui balance.'
          : null

  useEffect(() => {
    if (props.step !== 'amount') return
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (event.key === 'Backspace') props.onAmount(pushAmountKey(props.amount, 'back'))
      else if (event.key === '.' || event.key === 'Decimal') props.onAmount(pushAmountKey(props.amount, '.'))
      else if (/^\d$/.test(event.key)) props.onAmount(pushAmountKey(props.amount, event.key))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [props.step, props.amount, props.onAmount])

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
    if (props.step === 'sending' || props.step === 'sent') return
    if (props.step === 'address') props.onStep('amount')
    else if (props.step === 'review') props.onStep('address')
    else props.onHome()
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
    if (props.step !== 'review' || !fee || reviewProblem) return
    if (!props.account) {
      props.onConnect()
      return
    }
    props.onError('')
    props.onBusy(true)
    let burned: string | null = null
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
      const digest = await sendSuiUsdcToSofi({
        address: props.account,
        recipient: props.recipient,
        amount: props.amount,
        fee,
        onSent: (txHash) => {
          burned = txHash
          props.onSent({
            id: txHash,
            amount: props.amount,
            fee,
            recipient: props.recipient.trim(),
            at: Date.now(),
            status: 'pending',
            links: [],
          })
        },
      })
      if (!burned) {
        props.onSent({
          id: digest,
          amount: props.amount,
          fee,
          recipient: props.recipient.trim(),
          at: Date.now(),
          status: 'pending',
          links: [],
        })
      }
    } catch (err) {
      if (!burned) {
        props.onStep('review')
        props.onError(err instanceof Error ? err.message : 'The send failed.')
      }
    } finally {
      props.onBusy(false)
    }
  }

  const showFooter = props.step === 'amount' || props.step === 'address' || props.step === 'review' || props.step === 'sent'
  const continueDisabled =
    props.busy ||
    (props.step === 'amount' && !!problem) ||
    (props.step === 'address' && (!!destination || !props.attested)) ||
    (props.step === 'review' && !!props.account && (feeState !== 'ready' || !!reviewProblem))
  const continueLabel = props.busy ? 'Sending…' : props.step === 'review' ? (props.account ? 'Send' : 'Connect wallet') : props.step === 'sent' ? 'Done' : 'Continue'

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
      <header className="safe-x safe-t flex shrink-0 items-center">
        <button
          type="button"
          onClick={goBack}
          disabled={props.step === 'sending' || props.step === 'sent'}
          className="press flex size-11 items-center justify-center rounded-full text-ink disabled:opacity-30"
          aria-label="Back"
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
        <h1 className="flex-1 text-center text-sm font-semibold text-ink">{title}</h1>
        <span className="flex size-11 items-center justify-end text-xs font-medium text-faint">{index}</span>
      </header>
      <div className="safe-x mt-1 flex shrink-0 gap-1" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <span key={item} className={`h-0.5 flex-1 rounded-full ${item <= progress ? 'bg-accent' : 'bg-fill'}`} />
        ))}
      </div>

      <div className="safe-x min-h-0 flex-1 overflow-y-auto">
        {props.step === 'amount' ? (
          <div className="pt-8">
            <p className="text-center text-sm font-medium text-muted">To SoFi</p>
            <p className="mt-3 flex items-baseline justify-center gap-2">
              <span className={`num text-hero font-semibold leading-none tracking-tight ${props.amount ? 'text-ink' : 'text-faint'}`}>{formatTyping(props.amount)}</span>
              <span className="text-lg font-medium text-muted">USDC</span>
            </p>
            <p className="mt-3 text-center text-sm text-muted">
              {props.account ? `Available ${props.balance == null ? '—' : formatMoney(props.balance)} USDC` : 'Connect a Sui wallet before you send'}
            </p>
            <p className="mt-1 text-center text-sm text-muted">A bridge fee is added on the next step.</p>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {CHIPS.map((chip) => (
                <button key={chip} type="button" onClick={() => props.onAmount(chip)} className="press h-11 rounded-full bg-fill text-sm font-semibold text-ink">
                  {Number(chip).toLocaleString('en-US')}
                </button>
              ))}
              <button
                type="button"
                disabled={!props.balance}
                onClick={() => props.onAmount(props.balance && Number(props.balance) > 25000 ? '25000' : props.balance || '0')}
                className="press h-11 rounded-full bg-fill text-sm font-semibold text-ink disabled:opacity-40"
              >
                Max
              </button>
            </div>
            <p className="mt-3 min-h-5 text-center text-sm text-bad" role="alert">
              {props.amount && problem && problem !== 'Enter a USDC amount with up to 6 decimals.' ? problem : ''}
            </p>
          </div>
        ) : null}

        {props.step === 'address' ? (
          <AddressStep
            recipient={props.recipient}
            attested={props.attested}
            destination={destination}
            changedFrom={changedFrom}
            tried={tried}
            onRecipient={(value) => {
              props.onRecipient(value)
              setTried(false)
            }}
            onAttest={props.onAttested}
          />
        ) : null}

        {props.step === 'review' ? (
          <div className="flex flex-col gap-4 pt-6">
            <div className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-tint text-sm font-semibold text-accent">SF</span>
              <p className="mt-3 text-sm font-medium text-muted">SoFi receives</p>
              <p className="num mt-1 text-hero font-semibold leading-none tracking-tight text-ink">{formatExact(props.amount)}</p>
              <p className="mt-2 text-sm text-muted">USDC on Ethereum</p>
            </div>
            <dl className="divide-y divide-line overflow-hidden rounded-card border border-line">
              <Row label="To" value="SoFi Crypto" />
              <Row label="Network" value="Ethereum" />
              <div className="px-4 py-3">
                <dt className="text-sm text-muted">SoFi address</dt>
                <dd className="mt-2">
                  <div className="grid grid-cols-[repeat(5,max-content)] gap-x-2 gap-y-1 font-mono text-base font-medium text-ink">
                    {addressGroups(props.recipient).map((group, i) => (
                      <span key={i}>{group}</span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted">Check every group against the address in SoFi.</div>
                </dd>
              </div>
              <Row label="Bridge fee" value={fee ? `${formatExact(fee)} USDC` : feeState === 'failed' ? 'Unavailable' : 'Getting the fee'} />
              <Row label="You pay" value={paid ? `${formatExact(paid)} USDC` : '—'} />
            </dl>
            {changedFrom ? <NewAddressNote last={changedFrom} /> : null}
            <p className="text-sm leading-relaxed text-muted">
              Your wallet signs the burn. PayFi never holds the USDC. Circle mints the amount above on Ethereum and takes the bridge fee there. A wrong address cannot be reversed.
            </p>
            {reviewProblem ? <p className="text-sm text-bad" role="alert">{reviewProblem}</p> : null}
            {props.error ? <p className="text-sm text-bad" role="alert">{props.error}</p> : null}
          </div>
        ) : null}

        {props.step === 'sending' ? (
          <div className="flex flex-col items-center pt-20 text-center">
            <span className="size-10 animate-spin rounded-full border-2 border-fill border-t-accent" aria-hidden="true" />
            <p className="mt-6 text-base font-semibold text-ink">Confirm in your wallet</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">Approve the Sui burn. Nothing moves until you do.</p>
          </div>
        ) : null}

        {props.step === 'sent' ? (
          <div className="flex flex-col items-center pt-16 text-center">
            <svg className="size-16" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="check-ring" cx="26" cy="26" r="24" />
              <path className="check-mark" d="M14 27.5 22.2 35.5 38 18" />
            </svg>
            <p className="mt-6 text-2xl font-semibold tracking-tight text-ink">Sent</p>
            <p className="num mt-2 text-hero font-semibold leading-none tracking-tight text-ink">{formatExact(props.amount)}</p>
            <p className="mt-3 text-sm text-muted">USDC · pending deposit to SoFi</p>
          </div>
        ) : null}
      </div>

      {showFooter ? (
        <footer className="safe-x shrink-0 bg-card pt-2 pb-3">
          {props.step === 'amount' ? (
            <div className="grid grid-cols-3 gap-2" aria-label="Amount keypad">
              {KEYS.map((key) => (
                <button key={key} type="button" onClick={() => props.onAmount(pushAmountKey(props.amount, key))} className="press key" aria-label={key === 'back' ? 'Delete' : key}>
                  {key === 'back' ? <Delete className="mx-auto size-5" aria-hidden="true" /> : key}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" onClick={props.step === 'sent' ? props.onDone : () => void onContinue()} disabled={props.step === 'sent' ? false : continueDisabled} className="btn-primary press mt-3">
            {continueLabel}
          </button>
        </footer>
      ) : null}
    </div>
  )
}

function AddressStep({
  recipient,
  attested,
  destination,
  changedFrom,
  tried,
  onRecipient,
  onAttest,
}: {
  recipient: string
  attested: boolean
  destination: string | null
  changedFrom: string | null
  tried: boolean
  onRecipient: (value: string) => void
  onAttest: (value: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor="sofi-address" className="text-sm font-semibold text-ink">
            Ethereum address
          </label>
          <p className="mt-1 text-sm leading-relaxed text-muted">In SoFi: Crypto, Transfer, Receive, USDC. The network must say Ethereum.</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              onRecipient((await navigator.clipboard.readText()).trim())
            } catch {
              onRecipient(recipient)
            }
          }}
          className="press h-11 shrink-0 px-1 text-sm font-semibold text-accent"
        >
          Paste
        </button>
      </div>
      <textarea
        id="sofi-address"
        value={recipient}
        onChange={(event) => onRecipient(event.target.value)}
        placeholder="0x"
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        rows={2}
        className="w-full resize-none rounded-control border border-line bg-card px-4 py-3 font-mono text-sm leading-relaxed break-all text-ink outline-none placeholder:text-faint"
      />
      <div className="flex h-12 items-center justify-between rounded-control border border-line px-4">
        <span className="text-sm text-muted">Network</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Lock className="size-3.5" aria-hidden="true" />
          Ethereum
        </span>
      </div>
      {changedFrom ? <NewAddressNote last={changedFrom} /> : null}
      <button
        type="button"
        role="checkbox"
        aria-checked={attested}
        onClick={() => onAttest(!attested)}
        className="press flex min-h-14 items-start gap-3 rounded-control border border-line px-4 py-3 text-left"
      >
        <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${attested ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card text-transparent'}`} aria-hidden="true">
          <Check className="size-3.5" />
        </span>
        <span className="text-sm leading-relaxed text-ink">This is the Ethereum address SoFi shows for my USDC deposit.</span>
      </button>
      <p className="min-h-5 text-sm text-bad" role="alert">
        {destination && recipient.trim() ? destination : tried && !attested ? 'Confirm the SoFi network is Ethereum.' : ''}
      </p>
    </div>
  )
}

function NewAddressNote({ last }: { last: string }) {
  return (
    <p className="text-sm leading-relaxed text-bad">
      This is not the address your last SoFi deposit went to (<span className="font-mono">{shortAddress(last)}</span>).
      Check it against SoFi before you send.
    </p>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  )
}
