import type { ProductConfig } from './types'

export const BASE_PRICE_CENTS = 129900

export function configPriceDeltaCents(config: ProductConfig) {
  let delta = 0

  if (config.lens === 'Transitions') delta += 14900
  if (config.storage === '128GB') delta += 6000
  if (config.warranty === '1 year') delta += 7900
  if (config.warranty === '2 years') delta += 12900

  return delta
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function subtotalCents(items: { unitPriceCents: number; qty: number }[]) {
  return items.reduce((sum, it) => sum + it.unitPriceCents * it.qty, 0)
}

