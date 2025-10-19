import { clsx } from 'clsx'
import { Link, useRouterState } from '@tanstack/react-router'

export interface NavItem {
  id: string
  label: string
  path: string
  count?: number
}

export interface NavigationProps {
  items: NavItem[]
}

export function Navigation({ items }: NavigationProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <nav className="border-b border-zinc-800">
      <div className="container mx-auto px-6">
        <div className="flex gap-1 overflow-x-auto">
          {items.map((item) => {
            const isActive = currentPath === item.path
            return (
              <Link
                key={item.id}
                to={item.path}
                className={clsx(
                  'px-3 py-2 border-b-2 transition whitespace-nowrap text-sm',
                  {
                    'border-white text-white': isActive,
                    'border-transparent text-zinc-500 hover:text-zinc-300': !isActive,
                  }
                )}
              >
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span className="ml-1 bg-zinc-700 text-xs px-1.5 py-0.5">
                    {item.count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
