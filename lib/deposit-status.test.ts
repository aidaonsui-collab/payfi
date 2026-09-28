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

test('a failed Circle forward is reported, and a confirmed one wins', () => {
  assert.equal(depositStatusFromIris({ messages: [{ forwardState: 'FAILED' }] }), 'failed')
  assert.equal(
    depositStatusFromIris({
      messages: [{ forwardState: 'FAILED' }, { forwardState: 'COMPLETE', forwardTxHash: '0xabc' }],
    }),
    'deposited',
  )
})
