import { buildSteps } from '../types/utils'
import type { StackState } from '../types/states'

function stackState(items: number[], highlightIndex?: number): StackState {
  return { type: 'stack', items, highlightIndex }
}

export function generateStackPush() {
  const items = [10, 20]
  return buildSteps([
    { title: 'Initial Stack', description: 'Stack: bottom to top', state: stackState([...items]) },
    { title: 'Push 30', description: 'Push 30 onto stack', state: stackState([...items, 30], items.length) },
    { title: 'Push 40', description: 'Push 40 onto stack', state: stackState([...items, 30, 40], items.length + 1) },
  ])
}

export function generateStackPop() {
  const items = [10, 20, 30, 40]
  return buildSteps([
    { title: 'Initial Stack', description: `Top element is ${items[items.length - 1]}`, state: stackState([...items], items.length - 1) },
    { title: 'Pop', description: `Removing ${items[items.length - 1]} from top`, state: stackState([...items], items.length - 1) },
    { title: 'After Pop', description: `New top is ${items[items.length - 2]}`, state: stackState(items.slice(0, -1), items.length - 2) },
  ])
}

export function generateStackPeek() {
  const items = [10, 20, 30]
  return buildSteps([
    { title: 'Stack State', description: 'Current stack contents', state: stackState([...items]) },
    { title: 'Peek', description: `Peeking top element: ${items[items.length - 1]}`, state: stackState([...items], items.length - 1) },
    { title: 'Unchanged', description: 'Stack remains unchanged after peek', state: stackState([...items], items.length - 1) },
  ])
}
