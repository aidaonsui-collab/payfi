'use client'

import { useEffect, useState } from 'react'
import { ArrowLeftRight, BookOpen, Clock, House, Moon, Sun } from 'lucide-react'
import { Mark } from '@/components/Mark'
import { MoveView, type Step } from '@/components/MoveView'
import { ActivityView, GuideView, HomeView } from '@/components/PayViews'
import { Sheet } from '@/components/Sheet'
import { shortAddress } from '@/lib/format'
import { loadReceipts, saveReceipts, type Receipt } from '@/lib/receipts'
import { irisDomain } from '@/lib/transfer-id'
import { connectSui, listSuiWallets, suiUsdcBalance, watchSuiWallets, type SuiWalletChoice } from '@/lib/wallet'

type View = 'home' | 'move' | 'activity' | 'guide'

const NAV: { id: View; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'move', label: 'Move', icon: ArrowLeftRight },
  { id: 'activity', label: 'Activity', icon: Clock },
  { id: 'guide', label: 'Guide', icon: BookOpen },
]

export function PayApp() {
  const [view, setView] = useState<View>('home')
  const [step, setStep] = useState<Step>('amount')
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [coins, setCoins] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [attested, setAttested] = useState(false)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [choices, setChoices] = useState<SuiWalletChoice[]>([])
  const [accountOpen, setAccountOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [dark, setDark] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setReceipts(loadReceipts())
    setHidden(window.localStorage.getItem('payfi.hideBalance') === '1')
    const next = window.localStorage.getItem('payfi.theme') === 'dark'
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }, [])

  const pendingIds = receipts
    .filter((item) => item.status === 'pending' && irisDomain(item.id) != null)
    .map((item) => item.id)
    .join(',')

  useEffect(() => {
    const ids = pendingIds.split(',').filter(Boolean)
    if (ids.length === 0) return
    let cancelled = false
    async function look() {
      for (const id of ids) {
        try {
          const response = await fetch(`/api/deposit?tx=${id}`)
          const data = (await response.json()) as { status?: string }
          if (cancelled || data.status !== 'deposited') continue
          setReceipts((current) => {
            const next = current.map((item) => (item.id === id ? { ...item, status: 'deposited' as const } : item))
            saveReceipts(next)
            return next
          })
        } catch {
          // Keep the row pending until Circle reports the deposit.
        }
      }
    }
    void look()
    const timer = window.setInterval(() => void look(), 10_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [pendingIds])

  useEffect(() => {
    if (!chooserOpen) return
    setChoices(listSuiWallets())
    return watchSuiWallets(() => setChoices(listSuiWallets()))
  }, [chooserOpen])

  function openMove() {
    setError('')
    setStep('amount')
    setView('move')
  }

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('payfi.theme', next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  function toggleHidden() {
    setHidden((current) => {
      const next = !current
      window.localStorage.setItem('payfi.hideBalance', next ? '1' : '0')
      return next
    })
  }

  function sendAgain(address: string) {
    setRecipient(address)
    setAttested(false)
    setError('')
    setStep('address')
    setView('move')
  }

  async function connect(name: string) {
    setChooserOpen(false)
    setError('')
    setBusy(true)
    try {
      const address = await connectSui(name)
      const next = await suiUsdcBalance(address)
      setAccount(address)
      setBalance(next.balance)
      setCoins(next.coins)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect.')
    } finally {
      setBusy(false)
    }
  }

  function disconnect() {
    setAccount(null)
    setBalance(null)
    setCoins(null)
    setAccountOpen(false)
    setError('')
  }

  function remember(receipt: Receipt) {
    setReceipts((current) => {
      const next = [receipt, ...current.filter((item) => item.id !== receipt.id)]
      saveReceipts(next)
      return next
    })
    setStep('sent')
    setBusy(false)
    if (account) {
      suiUsdcBalance(account)
        .then((next) => {
          setBalance(next.balance)
          setCoins(next.coins)
        })
        .catch(() => undefined)
    }
  }

  const coinNote = Boolean(account && balance === '0' && coins && coins !== '0')

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-nav px-3 text-nav-ink md:h-16 md:gap-4 md:px-6">
        <button type="button" onClick={() => setView('home')} className="press flex items-center gap-2 px-1" aria-label="PayFi">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white">
            <Mark className="h-6 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight" aria-hidden="true">
            Pay
            <span className="fi-race">
              Fi
              <svg viewBox="0 0 22 16" className="fi-streaks" aria-hidden="true">
                <path d="M1 3.5h12" />
                <path d="M1 8h15" />
                <path d="M1 12.5h9" />
              </svg>
            </span>
          </span>
        </button>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (item.id === 'move' ? openMove() : setView(item.id))}
                className={`press h-9 rounded-full px-3 text-sm font-medium ${active ? 'bg-nav-ink/15' : 'text-nav-ink/80 hover:bg-nav-ink/10 hover:text-nav-ink'}`}
              >
                {item.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => (account ? setAccountOpen(true) : setChooserOpen(true))}
            className="press h-9 rounded-full px-3 text-sm font-medium text-nav-ink/80 hover:bg-nav-ink/10 hover:text-nav-ink"
          >
            Wallet
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="press flex size-10 items-center justify-center rounded-full hover:bg-nav-ink/10"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          {account ? (
            <button type="button" onClick={() => setAccountOpen(true)} className="press h-9 rounded-full px-3 text-xs font-semibold tracking-wide uppercase hover:bg-nav-ink/10">
              {shortAddress(account)}
            </button>
          ) : (
            <button type="button" onClick={() => setChooserOpen(true)} disabled={busy} className="press h-9 rounded-full px-3 text-xs font-semibold tracking-wide uppercase hover:bg-nav-ink/10 disabled:opacity-40">
              Connect
            </button>
          )}
        </div>
      </header>

      {view === 'move' ? (
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-card">
          <MoveView
            account={account}
            balance={balance}
            amount={amount}
            recipient={recipient}
            attested={attested}
            step={step}
            busy={busy}
            error={error}
            onAmount={setAmount}
            onRecipient={setRecipient}
            onAttested={setAttested}
            onStep={setStep}
            onHome={() => setView('home')}
            onConnect={() => setChooserOpen(true)}
            onSent={remember}
            onError={setError}
            onBusy={setBusy}
            onDone={() => {
              setView('activity')
              setStep('amount')
              setAmount('')
              setError('')
            }}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl">
            {view === 'home' ? (
              <HomeView
                balance={balance}
                account={account}
                hidden={hidden}
                receipts={receipts}
                error={error}
                coinNote={coinNote}
                onToggleHidden={toggleHidden}
                onConnect={() => setChooserOpen(true)}
                onMove={openMove}
                onActivity={() => setView('activity')}
                onGuide={() => setView('guide')}
                onSendAgain={sendAgain}
              />
            ) : null}
            {view === 'activity' ? <ActivityView receipts={receipts} onMove={openMove} /> : null}
            {view === 'guide' ? <GuideView onMove={openMove} /> : null}
          </div>
        </div>
      )}

      <nav className="safe-b z-30 grid shrink-0 grid-cols-4 border-t border-line bg-card lg:hidden" aria-label="Primary">
        {NAV.map((item) => {
          const active = view === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.id === 'move' ? openMove() : setView(item.id))}
              className={`press flex h-14 flex-col items-center justify-center gap-1 text-xs font-medium ${active ? 'text-accent' : 'text-faint'}`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {chooserOpen ? (
        <Sheet title="Choose a wallet" onClose={() => setChooserOpen(false)}>
          {choices.length === 0 ? (
            <p className="pb-6 text-sm leading-relaxed text-muted">No Sui wallet in this browser. Open PayFi where Slush, Sui Wallet, or another Sui wallet is installed.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {choices.map((wallet) => (
                <li key={wallet.name}>
                  <button type="button" disabled={busy} onClick={() => void connect(wallet.name)} className="press flex h-14 w-full items-center gap-3 rounded-control border border-line px-3 text-left disabled:opacity-40">
                    <img src={wallet.icon} alt="" className="size-8 rounded-lg" />
                    <span className="text-sm font-semibold text-ink">{wallet.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      ) : null}

      {accountOpen && account ? (
        <Sheet title="Wallet" onClose={() => setAccountOpen(false)}>
          <p className="font-mono text-sm leading-relaxed break-all text-ink">{account}</p>
          <p className="mt-2 text-sm text-muted">Sui mainnet · USDC address balance</p>
          <div className="mt-4 mb-3 flex gap-2">
            <button
              type="button"
              className="press h-11 flex-1 rounded-full bg-fill text-sm font-semibold text-ink"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(account)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1500)
                } catch {
                  setCopied(false)
                }
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="press h-11 flex-1 rounded-full bg-fill text-sm font-semibold text-ink" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        </Sheet>
      ) : null}
    </div>
  )
}
