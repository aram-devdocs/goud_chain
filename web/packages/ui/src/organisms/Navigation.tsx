import { clsx } from 'clsx'

export interface NavItem {
  id: string
  label: string
}

export interface NavigationProps {
  items: NavItem[]
  activeId: string
  onNavigate: (id: string) => void
}

export function Navigation({ items, activeId, onNavigate }: NavigationProps) {
  return (
    <nav className="border-b border-zinc-800">
      <div className="container mx-auto px-6">
        <div className="flex space-x-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'px-4 py-3 text-sm font-medium transition-colors relative',
                {
                  'text-white': activeId === item.id,
                  'text-zinc-500 hover:text-zinc-300': activeId !== item.id,
                }
              )}
            >
              {item.label}
              {activeId === item.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
