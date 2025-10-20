import type { ReactNode } from 'react'

export interface DashboardLayoutProps {
  children: ReactNode
  header?: ReactNode
  navigation?: ReactNode
}

export function DashboardLayout({
  children,
  header,
  navigation,
}: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen bg-black">
      <div className="relative z-10">
        {header}
        {navigation}
        <main className="container mx-auto px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
