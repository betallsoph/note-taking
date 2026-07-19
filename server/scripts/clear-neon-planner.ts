import 'dotenv/config'
import { clearNeonPlannerIfAtlasPrimary } from '../db/bootstrap-schema.js'
import { resolvePlannerStoreMode } from '../db/planner-config.js'
import { isDatabaseEnabled } from '../db/index.js'

async function main() {
  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL is required.')
    process.exit(1)
  }

  const mode = resolvePlannerStoreMode()
  if (mode !== 'atlas') {
    console.error(
      `Refusing to clear Neon planner while PLANNER_STORE mode is "${mode}". Set PLANNER_STORE=atlas first.`,
    )
    process.exit(1)
  }

  const deleted = await clearNeonPlannerIfAtlasPrimary()
  console.log(deleted > 0 ? `Deleted ${deleted} planner row(s) from Neon.` : 'Neon planner_items was already empty.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
