import assert from 'node:assert/strict'
import test from 'node:test'
import { suiBalanceFromGraphQL } from './sui-balance'

test('address balance is the spendable USDC amount', () => {
  const parsed = suiBalanceFromGraphQL({
    data: { address: { balance: { addressBalance: '2500000', coinBalance: '0' } } },
  })
  assert.deepEqual(parsed, { balance: '2.5', coins: '0' })
  assert.equal(suiBalanceFromGraphQL({ data: {} }), null)
})
