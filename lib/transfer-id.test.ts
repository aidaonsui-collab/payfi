import assert from 'node:assert/strict'
import test from 'node:test'
import { irisDomain } from './transfer-id'

test('Sui digests settle on domain 8 and older Arc hashes stay on domain 26', () => {
  assert.equal(irisDomain('HHds4Hij6EP6ticCxz9srYF8ZFQQ4DRkXeqZNjPH6xXj'), 8)
  assert.equal(irisDomain(`0x${'ab'.repeat(32)}`), 26)
  assert.equal(irisDomain('0x1234'), null)
  assert.equal(irisDomain('not-a-digest'), null)
})
