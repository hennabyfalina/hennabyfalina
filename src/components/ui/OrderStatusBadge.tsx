// src/components/ui/OrderStatusBadge.tsx

import React from 'react'

const statusColors = {
  pending: 'bg-orange-100 text-orange-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const paymentStatusColors = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
}

interface OrderStatusBadgeProps {
  status: string
  type?: 'order' | 'payment'
  className?: string
}

export default function OrderStatusBadge({ status, type = 'order', className = '' }: OrderStatusBadgeProps) {
  if (!status) {
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 ${className}`}>
        Unknown
      </span>
    )
  }

  const colors = type === 'order' ? statusColors : paymentStatusColors
  const colorClass = colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  const formattedStatus = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border border-black/5 ${colorClass} ${className}`}>
      {formattedStatus}
    </span>
  )
}