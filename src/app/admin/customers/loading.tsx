// src/app/admin/customers/loading.tsx

export default function AdminCustomersLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-9 w-32 admin-bg-elevated rounded-lg" />
          <div className="h-4 w-56 admin-bg-elevated rounded mt-2" />
        </div>
        <div className="h-12 w-36 admin-bg-elevated rounded-full" />
      </div>

      {/* Stats Cards - 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="admin-bg-card rounded-[24px] p-5 border border-transparent">
            <div className="flex justify-between items-start mb-3">
              <div className="h-3 w-28 admin-bg-elevated rounded" />
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

        {/* Sort Dropdown */}
        <div className="relative shrink-0 min-w-[180px]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-bg-elevated rounded" />
          <div className="w-full h-12 admin-bg-primary rounded-full" />
        </div>
      </div>

      {/* Customers Table Skeleton */}
      <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[800px] text-left">
            <thead className="admin-bg-primary">
              <tr>
                {['Client Identity', 'Contact', 'Joined On', 'Total Orders', 'LTV (Spent)', 'Actions'].map((header, i) => (
                  <th key={i} className={`px-6 py-5 ${i === 4 || i === 5 ? 'text-right' : ''}`}>
                    <div className={`h-3 w-24 admin-bg-elevated rounded ${i === 4 || i === 5 ? 'ml-auto' : ''}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y admin-border">
              {Array.from({ length: 8 }).map((_, index) => (
                <tr key={index} className="hover:admin-bg-elevated transition-colors">
                  {/* Client Identity - Avatar + Name + Email */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 admin-bg-primary border admin-border rounded-full" />
                      <div>
                        <div className="h-5 w-32 admin-bg-elevated rounded" />
                        <div className="h-3 w-40 admin-bg-elevated rounded mt-1" />
                      </div>
                    </div>
                  </td>
                  
                  {/* Contact - Phone */}
                  <td className="px-6 py-5">
                    <div className="h-4 w-28 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Joined On */}
                  <td className="px-6 py-5">
                    <div className="h-4 w-24 admin-bg-elevated rounded" />
                  </td>
                  
                  {/* Total Orders Badge */}
                  <td className="px-6 py-5">
                    <div className="h-6 w-20 admin-bg-elevated rounded-full" />
                  </td>
                  
                  {/* LTV Spent */}
                  <td className="px-6 py-5 text-right">
                    <div className="h-5 w-20 admin-bg-elevated rounded ml-auto" />
                  </td>
                  
                  {/* Actions - Edit Button */}
                  <td className="px-6 py-5 text-right">
                    <div className="w-8 h-8 admin-bg-elevated rounded-full ml-auto" />
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