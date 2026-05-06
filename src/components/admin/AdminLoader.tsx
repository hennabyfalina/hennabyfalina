// src/components/admin/AdminLoader.tsx

'use client'

interface AdminLoaderProps {
  message?: string
  fullScreen?: boolean
}

export default function AdminLoader({ 
  message = '', 
  fullScreen = false 
}: AdminLoaderProps) {
  
  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Professional Google Material Design Spinner */}
      <svg className="w-10 h-10 animate-spin text-[#A8C7FA]" viewBox="0 0 50 50">
        <circle 
          className="opacity-25" 
          cx="25" cy="25" r="20" 
          fill="none" stroke="currentColor" strokeWidth="4" 
        />
        <circle 
          className="opacity-100" 
          cx="25" cy="25" r="20" 
          fill="none" stroke="currentColor" strokeWidth="4" 
          strokeLinecap="round" strokeDasharray="90 150" strokeDashoffset="0"
        />
      </svg>
      
      {message && (
        <p className="mt-4 font-sans text-sm font-medium tracking-wide text-[#C4C7C5]">
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#131314] flex flex-col items-center justify-center" suppressHydrationWarning>
        {loaderContent}
      </div>
    )
  }

  return loaderContent
}