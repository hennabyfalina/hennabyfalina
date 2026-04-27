// src/app/(shop)/loading.tsx

export default function ShopLoading() {
  return (
    <div className="flex-1 flex flex-col w-full min-h-screen items-center justify-center bg-white">
      {/* Amazon-style blue accent spinner */}
      <div className="w-10 h-10 border-4 border-gray-200 border-t-[#007185] rounded-full animate-spin shadow-sm"></div>
    </div>
  )
}