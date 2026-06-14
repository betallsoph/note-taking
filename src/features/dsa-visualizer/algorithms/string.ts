import { buildSteps } from '../types/utils'
import type { StringMatchState } from '../types/states'

function sm(extra: Partial<StringMatchState> & Pick<StringMatchState, 'text' | 'pattern'>): StringMatchState {
  return {
    type: 'string-match',
    textIndex: 0,
    patternIndex: 0,
    ...extra,
  }
}

function computeLPS(pattern: string): number[] {
  const lps = Array(pattern.length).fill(0)
  let len = 0
  let i = 1
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++
      lps[i] = len
      i++
    } else if (len > 0) {
      len = lps[len - 1]
    } else {
      lps[i] = 0
      i++
    }
  }
  return lps
}

export function generateKMP() {
  const text = 'ABABDABACDABABCABAB'
  const pattern = 'ABABCABAB'
  const lps = computeLPS(pattern)
  const steps = [
    { title: 'Compute LPS', description: 'Longest proper prefix which is also suffix', state: sm({ text, pattern, lps }) },
  ]

  let i = 0
  let j = 0
  const matches: number[] = []

  while (i < text.length) {
    steps.push({
      title: `Compare text[${i}] vs pat[${j}]`,
      description: `text[${i}]='${text[i]}' pattern[${j}]='${pattern[j]}'`,
      state: sm({
        text,
        pattern,
        textIndex: i,
        patternIndex: j,
        lps,
        highlights: [
          { start: i, end: i + 1, target: 'text' },
          { start: j, end: j + 1, target: 'pattern' },
        ],
      }),
    })

    if (text[i] === pattern[j]) {
      i++
      j++
      if (j === pattern.length) {
        matches.push(i - j)
        steps.push({
          title: 'Match found',
          description: `Pattern found at index ${i - j}`,
          state: sm({ text, pattern, textIndex: i, patternIndex: j, lps, matches: [...matches] }),
        })
        j = lps[j - 1]
      }
    } else if (j > 0) {
      j = lps[j - 1]
      steps.push({
        title: 'Mismatch',
        description: `Shift pattern using LPS[${j}]`,
        state: sm({ text, pattern, textIndex: i, patternIndex: j, lps }),
      })
    } else {
      i++
    }
    if (steps.length > 15) break
  }
  return buildSteps(steps)
}

export function generateRabinKarp() {
  const text = 'AABAACAADAABAABA'
  const pattern = 'AABA'
  const d = 256
  const q = 101
  const m = pattern.length
  const steps = [{ title: 'Init', description: `Rolling hash search for "${pattern}"`, state: sm({ text, pattern }) }]

  let patternHash = 0
  let windowHash = 0
  let h = 1
  for (let i = 0; i < m - 1; i++) h = (h * d) % q

  for (let i = 0; i < m; i++) {
    patternHash = (d * patternHash + pattern.charCodeAt(i)) % q
    windowHash = (d * windowHash + text.charCodeAt(i)) % q
  }

  const matches: number[] = []
  for (let i = 0; i <= text.length - m; i++) {
    steps.push({
      title: `Window at ${i}`,
      description: `Hash = ${windowHash}, compare with pattern hash ${patternHash}`,
      state: sm({
        text,
        pattern,
        textIndex: i,
        patternIndex: 0,
        hash: windowHash,
        highlights: [{ start: i, end: i + m, target: 'text' }],
      }),
    })

    if (windowHash === patternHash && text.slice(i, i + m) === pattern) {
      matches.push(i)
      steps.push({
        title: 'Hash match',
        description: `Verify and confirm match at ${i}`,
        state: sm({ text, pattern, textIndex: i, hash: windowHash, matches: [...matches], highlights: [{ start: i, end: i + m, target: 'text' }] }),
      })
    }

    if (i < text.length - m) {
      windowHash = (d * (windowHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q
      if (windowHash < 0) windowHash += q
    }
    if (steps.length > 12) break
  }
  return buildSteps(steps)
}
