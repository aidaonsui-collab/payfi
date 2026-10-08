import assert from 'node:assert/strict'
import test from 'node:test'
import { suinsNameFromGraphQL } from './suins-name'

test('a default SuiNS name replaces the address', () => {
  const parsed = suinsNameFromGraphQL({
    data: { address: { defaultNameRecord: { domain: 'Alice.SUI' } } },
  })
  assert.deepEqual(parsed, { name: 'alice.sui' })
})

test('a missing default name stays an address', () => {
  assert.deepEqual(suinsNameFromGraphQL({ data: { address: { defaultNameRecord: null } } }), { name: null })
})

test('a subname is kept and a bad label is dropped', () => {
  assert.equal(
    suinsNameFromGraphQL({ data: { address: { defaultNameRecord: { domain: 'ada.sui-stack.sui' } } } })?.name,
    'ada.sui-stack.sui',
  )
  assert.equal(suinsNameFromGraphQL({ data: { address: { defaultNameRecord: { domain: '-nope.sui' } } } })?.name, null)
})
