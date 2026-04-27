// src/app/loading.tsx

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-3">
        {/* Amazon-style blue accent spinner */}
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#007185] rounded-full animate-spin shadow-sm"></div>
      </div>
    </div>
  )
}