import { buildSteps } from '../types/utils'
import type { QueueState } from '../types/states'

function queueState(items: number[], highlightIndex?: number, operation?: 'enqueue' | 'dequeue'): QueueState {
  return { type: 'queue', items, highlightIndex, operation }
}

export function generateQueueEnqueue() {
  const items = [10, 20]
  return buildSteps([
    { title: 'Initial Queue', description: 'Front to rear', state: queueState([...items]) },
    { title: 'Enqueue 30', description: 'Add 30 to rear', state: queueState([...items, 30], items.length, 'enqueue') },
    { title: 'Enqueue 40', description: 'Add 40 to rear', state: queueState([...items, 30, 40], items.length + 1, 'enqueue') },
  ])
}

export function generateQueueDequeue() {
  const items = [10, 20, 30]
  return buildSteps([
    { title: 'Initial Queue', description: `Front element is ${items[0]}`, state: queueState([...items], 0) },
    { title: 'Dequeue', description: `Removing ${items[0]} from front`, state: queueState([...items], 0, 'dequeue') },
    { title: 'After Dequeue', description: `New front is ${items[1]}`, state: queueState(items.slice(1), 0) },
  ])
}
