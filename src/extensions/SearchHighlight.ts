import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface SearchHighlightStorage {
  query: string
  matchCount: number
  activeIndex: number
}

export const searchHighlightKey = new PluginKey('searchHighlight')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchHighlight: {
      setSearchQuery: (query: string) => ReturnType
      findNext: () => ReturnType
      findPrevious: () => ReturnType
      clearSearch: () => ReturnType
    }
  }
  interface Storage {
    searchHighlight: SearchHighlightStorage
  }
}

function findMatches(doc: import('@tiptap/pm/model').Node, query: string) {
  const matches: { from: number; to: number }[] = []
  if (!query.trim()) return matches
  const lower = query.toLowerCase()
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const text = node.text.toLowerCase()
    let index = text.indexOf(lower)
    while (index !== -1) {
      matches.push({ from: pos + index, to: pos + index + query.length })
      index = text.indexOf(lower, index + 1)
    }
  })
  return matches
}

export const SearchHighlight = Extension.create({
  name: 'searchHighlight',

  addStorage() {
    return {
      query: '',
      matchCount: 0,
      activeIndex: 0,
    } satisfies SearchHighlightStorage
  },

  addCommands() {
    return {
      setSearchQuery:
        (query: string) =>
        ({ editor, tr, dispatch }) => {
          editor.storage.searchHighlight.query = query
          editor.storage.searchHighlight.activeIndex = 0
          const matches = findMatches(editor.state.doc, query)
          editor.storage.searchHighlight.matchCount = matches.length
          if (dispatch) {
            tr.setMeta(searchHighlightKey, { query, activeIndex: 0 })
            dispatch(tr)
          }
          return true
        },
      findNext:
        () =>
        ({ editor, tr, dispatch }) => {
          const { query, matchCount, activeIndex } = editor.storage.searchHighlight
          if (!query || matchCount === 0) return false
          const next = (activeIndex + 1) % matchCount
          editor.storage.searchHighlight.activeIndex = next
          if (dispatch) {
            tr.setMeta(searchHighlightKey, { query, activeIndex: next })
            dispatch(tr)
          }
          return true
        },
      findPrevious:
        () =>
        ({ editor, tr, dispatch }) => {
          const { query, matchCount, activeIndex } = editor.storage.searchHighlight
          if (!query || matchCount === 0) return false
          const prev = (activeIndex - 1 + matchCount) % matchCount
          editor.storage.searchHighlight.activeIndex = prev
          if (dispatch) {
            tr.setMeta(searchHighlightKey, { query, activeIndex: prev })
            dispatch(tr)
          }
          return true
        },
      clearSearch:
        () =>
        ({ editor, tr, dispatch }) => {
          editor.storage.searchHighlight.query = ''
          editor.storage.searchHighlight.matchCount = 0
          editor.storage.searchHighlight.activeIndex = 0
          if (dispatch) {
            tr.setMeta(searchHighlightKey, { query: '', activeIndex: 0 })
            dispatch(tr)
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const { storage } = this
    return [
      new Plugin({
        key: searchHighlightKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, _old, _oldState, newState) {
            const meta = tr.getMeta(searchHighlightKey) as
              | { query: string; activeIndex: number }
              | undefined
            const query = meta?.query ?? storage.query
            const activeIndex = meta?.activeIndex ?? storage.activeIndex
            if (!query.trim()) return DecorationSet.empty
            const matches = findMatches(newState.doc, query)
            storage.matchCount = matches.length
            const decorations = matches.map((match, i) =>
              Decoration.inline(match.from, match.to, {
                class: i === activeIndex ? 'editor-search-match editor-search-active' : 'editor-search-match',
              }),
            )
            return DecorationSet.create(newState.doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return searchHighlightKey.getState(state)
          },
        },
      }),
    ]
  },
})
