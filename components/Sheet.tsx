'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center md:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="safe-b max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-card px-5 pt-4 md:max-w-sm md:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="sheet-title" className="text-base font-semibold text-ink">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="press flex size-11 items-center justify-center rounded-full text-muted" aria-label="Close">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
