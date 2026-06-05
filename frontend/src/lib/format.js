const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const plainNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export function formatCurrency(value) {
  const n = Number(value) || 0
  if (Math.abs(n) >= 1_000_000) return `$${compactFormatter.format(n)}`
  if (Math.abs(n) >= 10_000) return `$${compactFormatter.format(n)}`
  return usdFormatter.format(n)
}

export function formatCurrencyExact(value) {
  return usdFormatter.format(Number(value) || 0)
}

export function formatNumber(value) {
  return plainNumber.format(Number(value) || 0)
}
