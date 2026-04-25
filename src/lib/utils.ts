// src/lib/utils.ts

export function generateOrderNumber(): string {
  // Get current date in YYMMDD format
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  
  // Generate random 6-character alphanumeric suffix
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  // Return formatted order number
  return `RPC-${dateStr}-${random}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}