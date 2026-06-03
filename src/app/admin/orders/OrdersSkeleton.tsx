// src/app/admin/orders/OrdersSkeleton.tsx

export function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-9 w-32 admin-bg-elevated rounded-lg" />
        <div className="h-4 w-56 admin-bg-elevated rounded mt-2" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="admin-bg-card rounded-[24px] p-5 border border-transparent">
            <div className="flex justify-between items-start mb-3">
              <div className="h-3 w-16 admin-bg-elevated rounded" />
              <div className="w-5 h-5 admin-bg-elevated rounded" />
            </div>
            <div className="h-8 w-12 admin-bg-elevated rounded" />
          </div>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 admin-bg-card p-3 rounded-[24px] border admin-border">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-bg-elevated rounded" />
          <div className="w-full h-12 admin-bg-primary rounded-full" />
        </div>
        <div className="flex gap-3">
          <div className="relative shrink-0 min-w-[140px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-bg-elevated rounded" />
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
          <div className="relative shrink-0 min-w-[180px]">
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="admin-bg-primary">
              <tr>
                {['Order #', 'Customer', 'Date', 'Amount', 'Method', 'Status', 'Payment', 'Action'].map((_, i) => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-3 w-16 admin-bg-elevated rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y admin-border">
              {Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-6 py-5">
                      <div className={`h-4 ${j === 0 ? 'w-28' : j === 1 ? 'w-32' : j === 2 ? 'w-36' : j === 3 ? 'w-20' : 'w-24'} admin-bg-elevated rounded ${j >= 4 ? 'rounded-full' : ''}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}