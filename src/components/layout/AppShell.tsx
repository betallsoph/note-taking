import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { useUIStore } from '@/store'
import { Button } from '@/components/ui/button'

export function AppShell() {
  const { setCommandPaletteOpen, theme } = useUIStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen])

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b px-6">
          <Button
            variant="outline"
            className="h-9 w-full max-w-md justify-start gap-2 text-muted-foreground"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <MagnifyingGlass className="h-4 w-4" />
            <span className="text-sm">Search everywhere...</span>
            <kbd className="pointer-events-none ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-xs sm:inline">
              Ctrl K
            </kbd>
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
