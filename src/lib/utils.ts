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

export function numberToIndianWords(num: number): string {
  const single = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  const formatTens = (n: number) => {
    if (n < 10) return single[n]
    if (n < 20) return double[n - 10]
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + single[n % 10] : '')
  }

  const integerPart = Math.floor(num)
  if (integerPart === 0) return 'Zero Rupees Only'

  let word = ''
  let temp = integerPart
  
  const crore = Math.floor(temp / 10000000)
  temp %= 10000000
  const lakh = Math.floor(temp / 100000)
  temp %= 100000
  const thousand = Math.floor(temp / 1000)
  temp %= 1000
  const hundred = Math.floor(temp / 100)
  temp %= 100

  if (crore > 0) word += formatTens(crore) + ' Crore '
  if (lakh > 0) word += formatTens(lakh) + ' Lakh '
  if (thousand > 0) word += formatTens(thousand) + ' Thousand '
  if (hundred > 0) word += formatTens(hundred) + ' Hundred '
  if (temp > 0) {
    if (word !== '') word += 'and '
    word += formatTens(temp) + ' '
  }

  return word.trim() + ' Rupees Only'
}