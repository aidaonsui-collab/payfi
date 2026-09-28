export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M8 21.5c2.2-6.2 5.2-9.2 8-9.2s5.8 3 8 9.2"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
