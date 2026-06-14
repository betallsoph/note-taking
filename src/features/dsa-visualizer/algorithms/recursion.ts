import { buildSteps } from '../types/utils'
import type { RecursionTreeState, RecursionNode } from '../types/states'

function recState(
  nodes: RecursionNode[],
  rootId: string,
  callStack?: string[],
): RecursionTreeState {
  return { type: 'recursion-tree', nodes, rootId, callStack }
}

export function generateFactorial() {
  const nodes: RecursionNode[] = [
    { id: 'f4', label: 'fact(4)', children: ['f3'], status: 'active' },
    { id: 'f3', label: 'fact(3)', children: ['f2'], status: 'pending' },
    { id: 'f2', label: 'fact(2)', children: ['f1'], status: 'pending' },
    { id: 'f1', label: 'fact(1)', children: [], status: 'pending' },
  ]
  return buildSteps([
    { title: 'fact(4)', description: 'Call factorial(4)', state: recState(nodes, 'f4', ['fact(4)']) },
    { title: 'Recurse', description: '4 * fact(3)', state: recState(nodes.map((n) => n.id === 'f4' ? { ...n, status: 'active' as const } : n.id === 'f3' ? { ...n, status: 'active' as const } : n), 'f4', ['fact(4)', 'fact(3)']) },
    { title: 'Base Case', description: 'fact(1) = 1', state: recState(nodes.map((n) => n.id === 'f1' ? { ...n, status: 'base' as const, result: 1 } : n), 'f4', ['fact(4)', 'fact(3)', 'fact(2)', 'fact(1)']) },
    { title: 'Unwind', description: 'fact(2)=2, fact(3)=6, fact(4)=24', state: recState(nodes.map((n) => ({
      ...n,
      status: 'returning' as const,
      result: n.id === 'f1' ? 1 : n.id === 'f2' ? 2 : n.id === 'f3' ? 6 : 24,
    })), 'f4') },
  ])
}

export function generateFibonacci() {
  const nodes: RecursionNode[] = [
    { id: 'f5', label: 'fib(5)', children: ['f4', 'f3'], status: 'active' },
    { id: 'f4', label: 'fib(4)', children: ['f3b', 'f2a'], status: 'pending' },
    { id: 'f3', label: 'fib(3)', children: ['f2b', 'f1a'], status: 'pending' },
    { id: 'f3b', label: 'fib(3)', children: [], status: 'pending' },
    { id: 'f2a', label: 'fib(2)', children: [], status: 'pending' },
    { id: 'f2b', label: 'fib(2)', children: [], status: 'pending' },
    { id: 'f1a', label: 'fib(1)', children: [], status: 'pending' },
  ]
  return buildSteps([
    { title: 'fib(5)', description: 'fib(n) = fib(n-1) + fib(n-2)', state: recState(nodes, 'f5', ['fib(5)']) },
    { title: 'Branch Left', description: 'Compute fib(4)', state: recState(nodes.map((n) => n.id === 'f4' ? { ...n, status: 'active' as const } : n), 'f5', ['fib(5)', 'fib(4)']) },
    { title: 'Branch Right', description: 'Compute fib(3)', state: recState(nodes.map((n) => n.id === 'f3' ? { ...n, status: 'active' as const } : n), 'f5', ['fib(5)', 'fib(3)']) },
    { title: 'Base Cases', description: 'fib(1)=1, fib(0)=0', state: recState(nodes.map((n) => n.label.includes('fib(1)') ? { ...n, status: 'base' as const, result: 1 } : n), 'f5') },
    { title: 'Combine', description: 'fib(5) = 3 + 2 = 5', state: recState(nodes.map((n) => ({ ...n, status: 'returning' as const, result: n.id === 'f5' ? 5 : undefined })), 'f5') },
  ])
}

export function generateTowerOfHanoi() {
  const nodes: RecursionNode[] = [
    { id: 'h3', label: 'hanoi(3,A,C)', children: ['h2a', 'h2b'], status: 'active' },
    { id: 'h2a', label: 'hanoi(2,A,B)', children: [], status: 'pending' },
    { id: 'h2b', label: 'hanoi(2,B,C)', children: [], status: 'pending' },
  ]
  return buildSteps([
    { title: 'hanoi(3)', description: 'Move 3 disks from A to C via B', state: recState(nodes, 'h3', ['hanoi(3,A,C)']) },
    { title: 'Move n-1 to aux', description: 'hanoi(2, A, B, C)', state: recState(nodes.map((n) => n.id === 'h2a' ? { ...n, status: 'active' as const } : n), 'h3', ['hanoi(3,A,C)', 'hanoi(2,A,B)']) },
    { title: 'Move disk', description: 'Move disk 3 from A to C', state: recState(nodes, 'h3', ['move disk 3']) },
    { title: 'Move n-1 to target', description: 'hanoi(2, B, C, A)', state: recState(nodes.map((n) => n.id === 'h2b' ? { ...n, status: 'active' as const } : n), 'h3', ['hanoi(2,B,C)']) },
    { title: 'Complete', description: 'All disks moved (7 moves total)', state: recState(nodes.map((n) => ({ ...n, status: 'returning' as const })), 'h3') },
  ])
}
