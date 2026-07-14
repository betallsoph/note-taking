import { NavLink } from 'react-router-dom'
import {
  House,
  BookOpen,
  Graph,
  Code,
  Cards,
  MapTrifold,
  ArrowsClockwise,
  MicrophoneStage,
  Key,
  NotePencil,
  Bell,
  SidebarSimple,
  Moon,
  Sun,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store'
import { Button } from '@/components/ui/button'

interface NavItem {
  to: string
  label: string
  icon: Icon
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [{ to: '/', label: 'Dashboard', icon: House }],
  },
  {
    label: 'Capture',
    items: [
      { to: '/notes', label: 'Notes', icon: NotePencil },
      { to: '/reminders', label: 'Reminders', icon: Bell },
    ],
  },
  {
    label: 'Study',
    items: [
      { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
      { to: '/roadmaps', label: 'Roadmaps', icon: MapTrifold },
      { to: '/dsa', label: 'DSA Visualizer', icon: Graph },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/problems', label: 'Problems', icon: Code },
      { to: '/flashcards', label: 'Flashcards', icon: Cards },
      { to: '/reviews', label: 'Reviews', icon: ArrowsClockwise },
      { to: '/interview', label: 'Interview Hub', icon: MicrophoneStage },
    ],
  },
  {
    label: 'Tools',
    items: [{ to: '/dev-accounts', label: 'Dev Vault', icon: Key }],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useUIStore()

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <aside
      className={cn(
        'flex h-[100dvh] flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold tracking-tight text-foreground">CS Hub</span>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
          <SidebarSimple className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group, groupIndex) => (
          <div
            key={group.label ?? `group-${groupIndex}`}
            className={cn(groupIndex > 0 && 'mt-3')}
          >
            {group.label && !sidebarCollapsed && (
              <p className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.label && sidebarCollapsed && groupIndex > 0 && (
              <div className="mx-2 mb-2 border-t border-sidebar-border" />
            )}
            <div className="space-y-1">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  title={sidebarCollapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                      sidebarCollapsed && 'justify-center px-2',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" weight="duotone" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size={sidebarCollapsed ? 'icon' : 'default'}
          onClick={toggleTheme}
          className={cn('w-full', !sidebarCollapsed && 'justify-start gap-3')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </Button>
      </div>
    </aside>
  )
}
