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
  SidebarSimple,
  Moon,
  Sun,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/', label: 'Dashboard', icon: House },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { to: '/dsa', label: 'DSA Visualizer', icon: Graph },
  { to: '/problems', label: 'Problems', icon: Code },
  { to: '/roadmaps', label: 'Roadmaps', icon: MapTrifold },
  { to: '/flashcards', label: 'Flashcards', icon: Cards },
  { to: '/reviews', label: 'Reviews', icon: ArrowsClockwise },
  { to: '/interview', label: 'Interview Hub', icon: MicrophoneStage },
  { to: '/dev-accounts', label: 'Dev Accounts', icon: Key },
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

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
