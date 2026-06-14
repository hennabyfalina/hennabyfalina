// src/app/loading.tsx

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-300" suppressHydrationWarning>
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 bg-gray-900 rounded-full animate-pulse [animation-duration:1s]" />
        <div className="w-2.5 h-2.5 bg-gray-900 rounded-full animate-pulse [animation-duration:1s] [animation-delay:200ms]" />
        <div className="w-2.5 h-2.5 bg-gray-900 rounded-full animate-pulse [animation-duration:1s] [animation-delay:400ms]" />
      </div>
    </div>
  )
}