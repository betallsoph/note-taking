import { buildSteps } from '../types/utils'
import type { ArrayState } from '../types/states'

function arrayState(
  values: (number | string)[],
  extra: Partial<ArrayState> = {},
): ArrayState {
  return { type: 'array', values, ...extra }
}

export function generateArrayAccess() {
  const arr = [10, 25, 30, 45, 50]
  const index = 2
  return buildSteps([
    { title: 'Initial Array', description: `Array: [${arr.join(', ')}]`, state: arrayState([...arr]) },
    { title: 'Access Operation', description: `Accessing index ${index}`, state: arrayState([...arr], { highlights: [index], pointers: [{ label: 'i', index }] }) },
    { title: 'Result', description: `arr[${index}] = ${arr[index]}`, state: arrayState([...arr], { highlights: [index], pointers: [{ label: 'i', index }] }) },
  ])
}

export function generateArrayUpdate() {
  const arr = [10, 25, 30, 45, 50]
  const index = 1
  const newVal = 20
  return buildSteps([
    { title: 'Initial Array', description: `Array: [${arr.join(', ')}]`, state: arrayState([...arr]) },
    { title: 'Update', description: `Updating index ${index}`, state: arrayState([...arr], { highlights: [index] }) },
    { title: 'New Value', description: `arr[${index}] = ${newVal}`, state: arrayState(arr.map((v, i) => (i === index ? newVal : v)), { highlights: [index] }) },
  ])
}

export function generateArrayInsert() {
  const arr = [10, 25, 45, 50]
  const index = 2
  const value = 30
  const shifted = [...arr.slice(0, index), value, ...arr.slice(index)]
  return buildSteps([
    { title: 'Initial Array', description: `Array: [${arr.join(', ')}]`, state: arrayState([...arr]) },
    { title: 'Shift Elements', description: `Shifting elements from index ${index} right`, state: arrayState([...arr], { highlights: [index, index + 1] }) },
    { title: 'Insert', description: `Insert ${value} at index ${index}`, state: arrayState(shifted, { highlights: [index] }) },
  ])
}

export function generateArrayDelete() {
  const arr = [10, 25, 30, 45, 50]
  const index = 3
  const result = arr.filter((_, i) => i !== index)
  return buildSteps([
    { title: 'Initial Array', description: `Array: [${arr.join(', ')}]`, state: arrayState([...arr]) },
    { title: 'Mark for Delete', description: `Deleting element at index ${index} (value ${arr[index]})`, state: arrayState([...arr], { highlights: [index] }) },
    { title: 'Shift Left', description: 'Shifting elements left to fill gap', state: arrayState([...arr.slice(0, index), null as unknown as number, ...arr.slice(index + 1)], { highlights: [index] }) },
    { title: 'Result', description: `Array after delete: [${result.join(', ')}]`, state: arrayState(result) },
  ])
}

export function generateArraySearch() {
  const arr = [10, 25, 30, 45, 50]
  const target = 30
  const steps = [{ title: 'Initial Array', description: `Searching for ${target}`, state: arrayState([...arr]) }]
  for (let i = 0; i < arr.length; i++) {
    steps.push({
      title: `Check index ${i}`,
      description: arr[i] === target ? `Found ${target} at index ${i}` : `arr[${i}]=${arr[i]} ≠ ${target}`,
      state: arrayState([...arr], {
        highlights: [i],
        pointers: [{ label: 'i', index: i }],
      }),
    })
    if (arr[i] === target) break
  }
  return buildSteps(steps)
}
