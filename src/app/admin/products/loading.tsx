// src/app/admin/products/loading.tsx

export default function AdminProductsLoading() {
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="admin-bg-card rounded-[24px] p-5 border border-transparent">
            <div className="flex justify-between items-start mb-3">
              <div className="h-3 w-24 admin-bg-elevated rounded" />
              <div className="w-5 h-5 admin-bg-elevated rounded" />
            </div>
            <div className="h-8 w-12 admin-bg-elevated rounded" />
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
          <div className="relative shrink-0 min-w-[160px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-bg-elevated rounded" />
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
          <div className="relative shrink-0 min-w-[160px]">
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
          <div className="relative shrink-0 min-w-[140px]">
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Products Table Skeleton */}
      <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="admin-bg-primary">
              <tr>
                {['Img', 'Name & SKU', 'Pricing', 'B2B Rule', 'Stock', 'Status', 'Updated', 'Actions'].map((header, i) => (
                  <th key={i} className={`px-6 py-4 ${i === 0 ? 'w-16' : i === 7 ? 'text-right' : ''}`}>
                    <div className={`h-3 w-16 admin-bg-elevated rounded ${i === 7 ? 'ml-auto' : ''}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y admin-border">
              {Array.from({ length: 8 }).map((_, index) => (
                <tr key={index} className="hover:admin-bg-elevated transition-all duration-150">
                  {/* Image */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-12 admin-bg-primary border admin-border rounded-xl" />
                  </td>
                  
                  {/* Name & SKU */}
                  <td className="px-6 py-4">
                    <div className="h-5 w-48 admin-bg-elevated rounded" />
                    <div className="h-3 w-24 admin-bg-elevated rounded mt-2" />
                  </td>
                  
                  {/* Pricing */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-20 admin-bg-elevated rounded" />
                    <div className="h-3 w-16 admin-bg-elevated rounded mt-1" />
                  </td>
                  
                  {/* B2B Rule */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-20 admin-bg-elevated rounded" />
                    <div className="h-3 w-16 admin-bg-elevated rounded mt-1" />
                  </td>
                  
                  {/* Stock */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-12 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 w-20 admin-bg-elevated rounded-full" />
                  </td>
                  
                  {/* Updated */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 w-24 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-8 h-8 admin-bg-elevated rounded-full" />
                      <div className="w-8 h-8 admin-bg-elevated rounded-full" />
                    </div>
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