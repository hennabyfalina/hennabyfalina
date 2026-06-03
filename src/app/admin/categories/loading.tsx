// src/app/admin/categories/loading.tsx

export default function AdminCategoriesLoading() {
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

      {/* Stats Cards - 3 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3].map((i) => (
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

        {/* Sort Dropdown */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <div className="relative shrink-0 min-w-[220px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-bg-elevated rounded" />
            <div className="w-full h-12 admin-bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Categories Table Skeleton */}
      <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-5 admin-bg-primary/30 border-b admin-border">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 sm:col-span-5">
              <div className="h-3 w-28 admin-bg-elevated rounded" />
            </div>
            <div className="col-span-3 sm:col-span-2 text-center">
              <div className="h-3 w-16 admin-bg-elevated rounded mx-auto" />
            </div>
            <div className="hidden sm:block sm:col-span-3 text-center">
              <div className="h-3 w-24 admin-bg-elevated rounded mx-auto" />
            </div>
            <div className="col-span-3 sm:col-span-2 text-right">
              <div className="h-3 w-12 admin-bg-elevated rounded ml-auto" />
            </div>
          </div>
        </div>

        {/* Table Body Skeleton Rows */}
        <div className="divide-y admin-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center px-6 py-4">
              {/* Drag Handle + Image + Name */}
              <div className="col-span-6 sm:col-span-5 flex items-center gap-4">
                <div className="w-5 h-5 admin-bg-elevated rounded" />
                <div className="w-10 h-10 admin-bg-primary border admin-border rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-32 admin-bg-elevated rounded" />
                  <div className="h-3 w-48 admin-bg-elevated rounded mt-1 hidden sm:block" />
                </div>
              </div>

              {/* Products Count */}
              <div className="col-span-3 sm:col-span-2 flex justify-center">
                <div className="h-6 w-16 admin-bg-elevated rounded-full" />
              </div>

              {/* Last Updated */}
              <div className="hidden sm:flex sm:col-span-3 justify-center">
                <div className="h-4 w-24 admin-bg-elevated rounded" />
              </div>

              {/* Actions */}
              <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                <div className="w-8 h-8 admin-bg-elevated rounded-full" />
                <div className="w-8 h-8 admin-bg-elevated rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}