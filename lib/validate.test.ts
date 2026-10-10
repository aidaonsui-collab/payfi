import assert from 'node:assert/strict'
import test from 'node:test'
import { ARBITRUM_USDC, ARC_USDC, DESTINATIONS, ETHEREUM_USDC } from './chains'
import { amountError, recipientAddressError } from './validate'

const { sofi, cashapp } = DESTINATIONS

test('a missing or bad address is named for the app and its network', () => {
  assert.equal(recipientAddressError('', sofi), 'Paste the Ethereum address from SoFi.')
  assert.equal(recipientAddressError('', cashapp), 'Paste the Arbitrum address from Cash App.')
  assert.equal(recipientAddressError('not-an-address', sofi), 'That is not an Ethereum address.')
  assert.equal(recipientAddressError('not-an-address', cashapp), 'That is not an Arbitrum address.')
})

test('every USDC token contract is refused for either app', () => {
  for (const token of [ETHEREUM_USDC, ARBITRUM_USDC, ARC_USDC]) {
    assert.match(recipientAddressError(token, sofi) ?? '', /token contract/)
    assert.match(recipientAddressError(token.toLowerCase(), cashapp) ?? '', /token contract.*Cash App/)
  }
  assert.equal(recipientAddressError('0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9', sofi), null)
  assert.equal(recipientAddressError('0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9', cashapp), null)
})

test('rejects empty, tiny, and oversized amounts', () => {
  assert.ok(amountError(''))
  assert.ok(amountError('0'))
  assert.ok(amountError('1.1234567'))
  assert.ok(amountError('25001'))
  assert.equal(amountError('25.5'), null)
})
