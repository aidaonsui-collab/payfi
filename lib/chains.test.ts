import assert from 'node:assert/strict'
import test from 'node:test'
import { DESTINATIONS, irisForwardFeeUrl, isDestinationId } from './chains'

test('SoFi mints on Ethereum and Cash App on Arbitrum', () => {
  assert.equal(DESTINATIONS.sofi.network, 'Ethereum')
  assert.equal(DESTINATIONS.sofi.domain, 0)
  assert.equal(DESTINATIONS.cashapp.network, 'Arbitrum')
  assert.equal(DESTINATIONS.cashapp.domain, 3)
})

test('the forwarding fee is quoted from Sui to the destination domain', () => {
  assert.equal(irisForwardFeeUrl(0), 'https://iris-api.circle.com/v2/burn/USDC/fees/8/0?forward=true')
  assert.equal(irisForwardFeeUrl(3), 'https://iris-api.circle.com/v2/burn/USDC/fees/8/3?forward=true')
})

test('only known destinations are accepted, not object keys', () => {
  assert.ok(isDestinationId('sofi'))
  assert.ok(isDestinationId('cashapp'))
  assert.ok(!isDestinationId('venmo'))
  assert.ok(!isDestinationId('toString'))
  assert.ok(!isDestinationId('__proto__'))
  assert.ok(!isDestinationId(null))
})
