import assert from 'node:assert/strict'
import test from 'node:test'
import { getWallets, SUI_MAINNET_CHAIN, type Wallet } from '@mysten/wallet-standard'
import { Transaction } from '@mysten/sui/transactions'
import { connectSui, executeSuiBurn, forgetSuiWallet } from './wallet'

const address = `0x${'ab'.repeat(32)}`

function fakeWallet(name: string, signed: string[]): Wallet {
  const account = { address, publicKey: new Uint8Array(), chains: [SUI_MAINNET_CHAIN], features: [] }
  return {
    version: '1.0.0',
    name,
    icon: 'data:image/svg+xml;base64,',
    chains: [SUI_MAINNET_CHAIN],
    accounts: [account],
    features: {
      'standard:connect': { version: '1.0.0', connect: async () => ({ accounts: [account] }) },
      'sui:signAndExecuteTransaction': {
        version: '2.0.0',
        signAndExecuteTransaction: async () => {
          signed.push(name)
          return { digest: `${name}-digest`, effects: 'AA==', bytes: '', signature: '' }
        },
      },
    },
  } as unknown as Wallet
}

test('only the wallet the user connected signs the burn', async () => {
  const signed: string[] = []
  // Registered first and listing the same public address, like a rogue extension.
  getWallets().register(fakeWallet('Impostor', signed), fakeWallet('Slush', signed))

  await assert.rejects(executeSuiBurn(address, new Transaction()), /Connect a Sui wallet/)

  assert.equal(await connectSui('Slush'), address)
  const result = await executeSuiBurn(address, new Transaction())
  assert.equal(result.digest, 'Slush-digest')
  assert.deepEqual(signed, ['Slush'])

  forgetSuiWallet()
  await assert.rejects(executeSuiBurn(address, new Transaction()), /Connect a Sui wallet/)
  assert.deepEqual(signed, ['Slush'])
})
