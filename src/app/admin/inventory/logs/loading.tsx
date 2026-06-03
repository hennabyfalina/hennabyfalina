// src/app/admin/inventory/logs/loading.tsx

export default function InventoryLogsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 admin-bg-card border admin-border rounded-full w-9 h-9" />
          <div>
            <div className="h-7 w-32 admin-bg-elevated rounded" />
            <div className="h-4 w-56 admin-bg-elevated rounded mt-1" />
          </div>
        </div>
      </div>

      {/* Logs Table Skeleton */}
      <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="admin-bg-primary">
              <tr>
                {['Date & Time', 'Product', 'Movement', 'Reason', 'Authorized By'].map((_, i) => (
                  <th key={i} className={`px-6 py-4 ${i === 4 ? 'text-right' : ''}`}>
                    <div className={`h-3 w-24 admin-bg-elevated rounded ${i === 4 ? 'ml-auto' : ''}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y admin-border">
              {Array.from({ length: 10 }).map((_, index) => (
                <tr key={index} className="hover:admin-bg-elevated transition-colors">
                  {/* Date & Time */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 admin-bg-elevated rounded" />
                      <div className="h-4 w-28 admin-bg-elevated rounded" />
                    </div>
                  </td>
                  
                  {/* Product */}
                  <td className="px-6 py-5">
                    <div className="h-5 w-48 admin-bg-elevated rounded" />
                    <div className="h-3 w-20 admin-bg-elevated rounded mt-1" />
                  </td>
                  
                  {/* Movement */}
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-12 admin-bg-elevated rounded" />
                      <div className="h-6 w-20 admin-bg-elevated rounded" />
                    </div>
                  </td>
                  
                  {/* Reason */}
                  <td className="px-6 py-5">
                    <div className="h-4 w-32 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Authorized By */}
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-3 h-3 admin-bg-elevated rounded" />
                      <div className="h-4 w-28 admin-bg-elevated rounded" />
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