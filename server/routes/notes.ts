import { Router } from 'express'
import {
  activeNotesStore,
  createNoteAnywhere,
  deleteNoteAnywhere,
  getNoteAnywhere,
  listNotesAnywhere,
  notesErrorMessage,
  updateNoteAnywhere,
} from '../db/notes-store.js'
import { queryParam } from './params.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const items = await listNotesAnywhere(req.user.id, {
      search: queryParam(req.query.search),
      pinned: queryParam(req.query.pinned),
      tag: queryParam(req.query.tag),
      archived: queryParam(req.query.archived),
    })
    res.json(items)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const note = await getNoteAnywhere(req.user.id, req.params.id)
    if (!note) return res.status(404).json({ error: 'Not found' })
    res.json(note)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res) => {
  try {
    const note = await createNoteAnywhere(req.user.id, req.body)
    res.status(201).json(note)
  } catch (error) {
    console.error('Create note failed:', error)
    res.status(500).json({ error: notesErrorMessage(error, 'Failed to create note') })
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const note = await updateNoteAnywhere(req.user.id, req.params.id, req.body)
    if (!note) return res.status(404).json({ error: 'Not found' })
    res.json(note)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteNoteAnywhere(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router

export { activeNotesStore }
