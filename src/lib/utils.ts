// src/lib/utils.ts

export function generateOrderNumber() {
  // Generates format: RPC-XXXXXXX-XXXXXXX (Amazon Style)
  const part1 = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  const part2 = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `RPC-${part1}-${part2}`;
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

// Admin Dashboard Constants

export function getStartOfWeek(): string {
  const date = new Date()
  date.setDate(date.getDate() - date.getDay())
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export function getStartOfMonth(): string {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export function getStartOfYear(): string {
  const date = new Date()
  date.setMonth(0, 1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}