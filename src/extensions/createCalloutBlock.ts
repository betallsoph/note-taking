import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { CalloutVariant } from '@/types/editor'
import { CalloutNodeView } from '@/components/editor/CalloutNodeViews'

interface CalloutOptions {
  variant: CalloutVariant
  defaultTitle: string
  markdownTag: string
}

const NODE_NAMES: Record<CalloutVariant, string> = {
  complexity: 'complexityBlock',
  'interview-tip': 'interviewTipBlock',
  warning: 'warningBlock',
  info: 'infoBlock',
}

export function createCalloutBlock({ variant, defaultTitle, markdownTag }: CalloutOptions) {
  return Node.create({
    name: NODE_NAMES[variant],
    group: 'block',
    content: variant === 'complexity' ? undefined : 'block+',
    atom: variant === 'complexity',
    draggable: true,

    addAttributes() {
      if (variant === 'complexity') {
        return {
          timeComplexity: { default: 'O(n)' },
          spaceComplexity: { default: 'O(1)' },
        }
      }
      return {
        title: { default: defaultTitle },
      }
    },

    parseHTML() {
      if (variant === 'complexity') {
        return [
          {
            tag: `div[data-callout="${variant}"]`,
            getAttrs: (el) => {
              const element = el as HTMLElement
              return {
                timeComplexity: element.getAttribute('data-time') ?? 'O(n)',
                spaceComplexity: element.getAttribute('data-space') ?? 'O(1)',
              }
            },
          },
        ]
      }
      return [
        {
          tag: `div[data-callout="${variant}"]`,
          getAttrs: (el) => ({
            title: (el as HTMLElement).getAttribute('data-title') ?? defaultTitle,
          }),
        },
      ]
    },

    renderHTML({ HTMLAttributes, node }) {
      if (variant === 'complexity') {
        return [
          'div',
          mergeAttributes(HTMLAttributes, {
            'data-callout': variant,
            'data-time': node.attrs.timeComplexity,
            'data-space': node.attrs.spaceComplexity,
          }),
        ]
      }
      return [
        'div',
        mergeAttributes(HTMLAttributes, {
          'data-callout': variant,
          'data-title': node.attrs.title,
        }),
        0,
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(CalloutNodeView)
    },

    addStorage() {
      return {
        markdown: {
          serialize(state: { write: (s: string) => void; closeBlock: (n: unknown) => void }, node: {
            attrs: Record<string, string>
            textContent: string
          }) {
            state.write(`::: ${markdownTag}\n`)
            if (variant === 'complexity') {
              state.write(`time: ${node.attrs.timeComplexity}\n`)
              state.write(`space: ${node.attrs.spaceComplexity}\n`)
            } else {
              state.write(`${node.textContent}\n`)
            }
            state.write(':::\n\n')
            state.closeBlock(node)
          },
          parse: {
            setup(markdownit: { block: { ruler: { before: (a: string, b: string, fn: () => void) => void } } }) {
              markdownit.block.ruler.before('fence', `callout_${variant}`, () => {
                // Parsed via HTML fallback in markdown-it when using custom blocks
                return false
              })
            },
          },
        },
      }
    },
  })
}
