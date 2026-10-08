import assert from 'node:assert/strict'
import test from 'node:test'
import { addressGroups } from './format'

test('splits a whole address into groups of four', () => {
  assert.deepEqual(addressGroups(' 0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9 '), [
    '0x26bD',
    '4915',
    '60b5',
    '175e',
    'e8bD',
    '1DA4',
    '998F',
    'e260',
    'FfC4',
    '13c9',
  ])
  assert.deepEqual(addressGroups('not-an-address'), ['not-an-address'])
})
