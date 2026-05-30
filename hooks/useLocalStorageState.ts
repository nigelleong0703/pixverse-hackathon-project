import * as React from 'react'

/**
 * A small helper for state that persists in localStorage.
 * Uses JSON serialization and works in the browser only.
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return initialValue
      return JSON.parse(raw) as T
    } catch {
      return initialValue
    }
  })

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore write errors (private mode, quota, etc.)
    }
  }, [key, value])

  return [value, setValue] as const
}

