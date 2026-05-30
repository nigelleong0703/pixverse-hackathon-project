import * as React from 'react'

export function Modal(props: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') props.onClose()
    }
    if (props.open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [props.open, props.onClose])

  if (!props.open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={props.title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={props.onClose}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-100">{props.title}</h2>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-300 hover:bg-white/5"
          >
            Esc
          </button>
        </div>
        <div className="p-5">{props.children}</div>
      </div>
    </div>
  )
}

