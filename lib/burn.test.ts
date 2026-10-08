import assert from 'node:assert/strict'
import test from 'node:test'
import { Transaction } from '@mysten/sui/transactions'
import { buildSuiBurn, ethereumAsSuiAddress } from './burn'
import { CCTP, FORWARD_HOOK } from './chains'

test('an Ethereum SoFi address becomes a 32-byte Sui address', () => {
  const evm = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  assert.equal(
    ethereumAsSuiAddress(evm),
    '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  )
  assert.throws(() => ethereumAsSuiAddress('0x1234'), /Ethereum address/)
})

test('the forwarding hook is the 32-byte version-0 cctp-forward frame', () => {
  assert.equal(FORWARD_HOOK.length, 32)
  assert.equal(Buffer.from(FORWARD_HOOK.subarray(0, 12)).toString('utf8'), 'cctp-forward')
  assert.equal(FORWARD_HOOK[12], 0)
})

test('the burn transaction calls redeem, deposit_for_burn, handler burn, and complete_burn', () => {
  const tx = new Transaction()
  buildSuiBurn(tx, {
    burnUnits: 2_000_000n,
    feeUnits: 1_461_016n,
    recipient: '0x1111111111111111111111111111111111111111',
  })
  const raw = JSON.stringify(tx.getData())
  assert.match(raw, /"module":"coin","function":"redeem_funds"/)
  assert.match(raw, new RegExp(`"package":"${CCTP.tmmPackage}","module":"deposit_for_burn","function":"deposit_for_burn"`))
  assert.match(raw, new RegExp(`"package":"${CCTP.handlerPackage}","module":"handler","function":"burn"`))
  assert.match(raw, new RegExp(`"package":"${CCTP.tmmPackage}","module":"deposit_for_burn","function":"complete_burn"`))
  assert.match(raw, /AAAAAAAAAAAAAAAAERERERERERERERERERERERERERE=/)
})
