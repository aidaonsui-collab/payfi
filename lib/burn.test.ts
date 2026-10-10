import assert from 'node:assert/strict'
import test from 'node:test'
import { Transaction } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import { fromBase64 } from '@mysten/sui/utils'
import { buildSuiBurn, ethereumAsSuiAddress } from './burn'
import { CCTP, DESTINATIONS, FORWARD_HOOK } from './chains'

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
    domain: 0,
  })
  const raw = JSON.stringify(tx.getData())
  assert.match(raw, /"module":"coin","function":"redeem_funds"/)
  assert.match(raw, new RegExp(`"package":"${CCTP.tmmPackage}","module":"deposit_for_burn","function":"deposit_for_burn"`))
  assert.match(raw, new RegExp(`"package":"${CCTP.handlerPackage}","module":"handler","function":"burn"`))
  assert.match(raw, new RegExp(`"package":"${CCTP.tmmPackage}","module":"deposit_for_burn","function":"complete_burn"`))
  assert.match(raw, /AAAAAAAAAAAAAAAAERERERERERERERERERERERERERE=/)
})

/** The destination domain `deposit_for_burn` is called with. */
function burnDomain(tx: Transaction): number {
  const data = tx.getData()
  const call = data.commands.find((command) => command.MoveCall?.function === 'deposit_for_burn')?.MoveCall
  const arg = call?.arguments[1]
  const input = arg && 'Input' in arg ? data.inputs[arg.Input] : undefined
  if (!input?.Pure) throw new Error('deposit_for_burn has no pure domain argument')
  return bcs.u32().parse(fromBase64(input.Pure.bytes))
}

test('the burn mints on Ethereum for SoFi and on Arbitrum for Cash App', () => {
  for (const [id, domain] of [['sofi', 0], ['cashapp', 3]] as const) {
    const tx = new Transaction()
    buildSuiBurn(tx, {
      burnUnits: 2_000_000n,
      feeUnits: 10_000n,
      recipient: '0xf8d8000000000000000000000000000000005bcf',
      domain: DESTINATIONS[id].domain,
    })
    assert.equal(burnDomain(tx), domain, id)
  }
})
