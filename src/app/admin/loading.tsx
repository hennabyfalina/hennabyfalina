// src/app/admin/loading.tsx

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 pt-4 md:pt-6 pb-12 animate-pulse">
      {/* Header Section */}
      <div className="w-full">
        <div className="h-9 w-48 admin-bg-elevated rounded-lg mb-2" />
        <div className="h-8 w-72 admin-bg-elevated rounded-lg mb-6" />
        <div className="h-12 w-full max-w-md admin-bg-elevated rounded-full" />
      </div>

      {/* Two Column Grid: Activity + Utility Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Activity Card */}
        <div className="admin-bg-card border admin-border rounded-[32px] p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-4 h-4 rounded-full admin-bg-elevated" />
            <div className="h-4 w-32 admin-bg-elevated rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 admin-bg-primary rounded-2xl border admin-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full admin-bg-elevated" />
                  <div className="h-4 w-48 admin-bg-elevated rounded" />
                </div>
                <div className="w-4 h-4 admin-bg-elevated rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Utility Tools Card */}
        <div className="admin-bg-card border admin-border rounded-[32px] p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-4 h-4 rounded-full admin-bg-elevated" />
            <div className="h-4 w-32 admin-bg-elevated rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 admin-bg-primary border admin-border rounded-2xl">
                <div className="w-4 h-4 admin-bg-elevated rounded" />
                <div className="h-4 w-20 admin-bg-elevated rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="admin-bg-card border admin-border rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 admin-bg-elevated rounded" />
              <div className="w-5 h-5 admin-bg-elevated rounded" />
            </div>
            <div className="h-8 w-16 admin-bg-elevated rounded mt-3" />
          </div>
        ))}
      </div>

      {/* Business Intelligence Section */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4 z-20 relative px-2 md:px-0">
          <div>
            <div className="h-6 w-40 admin-bg-elevated rounded mb-1" />
            <div className="h-4 w-56 admin-bg-elevated rounded hidden sm:block" />
          </div>
          <div className="h-10 w-32 admin-bg-elevated rounded-full" />
        </div>

        {/* Charts Area Placeholder */}
        <div className="admin-bg-card border admin-border rounded-[32px] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart Placeholder */}
            <div>
              <div className="h-5 w-32 admin-bg-elevated rounded mb-4" />
              <div className="h-48 w-full admin-bg-elevated rounded-2xl" />
            </div>
            {/* Category Chart Placeholder */}
            <div>
              <div className="h-5 w-32 admin-bg-elevated rounded mb-4" />
              <div className="h-48 w-full admin-bg-elevated rounded-2xl" />
            </div>
            {/* Status Chart Placeholder */}
            <div>
              <div className="h-5 w-32 admin-bg-elevated rounded mb-4" />
              <div className="h-48 w-full admin-bg-elevated rounded-2xl" />
            </div>
            {/* Inventory Chart Placeholder */}
            <div>
              <div className="h-5 w-32 admin-bg-elevated rounded mb-4" />
              <div className="h-48 w-full admin-bg-elevated rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Two Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-32 admin-bg-elevated rounded" />
            <div className="h-4 w-20 admin-bg-elevated rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b admin-border last:border-0">
                <div>
                  <div className="h-4 w-32 admin-bg-elevated rounded" />
                  <div className="h-3 w-20 admin-bg-elevated rounded mt-1" />
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 admin-bg-elevated rounded" />
                  <div className="h-3 w-12 admin-bg-elevated rounded mt-1 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden p-2">
          <div className="px-6 py-4 flex items-center justify-between border-b admin-border">
            <div className="h-5 w-36 admin-bg-elevated rounded" />
            <div className="h-4 w-20 admin-bg-elevated rounded" />
          </div>
          <div className="p-2 space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-[24px]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full admin-bg-elevated" />
                  <div>
                    <div className="h-4 w-40 admin-bg-elevated rounded" />
                    <div className="h-3 w-20 admin-bg-elevated rounded mt-1" />
                  </div>
                </div>
                <div className="h-4 w-16 admin-bg-elevated rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}