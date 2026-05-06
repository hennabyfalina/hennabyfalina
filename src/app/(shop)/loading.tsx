// src/app/(shop)/loading.tsx

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white" suppressHydrationWarning>
      <div className="animate-spin w-10 h-10 border-4 border-gray-200 border-t-[#007185] rounded-full shadow-sm" suppressHydrationWarning />
    </div>
  )
}