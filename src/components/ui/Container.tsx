// src/components/ui/Container.tsx

import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export default function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`w-full px-4 sm:px-6 lg:max-w-[1500px] lg:mx-auto lg:px-8 ${className}`}>
      {children}
    </div>
  )
}