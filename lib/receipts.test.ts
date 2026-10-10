import assert from 'node:assert/strict'
import test from 'node:test'
import { DESTINATIONS } from './chains'
import { depositLabel, lastDepositAddress, normalizeReceipt, type Receipt } from './receipts'

test('older receipts that already finished count as deposited', () => {
  const receipt = normalizeReceipt({
    id: '0xabc',
    amount: '10',
    fee: '1.8',
    recipient: '0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9',
    at: 1,
    links: [{ name: 'mint', url: 'https://etherscan.io/tx/0x1' }],
  })
  assert.equal(receipt?.status, 'deposited')
  assert.equal(depositLabel('deposited', DESTINATIONS.sofi), 'Deposited to SoFi')
  assert.equal(depositLabel('pending', DESTINATIONS.cashapp), 'Pending deposit to Cash App')
})

test('a receipt without a finished transfer stays pending', () => {
  const receipt = normalizeReceipt({
    id: '0xdef',
    amount: '10',
    fee: null,
    recipient: '0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9',
    at: 1,
    status: 'pending',
    links: [],
  })
  assert.equal(receipt?.status, 'pending')
  assert.equal(normalizeReceipt({ amount: '10' }), null)
})

test('a failed delivery stays failed after a reload', () => {
  const receipt = normalizeReceipt({ id: '0x1', amount: '10', status: 'failed', links: [] })
  assert.equal(receipt?.status, 'failed')
  assert.equal(depositLabel('failed', DESTINATIONS.cashapp), 'Delivery to Cash App failed')
})

test('receipts from before Cash App count as SoFi, and a destination survives a reload', () => {
  assert.equal(normalizeReceipt({ id: '0x1', amount: '10' })?.destination, 'sofi')
  assert.equal(normalizeReceipt({ id: '0x1', amount: '10', destination: 'cashapp' })?.destination, 'cashapp')
  assert.equal(normalizeReceipt({ id: '0x1', amount: '10', destination: 'venmo' })?.destination, 'sofi')
})

test('the last deposit address is per app, from its newest deposited move', () => {
  const sofi = '0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9'
  const cash = '0xf8d8000000000000000000000000000000005bcf'
  const other = '0x1111111111111111111111111111111111111111'
  const row = (id: string, recipient: string, destination: Receipt['destination'], status: Receipt['status']): Receipt => ({
    id,
    amount: '1',
    fee: null,
    recipient,
    destination,
    at: Number(id),
    status,
    links: [],
  })
  const receipts = [
    row('4', cash, 'cashapp', 'deposited'),
    row('3', other, 'sofi', 'pending'),
    row('2', sofi, 'sofi', 'deposited'),
    row('1', other, 'sofi', 'deposited'),
  ]
  assert.equal(lastDepositAddress(receipts, 'sofi'), sofi)
  assert.equal(lastDepositAddress(receipts, 'cashapp'), cash)
  assert.equal(lastDepositAddress([], 'sofi'), null)
})
