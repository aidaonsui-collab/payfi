import assert from 'node:assert/strict'
import test from 'node:test'
import { sentBurnTxHash } from './send'

const hash = `0x${'ab'.repeat(32)}`

test('a burn that failed on-chain is not recorded as sent', () => {
  for (const errorCategory of ['chain_revert', 'reverted_onchain', 'partial_reverted', 'failed_offchain']) {
    const steps = [
      { name: 'approve', state: 'success', txHash: `0x${'cd'.repeat(32)}` },
      { name: 'burn', state: 'error', txHash: hash, errorCategory },
    ]
    assert.equal(sentBurnTxHash(steps), null, errorCategory)
  }
})

test('a burn that went out, or may still land, keeps its hash', () => {
  assert.equal(sentBurnTxHash([{ name: 'burn', state: 'success', txHash: hash }]), hash)
  assert.equal(sentBurnTxHash([{ name: 'burn', state: 'error', txHash: hash, errorCategory: 'unknown' }]), hash)
  assert.equal(sentBurnTxHash([{ name: 'approve', state: 'error' }]), null)
})
