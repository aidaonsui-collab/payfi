import { createPublicClient, formatUnits, http, type Address } from 'viem'
import { arc } from 'viem/chains'
import { ARC_ADD_CHAIN, ARC_CHAIN_ID, ARC_RPC, ARC_USDC } from './chains'

const erc20Balance = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const

export type InjectedProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
}

export function injectedProvider(): InjectedProvider | null {
  if (typeof window === 'undefined') return null
  const eth = (window as Window & { ethereum?: InjectedProvider }).ethereum
  return eth ?? null
}

export async function connectArc(provider: InjectedProvider): Promise<Address> {
  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[]
  const account = accounts[0]
  if (!account) throw new Error('The wallet did not return an account.')
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_ADD_CHAIN.chainId }],
    })
  } catch (error) {
    const code = (error as { code?: number }).code
    if (code !== 4902) throw error
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [ARC_ADD_CHAIN],
    })
  }
  const chainId = Number(await provider.request({ method: 'eth_chainId' }))
  if (chainId !== ARC_CHAIN_ID) throw new Error('Switch the wallet to Arc before sending.')
  return account as Address
}

export async function arcUsdcBalance(account: Address): Promise<string> {
  const client = createPublicClient({ chain: arc, transport: http(ARC_RPC) })
  const raw = await client.readContract({
    address: ARC_USDC,
    abi: erc20Balance,
    functionName: 'balanceOf',
    args: [account],
  })
  return formatUnits(raw, 6)
}
