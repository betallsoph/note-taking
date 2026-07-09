import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { BookOpen, Code, Cards, Key } from '@phosphor-icons/react'
import { useUIStore } from '@/store'
import { api } from '@/services/api'
import type { SearchResults } from '@/types'

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.simulations.search(query)
        setResults(data)
      } catch {
        setResults(null)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const go = (path: string) => {
    setCommandPaletteOpen(false)
    setQuery('')
    navigate(path)
  }

  if (!commandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2">
        <Command className="overflow-hidden rounded-lg border bg-popover shadow-2xl" shouldFilter={false}>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search articles, problems, flashcards..."
            className="flex h-12 w-full border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {!query && (
              <Command.Group heading="Quick navigation">
                <CommandItem icon={BookOpen} onSelect={() => go('/knowledge')}>
                  Knowledge Base
                </CommandItem>
                <CommandItem icon={Code} onSelect={() => go('/problems')}>
                  Problems
                </CommandItem>
                <CommandItem icon={Cards} onSelect={() => go('/flashcards')}>
                  Flashcards
                </CommandItem>
                <CommandItem icon={Key} onSelect={() => go('/dev-accounts')}>
                  Dev Accounts
                </CommandItem>
              </Command.Group>
            )}
            {results && results.articles.length === 0 && results.problems.length === 0 && results.flashcards.length === 0 && query && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
            )}
            {results && results.articles.length > 0 && (
              <Command.Group heading="Articles">
                {results.articles.map((a) => (
                  <CommandItem key={a.id} icon={BookOpen} onSelect={() => go(`/knowledge/${a.id}`)}>
                    {a.title}
                  </CommandItem>
                ))}
              </Command.Group>
            )}
            {results && results.problems.length > 0 && (
              <Command.Group heading="Problems">
                {results.problems.map((p) => (
                  <CommandItem key={p.id} icon={Code} onSelect={() => go(`/problems/${p.id}`)}>
                    {p.title}
                  </CommandItem>
                ))}
              </Command.Group>
            )}
            {results && results.flashcards.length > 0 && (
              <Command.Group heading="Flashcards">
                {results.flashcards.map((f) => (
                  <CommandItem key={f.id} icon={Cards} onSelect={() => go('/flashcards')}>
                    {f.question}
                  </CommandItem>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

function CommandItem({
  children,
  onSelect,
  icon: Icon,
}: {
  children: React.ReactNode
  onSelect: () => void
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </Command.Item>
  )
}
