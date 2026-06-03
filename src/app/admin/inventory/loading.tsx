// src/app/admin/inventory/loading.tsx

export default function AdminInventoryLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-9 w-32 admin-bg-elevated rounded-lg" />
          <div className="h-4 w-56 admin-bg-elevated rounded mt-2" />
        </div>
        <div className="h-12 w-40 admin-bg-elevated rounded-full" />
      </div>

      {/* Stats Cards - 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-bg-card rounded-[24px] p-5 border border-transparent">
            <div className="flex justify-between items-start mb-3">
              <div className="h-3 w-20 admin-bg-elevated rounded" />
              <div className="w-5 h-5 admin-bg-elevated rounded" />
            </div>
            <div className="h-8 w-16 admin-bg-elevated rounded" />
          </div>
        ))}
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
          <div className="relative shrink-0 min-w-[150px]">
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Inventory Table Skeleton */}
      <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[900px] text-left">
            <thead className="admin-bg-primary">
              <tr>
                {['Item', 'Product Details', 'Category', 'Current Stock', 'Status', 'Actions'].map((header, i) => (
                  <th key={i} className={`px-6 py-5 ${i === 0 ? 'w-16' : i === 5 ? 'text-right' : ''}`}>
                    <div className={`h-3 w-20 admin-bg-elevated rounded ${i === 5 ? 'ml-auto' : ''}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y admin-border">
              {Array.from({ length: 8 }).map((_, index) => (
                <tr key={index} className="hover:admin-bg-elevated transition-colors">
                  {/* Image */}
                  <td className="px-6 py-5">
                    <div className="w-12 h-12 admin-bg-primary border admin-border rounded-xl" />
                  </td>
                  
                  {/* Product Details */}
                  <td className="px-6 py-5">
                    <div className="h-5 w-48 admin-bg-elevated rounded" />
                    <div className="h-3 w-24 admin-bg-elevated rounded mt-2" />
                  </td>
                  
                  {/* Category */}
                  <td className="px-6 py-5">
                    <div className="h-7 w-24 admin-bg-elevated rounded-md" />
                  </td>
                  
                  {/* Current Stock */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-12 admin-bg-elevated rounded" />
                      <div className="h-3 w-8 admin-bg-elevated rounded" />
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-5">
                    <div className="h-6 w-24 admin-bg-elevated rounded-full" />
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-5 text-right">
                    <div className="h-8 w-20 admin-bg-elevated rounded-full ml-auto" />
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