import assert from 'node:assert/strict'
import test from 'node:test'
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
  assert.equal(depositLabel('deposited'), 'Deposited to SoFi')
  assert.equal(depositLabel('pending'), 'Pending deposit to SoFi')
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
  assert.equal(depositLabel('failed'), 'Delivery to SoFi failed')
})

test('the last deposit address comes from the newest deposited move', () => {
  const sofi = '0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9'
  const other = '0x1111111111111111111111111111111111111111'
  const receipts: Receipt[] = [
    { id: '3', amount: '1', fee: null, recipient: other, at: 3, status: 'pending', links: [] },
    { id: '2', amount: '1', fee: null, recipient: sofi, at: 2, status: 'deposited', links: [] },
    { id: '1', amount: '1', fee: null, recipient: other, at: 1, status: 'deposited', links: [] },
  ]
  assert.equal(lastDepositAddress(receipts), sofi)
  assert.equal(lastDepositAddress([]), null)
})
