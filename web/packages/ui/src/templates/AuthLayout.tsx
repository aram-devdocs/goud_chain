import type { ReactNode } from 'react'

export interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {children}
    </div>
  )
}
