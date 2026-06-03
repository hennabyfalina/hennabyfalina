// src/app/admin/orders/[id]/OrderDetailSkeleton.tsx

export function OrderDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full admin-bg-elevated w-10 h-10" />
          <div>
            <div className="h-7 w-48 admin-bg-elevated rounded" />
            <div className="h-3 w-32 admin-bg-elevated rounded mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="h-3 w-20 admin-bg-elevated rounded mb-1" />
            <div className="h-4 w-32 admin-bg-elevated rounded" />
          </div>
          <div className="h-8 w-24 admin-bg-elevated rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Card */}
          <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
            <div className="px-6 py-5 border-b admin-border flex justify-between">
              <div className="h-5 w-32 admin-bg-elevated rounded" />
              <div className="h-6 w-16 admin-bg-elevated rounded-full" />
            </div>
            <div className="p-6 space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex justify-between pb-6 border-b">
                  <div className="space-y-2">
                    <div className="h-5 w-48 admin-bg-elevated rounded" />
                    <div className="h-4 w-32 admin-bg-elevated rounded" />
                  </div>
                  <div className="h-5 w-20 admin-bg-elevated rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Address Card */}
          <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
            <div className="px-6 py-5 border-b admin-border">
              <div className="h-5 w-40 admin-bg-elevated rounded" />
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="h-4 w-24 admin-bg-elevated rounded" />
                  <div className="h-6 w-36 admin-bg-elevated rounded" />
                  <div className="h-4 w-48 admin-bg-elevated rounded" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-24 admin-bg-elevated rounded" />
                  <div className="h-4 w-56 admin-bg-elevated rounded" />
                  <div className="h-4 w-40 admin-bg-elevated rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="admin-bg-card rounded-[32px] border admin-border p-6">
            <div className="h-5 w-32 admin-bg-elevated rounded mb-6" />
            <div className="space-y-4">
              <div className="h-16 admin-bg-elevated rounded-2xl" />
              <div className="h-12 admin-bg-elevated rounded-full" />
            </div>
          </div>
          <div className="admin-bg-card rounded-[32px] border admin-border p-6">
            <div className="h-5 w-32 admin-bg-elevated rounded mb-6" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 admin-bg-elevated rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}