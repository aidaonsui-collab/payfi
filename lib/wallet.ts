import {
  getWallets,
  signAndExecuteTransaction,
  SUI_MAINNET_CHAIN,
  type Wallet,
  type WalletAccount,
} from '@mysten/wallet-standard'
import type { Transaction } from '@mysten/sui/transactions'

type ConnectFeature = {
  connect: () => Promise<{ accounts: readonly WalletAccount[] }>
}

function canSend(wallet: Wallet): boolean {
  return (
    'sui:signAndExecuteTransaction' in wallet.features ||
    'sui:signAndExecuteTransactionBlock' in wallet.features
  )
}

function connectFeature(wallet: Wallet): ConnectFeature | null {
  const feature = wallet.features['standard:connect'] as { connect?: ConnectFeature['connect'] } | undefined
  if (!feature?.connect) return null
  return { connect: feature.connect }
}

function suiWallets(): Wallet[] {
  return getWallets()
    .get()
    .filter((wallet) => canSend(wallet) && connectFeature(wallet))
}

function rank(wallet: Wallet): number {
  const onMainnet = wallet.accounts.some((account) => account.chains.includes(SUI_MAINNET_CHAIN))
  const preferred = /slush|sui/i.test(wallet.name) ? 1 : 0
  return (onMainnet ? 2 : 0) + preferred
}

export async function connectSui(): Promise<string> {
  const wallets = suiWallets().sort((a, b) => rank(b) - rank(a))
  const wallet = wallets[0]
  if (!wallet) throw new Error('Open PayFi in a browser with a Sui wallet.')
  const connect = connectFeature(wallet)
  if (!connect) throw new Error('Open PayFi in a browser with a Sui wallet.')
  const result = await connect.connect()
  const account = result.accounts.find((item) => item.chains.includes(SUI_MAINNET_CHAIN))
  if (!account) throw new Error('Switch the wallet to Sui mainnet before sending.')
  return account.address
}

export async function executeSuiBurn(address: string, transaction: Transaction): Promise<{ digest: string; effects: string }> {
  const wallets = suiWallets()
  for (const wallet of wallets) {
    const account = wallet.accounts.find(
      (item) => item.address === address && item.chains.includes(SUI_MAINNET_CHAIN),
    )
    if (!account) continue
    const result = await signAndExecuteTransaction(wallet, {
      transaction,
      account,
      chain: SUI_MAINNET_CHAIN,
    })
    if (!result.digest || !result.effects) throw new Error('The wallet did not return the Sui burn.')
    return { digest: result.digest, effects: result.effects }
  }
  throw new Error('Connect a Sui wallet on mainnet first.')
}

export async function suiUsdcBalance(address: string): Promise<{ balance: string; coins: string }> {
  const response = await fetch(`/api/balance?address=${encodeURIComponent(address)}`)
  const data = (await response.json()) as { balance?: unknown; coins?: unknown; error?: unknown }
  if (!response.ok || typeof data.balance !== 'string') {
    throw new Error(typeof data.error === 'string' ? data.error : 'Sui did not return a USDC balance.')
  }
  return { balance: data.balance, coins: typeof data.coins === 'string' ? data.coins : '0' }
}
