// src/components/admin/OrderStatusBadge.tsx

'use client'

const getStatusClasses = (status: string, type: 'order' | 'payment') => {
  if (type === 'order') {
    const orderMap: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      packed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      shipped: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      cancel_requested: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      return_requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      returned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    }
    return orderMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
  
  const paymentMap: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }
  return paymentMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
}

export default function OrderStatusBadge({ status, type = 'order' }: { status: string; type?: 'order' | 'payment' }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        Unknown
      </span>
    )
  }

  const badgeClass = getStatusClasses(status, type)
  const formattedStatus = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide ${badgeClass}`}>
      {formattedStatus}
    </span>
  )
}