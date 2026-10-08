import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PayFi',
  description: 'Send Sui USDC to a SoFi Ethereum USDC address.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
