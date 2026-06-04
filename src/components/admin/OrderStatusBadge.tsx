// src/components/admin/OrderStatusBadge.tsx

'use client'

const getStatusClasses = (status: string, type: 'order' | 'payment') => {
  if (type === 'order') {
    const orderMap: Record<string, string> = {
      pending: 'admin-badge-pending border border-[var(--admin-status-pending-text)]/20',
      confirmed: 'admin-badge-confirmed border border-[var(--admin-status-confirmed-text)]/20',
      processing: 'admin-badge-processing border border-[var(--admin-status-processing-text)]/20',
      packed: 'admin-badge-confirmed border border-[var(--admin-status-confirmed-text)]/20',
      shipped: 'admin-badge-shipped border border-[var(--admin-status-shipped-text)]/20',
      delivered: 'admin-badge-delivered border border-[var(--admin-status-delivered-text)]/20',
      cancelled: 'admin-badge-cancelled border border-[var(--admin-status-cancelled-text)]/20',
      cancel_requested: 'admin-badge-cancelled border border-[var(--admin-status-cancelled-text)]/20',
      return_requested: 'admin-badge-pending border border-[var(--admin-status-pending-text)]/20',
      returned: 'admin-bg-elevated admin-text-secondary border admin-border',
    }
    return orderMap[status] || 'admin-bg-elevated admin-text-secondary border admin-border'
  }
  
  const paymentMap: Record<string, string> = {
    pending: 'admin-badge-pending border border-[var(--admin-status-pending-text)]/20',
    paid: 'admin-badge-delivered border border-[var(--admin-status-delivered-text)]/20',
    failed: 'admin-badge-cancelled border border-[var(--admin-status-cancelled-text)]/20',
    refunded: 'admin-bg-elevated admin-text-secondary border admin-border',
  }
  return paymentMap[status] || 'admin-bg-elevated admin-text-secondary border admin-border'
}

export default function OrderStatusBadge({ status, type = 'order' }: { status: string; type?: 'order' | 'payment' }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase admin-bg-elevated admin-text-muted border admin-border">
        Unknown
      </span>
    )
  }

  const badgeClass = getStatusClasses(status, type)
  const formattedStatus = status.replace(/_/g, ' ')
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${badgeClass}`}>
      {formattedStatus}
    </span>
  )
}