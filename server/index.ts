import 'dotenv/config'
import app from './app.js'
import { databaseMode } from './db/index.js'

const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT} (${databaseMode})`)
})
