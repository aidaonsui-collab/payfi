'use client'

import { useState } from 'react'
import type { Address } from 'viem'
import { arcUsdcBalance, connectArc, injectedProvider } from '@/lib/wallet'
import { sendArcUsdcToSofi, type SendStep } from '@/lib/send'
import { amountError, sofiAddressError } from '@/lib/validate'

export function SendForm() {
  const [account, setAccount] = useState<Address | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [steps, setSteps] = useState<SendStep[]>([])

  async function onConnect() {
    setError('')
    const provider = injectedProvider()
    if (!provider) {
      setError('Open ArcFi in a browser with a wallet extension.')
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

  async function onSend() {
    setError('')
    setSteps([])
    const addressProblem = sofiAddressError(recipient)
    const amountProblem = amountError(amount)
    if (addressProblem || amountProblem) {
      setError(addressProblem || amountProblem || '')
      return
    }
    const provider = injectedProvider()
    if (!account || !provider) {
      setError('Connect an Arc wallet first.')
      return
    }
    setBusy(true)
    setStatus('Waiting for the wallet signature. Circle will mint on Ethereum.')
    try {
      const result = await sendArcUsdcToSofi({ provider, recipient, amount })
      setSteps(result.steps)
      setStatus(
        result.state === 'success'
          ? `Sent. SoFi should receive ${result.received} USDC on Ethereum.`
          : `The bridge ended in ${result.state}. Check the steps below.`,
      )
      setBalance(await arcUsdcBalance(account))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The send failed.')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <div className="row">
        <div>
          <div className="kicker">WALLET</div>
          <p style={{ margin: '6px 0 0' }}>
            {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Not connected'}
            {balance != null ? ` · ${balance} USDC` : ''}
          </p>
        </div>
        <button className="ghost" type="button" onClick={onConnect} disabled={busy}>
          {account ? 'Refresh' : 'Connect Arc'}
        </button>
      </div>
      <label htmlFor="sofi">SoFi Ethereum USDC address</label>
      <input
        id="sofi"
        value={recipient}
        onChange={(event) => setRecipient(event.target.value)}
        placeholder="0x…"
        spellCheck={false}
        autoComplete="off"
      />
      <label htmlFor="amount">Amount in USDC</label>
      <input
        id="amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        inputMode="decimal"
        placeholder="25.00"
      />
      <p style={{ marginTop: 10, fontSize: 13 }}>
        SoFi receives this amount. The Arc wallet also pays Circle’s bridge fee and Arc gas.
        A wrong address cannot be reversed.
      </p>
      <button className="primary" type="button" onClick={onSend} disabled={busy}>
        {busy ? 'Sending…' : 'Send to SoFi'}
      </button>
      {status ? <p className="ok">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {steps.length > 0 ? (
        <ul>
          {steps.map((step) => (
            <li key={`${step.name}-${step.txHash ?? step.state}`}>
              {step.name}: {step.state}
              {step.explorerUrl ? (
                <>
                  {' '}
                  <a href={step.explorerUrl} target="_blank" rel="noreferrer">
                    view
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
