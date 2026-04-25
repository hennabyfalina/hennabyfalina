import { ReactNode } from 'react'

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
  return (
    <section className={`w-full py-8 md:py-12 lg:py-16 ${background === 'gray' ? 'bg-gray-50/50' : 'bg-white'} ${className}`}>
      {children}
    </section>
  )
}