import { clsx } from 'clsx'
import { Link, useRouterState } from '@tanstack/react-router'

export interface NavItem {
  id: string
  label: string
  path: string
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
        <div className="flex space-x-1">
          {items.map((item) => {
            const isActive = currentPath === item.path
            return (
              <Link
                key={item.id}
                to={item.path}
                className={clsx(
                  'px-4 py-3 text-sm font-medium transition-colors relative',
                  {
                    'text-white': isActive,
                    'text-zinc-500 hover:text-zinc-300': !isActive,
                  }
                )}
              >
                {item.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
