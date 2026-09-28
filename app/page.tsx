import { SendForm } from '@/components/SendForm'

export default function HomePage() {
  return (
    <main>
      <div className="kicker">ARC → ETHEREUM USDC</div>
      <h1>ArcFi</h1>
      <p>
        Move USDC from Arc into the Ethereum address SoFi gives you. Circle burns it on Arc and
        mints Ethereum USDC there. SoFi credits that deposit in SoFi Crypto.
      </p>
      <ol>
        <li>In SoFi, open Crypto, then Transfer, then Receive, and choose USDC.</li>
        <li>Confirm the network says Ethereum, then copy that address.</li>
        <li>Connect the Arc wallet that holds the USDC and send.</li>
      </ol>
      <SendForm />
    </main>
  )
}
