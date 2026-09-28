import assert from 'node:assert/strict'
import test from 'node:test'
import { amountError, sofiAddressError } from './validate'

test('rejects a missing or token-contract SoFi address', () => {
  assert.match(sofiAddressError(''), /Paste/)
  assert.match(sofiAddressError('not-an-address'), /not an Ethereum/)
  assert.match(sofiAddressError('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), /token contract/)
  assert.match(sofiAddressError('0x3600000000000000000000000000000000000000'), /token contract/)
  assert.equal(sofiAddressError('0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9'), null)
})

test('rejects empty, tiny, and oversized amounts', () => {
  assert.ok(amountError(''))
  assert.ok(amountError('0'))
  assert.ok(amountError('1.1234567'))
  assert.ok(amountError('25001'))
  assert.equal(amountError('25.5'), null)
})
