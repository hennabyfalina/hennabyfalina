import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}