'use client'

import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="hp-page-enter flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  )
}
