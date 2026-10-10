import type { Destination } from '@/lib/chains'

/** The destination app's icon tile. Leave `alt` empty where the app's name is printed beside it. */
export function AppLogo({ to, className, alt = '' }: { to: Destination; className: string; alt?: string }) {
  return <img src={to.logo} alt={alt} className={`shrink-0 rounded-[22%] ring-1 ring-line ${className}`} />
}
