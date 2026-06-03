// src/app/admin/finance/loading.tsx

export default function AdminFinanceLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-9 w-40 admin-bg-elevated rounded-lg" />
          <div className="h-4 w-64 admin-bg-elevated rounded mt-2" />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="h-12 w-40 admin-bg-elevated rounded-full" />
          <div className="h-12 w-44 admin-bg-elevated rounded-full" />
        </div>
      </div>

      {/* Stats Cards - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-bg-card rounded-[24px] p-5 border border-transparent">
            <div className="flex justify-between items-start mb-3">
              <div className="h-3 w-32 admin-bg-elevated rounded" />
              <div className="w-5 h-5 admin-bg-elevated rounded" />
            </div>
            <div className="h-8 w-24 admin-bg-elevated rounded" />
          </div>
        ))}
      </div>

      {/* Charts Section - 2 charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart Skeleton */}
        <div className="admin-bg-card rounded-[32px] border admin-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-40 admin-bg-elevated rounded" />
            <div className="h-8 w-32 admin-bg-elevated rounded" />
          </div>
          <div className="h-64 w-full admin-bg-elevated rounded-2xl" />
        </div>

        {/* Cashflow Chart Skeleton */}
        <div className="admin-bg-card rounded-[32px] border admin-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-40 admin-bg-elevated rounded" />
            <div className="h-8 w-32 admin-bg-elevated rounded" />
          </div>
          <div className="h-64 w-full admin-bg-elevated rounded-2xl" />
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 admin-bg-card p-3 rounded-[24px] border admin-border">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-bg-elevated rounded" />
          <div className="w-full h-12 admin-bg-primary rounded-full" />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <div className="relative shrink-0 min-w-[180px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-bg-elevated rounded" />
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
          <div className="relative shrink-0 min-w-[190px]">
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Ledger Table Skeleton */}
      <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="admin-bg-primary">
              <tr>
                {['Date', 'Invoice/Order Ref', 'Razorpay Txn ID', 'Type', 'Taxable Value', 'GST (18%)', 'Total Amount'].map((_, i) => (
                  <th key={i} className="px-6 py-5">
                    <div className="h-3 w-28 admin-bg-elevated rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y admin-border">
              {Array.from({ length: 8 }).map((_, index) => (
                <tr key={index}>
                  {/* Date */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="h-4 w-24 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Order Number */}
                  <td className="px-6 py-5">
                    <div className="h-5 w-32 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Razorpay Txn ID */}
                  <td className="px-6 py-5">
                    <div className="h-4 w-40 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Type Badge */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="h-6 w-16 admin-bg-elevated rounded-full" />
                  </td>
                  
                  {/* Taxable Value */}
                  <td className="px-6 py-5">
                    <div className="h-4 w-20 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* GST Amount */}
                  <td className="px-6 py-5">
                    <div className="h-4 w-20 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Total Amount */}
                  <td className="px-6 py-5">
                    <div className="h-5 w-20 admin-bg-elevated rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}