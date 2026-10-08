import { Transaction } from '@mysten/sui/transactions'
import { CCTP, ETHEREUM_CCTP_DOMAIN, FORWARD_HOOK, SUI_USDC_TYPE } from './chains'

/** Left-pad an Ethereum address into the 32-byte address CCTP expects on Sui. */
export function ethereumAsSuiAddress(evm: string): string {
  const hex = evm.trim().toLowerCase().replace(/^0x/, '')
  if (!/^[0-9a-f]{40}$/.test(hex)) throw new Error('That is not an Ethereum address.')
  return `0x${hex.padStart(64, '0')}`
}

/**
 * Burn native Sui USDC and attach Circle's forwarding hook.
 * Destination caller stays the zero address. Circle's forwarder rejects a
 * hook whose receive is locked to another caller, then mints on Ethereum.
 */
export function buildSuiBurn(
  tx: Transaction,
  opts: { burnUnits: bigint; feeUnits: bigint; recipient: string },
) {
  const usdc = SUI_USDC_TYPE
  const [coin] = tx.moveCall({
    target: '0x2::coin::redeem_funds',
    typeArguments: [usdc],
    arguments: [tx.withdrawal({ amount: opts.burnUnits, type: usdc })],
  })

  const [burnReceipt, returnedCoin] = tx.moveCall({
    target: `${CCTP.tmmPackage}::deposit_for_burn::deposit_for_burn`,
    typeArguments: [usdc],
    arguments: [
      coin,
      tx.pure.u32(ETHEREUM_CCTP_DOMAIN),
      tx.pure.address(ethereumAsSuiAddress(opts.recipient)),
      tx.pure.address('0x0000000000000000000000000000000000000000000000000000000000000000'),
      tx.pure.u256(opts.feeUnits),
      tx.pure.u32(CCTP.finality),
      tx.pure.vector('u8', Array.from(FORWARD_HOOK)),
      tx.object(CCTP.tmmState),
    ],
  })

  const [ticket] = tx.moveCall({
    target: `${CCTP.handlerPackage}::handler::burn`,
    arguments: [
      tx.object(CCTP.handlerState),
      burnReceipt,
      returnedCoin,
      tx.object(CCTP.denyList),
      tx.object(CCTP.treasury),
    ],
  })

  tx.moveCall({
    target: `${CCTP.tmmPackage}::deposit_for_burn::complete_burn`,
    typeArguments: [usdc, `${CCTP.handlerPackage}::handler::Auth`],
    arguments: [ticket, tx.object(CCTP.tmmState), tx.object(CCTP.mtState)],
  })
}
