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
}: DashboardLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-black">
      {header}
      {navigation}
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
