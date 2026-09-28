import assert from 'node:assert/strict'
import test from 'node:test'
import { addUsdc } from './format'
import { forwardFeeFromTiers } from './forward-fee'

test('adds USDC amounts in 6-decimal units', () => {
  assert.equal(addUsdc('10', '1.840353'), '11.840353')
  assert.equal(addUsdc('10.5', '0.5'), '11')
  assert.equal(addUsdc('0', '1'), '1')
})

test('reads the standard-transfer forwarding cap', () => {
  const tiers = [
    { finalityThreshold: 1000, minimumFee: 0, forwardFee: { low: 1, med: 2, high: 9 } },
    { finalityThreshold: 2000, minimumFee: 0, forwardFee: { low: 1170769, med: 1505561, high: 1840353 } },
  ]
  assert.equal(forwardFeeFromTiers(tiers), '1.840353')
  assert.equal(forwardFeeFromTiers([]), null)
  assert.equal(forwardFeeFromTiers([{ finalityThreshold: 2000, forwardFee: { high: 0 } }]), null)
})
