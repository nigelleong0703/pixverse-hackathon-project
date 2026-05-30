export function StarRating(props: {
  value: number
  onChange?: (value: 1 | 2 | 3 | 4 | 5) => void
  size?: 'sm' | 'md'
  label?: string
}) {
  const size = props.size ?? 'md'
  const cls =
    size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-1">
      {props.label ? (
        <span className="mr-2 text-sm text-zinc-300">{props.label}</span>
      ) : null}
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= props.value
        const clickable = typeof props.onChange === 'function'
        return (
          <button
            key={n}
            type="button"
            disabled={!clickable}
            onClick={() => props.onChange?.(n as 1 | 2 | 3 | 4 | 5)}
            className={[
              'rounded',
              clickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default',
              !clickable ? 'opacity-90' : '',
            ].join(' ')}
            aria-label={`Rate ${n} stars`}
          >
            <svg
              className={`${cls} ${filled ? 'fill-violet-400' : 'fill-zinc-700'}`}
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.968a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.375 2.452a1 1 0 00-.364 1.118l1.287 3.968c.3.921-.755 1.688-1.539 1.118l-3.375-2.452a1 1 0 00-1.176 0l-3.375 2.452c-.784.57-1.838-.197-1.539-1.118l1.287-3.968a1 1 0 00-.364-1.118L2.05 9.395c-.783-.57-.38-1.81.588-1.81h4.173a1 1 0 00.95-.69l1.286-3.968z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
