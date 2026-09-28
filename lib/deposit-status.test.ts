import assert from 'node:assert/strict'
import test from 'node:test'
import { depositStatusFromIris } from './deposit-status'

test('a confirmed Circle forward counts as deposited', () => {
  assert.equal(
    depositStatusFromIris({ messages: [{ forwardState: 'CONFIRMED', forwardTxHash: '0xabc' }] }),
    'deposited',
  )
  assert.equal(depositStatusFromIris({ messages: [{ forwardState: 'PENDING' }] }), 'pending')
  assert.equal(depositStatusFromIris({}), 'pending')
})
