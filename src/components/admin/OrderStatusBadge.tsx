// src/components/admin/OrderStatusBadge.tsx

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
}

interface OrderStatusBadgeProps {
  status: string
  type?: 'order' | 'payment'
}

export default function OrderStatusBadge({ status, type = 'order' }: OrderStatusBadgeProps) {
  // Handle undefined or null status
  if (!status) {
    return (
      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Unknown
      </span>
    )
  }

  const colors = type === 'order' ? statusColors : paymentStatusColors
  const colorClass = colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  
  // Format status for display
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1)
  
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {formattedStatus}
    </span>
  )
}