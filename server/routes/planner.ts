import { Router } from 'express'
import {
  createPlannerItemAnywhere,
  deletePlannerItemAnywhere,
  getPlannerItemAnywhere,
  listPlannerItemsAnywhere,
  plannerErrorMessage,
  updatePlannerItemAnywhere,
} from '../db/planner-store.js'
import { queryParam } from './params.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const items = await listPlannerItemsAnywhere(req.user.id, {
      status: queryParam(req.query.status),
      horizon: queryParam(req.query.horizon),
      scope: queryParam(req.query.scope),
      project: queryParam(req.query.project),
      search: queryParam(req.query.search),
    })
    res.json(items)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const item = await getPlannerItemAnywhere(req.user.id, req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  if (!title) return res.status(400).json({ error: 'Title is required' })

  try {
    const item = await createPlannerItemAnywhere(req.user.id, { ...req.body, title })
    res.status(201).json(item)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    if (message.includes('required')) {
      return res.status(400).json({ error: message })
    }
    console.error('Create planner item failed:', error)
    res.status(500).json({ error: plannerErrorMessage(error, 'Failed to create planner item') })
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const item = await updatePlannerItemAnywhere(req.user.id, req.params.id, req.body)
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ error: error.message })
    }
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deletePlannerItemAnywhere(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
