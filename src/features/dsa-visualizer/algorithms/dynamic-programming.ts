import { buildSteps } from '../types/utils'
import type { DpTableState } from '../types/states'

function dpState(
  table: (number | string | null)[][],
  extra: Partial<DpTableState> = {},
): DpTableState {
  return { type: 'dp-table', table, ...extra }
}

export function generateDpFibonacci() {
  const n = 6
  const steps = [{ title: 'Init', description: 'dp[0]=0, dp[1]=1', state: dpState([[0], [1]], { colLabels: ['n'], rowLabels: ['dp'] }) }]

  const dpArr = [0, 1]
  for (let i = 2; i <= n; i++) {
    dpArr[i] = dpArr[i - 1] + dpArr[i - 2]
    steps.push({
      title: `dp[${i}]`,
      description: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dpArr[i]}`,
      state: dpState([dpArr.slice()], {
        colLabels: dpArr.map((_, i) => String(i)),
        rowLabels: ['dp'],
        highlightCell: [0, i],
        filledCells: dpArr.map((_, i) => [0, i] as [number, number]),
      }),
    })
  }
  return buildSteps(steps)
}

export function generateClimbingStairs() {
  const n = 5
  const dpArr = [0, 1, 2]
  const steps = [
    { title: 'Base Cases', description: '1 way for 1 stair, 2 ways for 2 stairs', state: dpState([[1, 2]], { colLabels: ['1', '2'], rowLabels: ['ways'] }) },
  ]
  for (let i = 3; i <= n; i++) {
    dpArr[i] = dpArr[i - 1] + dpArr[i - 2]
    const row = Array.from({ length: n }, (_, j) => (j < i ? dpArr[j + 1] : null))
    steps.push({
      title: `n=${i}`,
      description: `ways(${i}) = ways(${i - 1}) + ways(${i - 2}) = ${dpArr[i]}`,
      state: dpState([row], {
        colLabels: Array.from({ length: n }, (_, i) => String(i + 1)),
        rowLabels: ['ways'],
        highlightCell: [0, i - 1],
      }),
    })
  }
  return buildSteps(steps)
}

export function generateCoinChange() {
  const coins = [1, 2, 5]
  const amount = 7
  const dpArr = Array(amount + 1).fill(Infinity)
  dpArr[0] = 0
  const steps = [{ title: 'Init', description: 'dp[0]=0, rest=∞', state: dpState([dpArr.map((v) => (v === Infinity ? '∞' : v))], { colLabels: Array.from({ length: amount + 1 }, (_, i) => String(i)), rowLabels: ['dp'] }) }]

  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dpArr[i] = Math.min(dpArr[i], dpArr[i - coin] + 1)
      steps.push({
        title: `Coin ${coin}, amount ${i}`,
        description: `dp[${i}] = min(dp[${i}], dp[${i - coin}]+1) = ${dpArr[i]}`,
        state: dpState([dpArr.map((v) => (v === Infinity ? '∞' : v))], {
          colLabels: Array.from({ length: amount + 1 }, (_, i) => String(i)),
          rowLabels: ['dp'],
          highlightCell: [0, i],
          filledCells: [[0, i]],
        }),
      })
    }
  }
  return buildSteps(steps)
}

export function generateKnapsack() {
  const weights = [1, 3, 4]
  const values = [15, 20, 30]
  const capacity = 4
  const dp: number[][] = Array.from({ length: weights.length + 1 }, () => Array(capacity + 1).fill(0))
  const steps = [{ title: 'Init', description: '0-1 knapsack DP table', state: dpState(dp, { rowLabels: ['', ...weights.map((w, i) => `i${i}(w=${w})`)], colLabels: Array.from({ length: capacity + 1 }, (_, i) => String(i)) }) }]

  for (let i = 1; i <= weights.length; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1])
      } else {
        dp[i][w] = dp[i - 1][w]
      }
      steps.push({
        title: `Item ${i - 1}, cap ${w}`,
        description: `dp[${i}][${w}] = ${dp[i][w]}`,
        state: dpState(dp.map((r) => [...r]), {
          rowLabels: ['', ...weights.map((wt, idx) => `i${idx}(w=${wt})`)],
          colLabels: Array.from({ length: capacity + 1 }, (_, i) => String(i)),
          highlightCell: [i, w],
        }),
      })
    }
  }
  return buildSteps(steps)
}

export function generateLCS() {
  const s1 = 'ABCD'
  const s2 = 'AEDF'
  const m = s1.length
  const n = s2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  const steps = [{ title: 'Init', description: `LCS("${s1}", "${s2}")`, state: dpState(dp, { rowLabels: ['', ...s1.split('')], colLabels: ['', ...s2.split('')] }) }]

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
      steps.push({
        title: `Compare ${s1[i - 1]} vs ${s2[j - 1]}`,
        description: `dp[${i}][${j}] = ${dp[i][j]}`,
        state: dpState(dp.map((r) => [...r]), {
          rowLabels: ['', ...s1.split('')],
          colLabels: ['', ...s2.split('')],
          highlightCell: [i, j],
        }),
      })
    }
  }
  return buildSteps(steps)
}
