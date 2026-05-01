// src/components/admin/OrderStatusBadge.tsx

// 🚨 Soft Material 3 Dark Colors
const statusColors = {
  pending: 'bg-[#4A4431] text-[#F1DF9E]', 
  confirmed: 'bg-[#2E3C4E] text-[#A8C7FA]',
  processing: 'bg-[#3F2D4A] text-[#D0BCFF]',
  packed: 'bg-[#2E3C4E] text-[#A8C7FA]',
  shipped: 'bg-[#4A3A2C] text-[#FFB4A8]',
  delivered: 'bg-[#214332] text-[#93D7A4]',
  cancelled: 'bg-[#4D2628] text-[#F2B8B5]',
}

const paymentStatusColors = {
  pending: 'bg-[#4A4431] text-[#F1DF9E]',
  paid: 'bg-[#214332] text-[#93D7A4]',
  failed: 'bg-[#4D2628] text-[#F2B8B5]',
  refunded: 'bg-[#282A2C] text-[#E3E3E3]',
}

interface OrderStatusBadgeProps {
  status: string
  type?: 'order' | 'payment'
}

export default function OrderStatusBadge({ status, type = 'order' }: OrderStatusBadgeProps) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#282A2C] text-[#E3E3E3]">
        Unknown
      </span>
    )
  }

  const colors = type === 'order' ? statusColors : paymentStatusColors
  const colorClass = colors[status as keyof typeof colors] || 'bg-[#282A2C] text-[#E3E3E3]'
  const formattedStatus = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-colors ${colorClass}`}>
      {formattedStatus}
    </span>
  )
}