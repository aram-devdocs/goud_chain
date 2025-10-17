import type { ReactNode } from 'react'

export interface PageContainerProps {
  title: string
  description?: string
  children: ReactNode
}

export function PageContainer({
  title,
  description,
  children,
}: PageContainerProps): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        {description && <p className="text-zinc-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}
