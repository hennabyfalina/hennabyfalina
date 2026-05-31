import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface SectionProps {
  children: ReactNode
  className?: string
  background?: 'white' | 'gray'
}

export default function Section({ 
  children, 
  className = '', 
  background = 'white' 
}: SectionProps) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  const bgClass = isAdmin 
    ? (background === 'gray' ? 'admin-bg-elevated' : 'admin-bg-primary')
    : (background === 'gray' ? 'bg-gray-50/50' : 'bg-white')

  return (
    <section className={`w-full py-8 md:py-12 lg:py-16 ${bgClass} ${className}`}>
      {children}
    </section>
  )
}