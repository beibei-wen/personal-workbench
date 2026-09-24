import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DATABASE_NAME,
  db,
  repositories,
  verifyLocalStorage,
} from './database'

describe('local database foundation', () => {
  beforeEach(async () => {
    await db.open()
  })

  afterEach(async () => {
    db.close()
    await indexedDB.deleteDatabase(DATABASE_NAME)
  })

  it('persists metadata after closing and reopening the database', async () => {
    const created = await verifyLocalStorage()
    expect(created.schemaVersion).toBe(1)

    db.close()
    await db.open()

    const loaded = await db.meta.get('app')
    expect(loaded?.id).toBe('app')
    expect(loaded?.createdAt).toBe(created.createdAt)
  })

  it('does not replace the original creation time on repeat initialization', async () => {
    const first = await verifyLocalStorage()
    const second = await verifyLocalStorage()

    expect(second.createdAt).toBe(first.createdAt)
    expect(second.updatedAt >= first.updatedAt).toBe(true)
  })

  it('creates the complete first-version schema', () => {
    expect(db.tables.map((table) => table.name).sort()).toEqual(
      [
        'meta',
        'quickNotes',
        'standaloneTasks',
        'selfMediaItems',
        'selfMediaMetrics',
        'devProjects',
        'devItems',
        'workLogs',
        'consultingClients',
        'consultingProjects',
        'consultingMeetings',
        'consultingActions',
        'consultingTimeEntries',
        'fitnessPlans',
        'workoutSessions',
        'workoutEntries',
        'bodyMetrics',
        'mealPlans',
        'mealLogs',
        'waterLogs',
        'shoppingItems',
        'games',
        'playSessions',
        'dataDesignProjects',
        'dataDesignDeliverables',
        'learningItems',
        'learningSessions',
        'learningNotes',
      ].sort(),
    )
  })

  it('supports create, update, list and delete through repositories', async () => {
    const note = await repositories.quickNotes.create({
      text: 'test note',
      status: 'open',
    })

    expect((await repositories.quickNotes.get(note.id))?.text).toBe('test note')

    await repositories.quickNotes.update(note.id, { status: 'processed' })
    expect((await repositories.quickNotes.get(note.id))?.status).toBe(
      'processed',
    )

    expect(await repositories.quickNotes.list()).toHaveLength(1)
    await repositories.quickNotes.remove(note.id)
    expect(await repositories.quickNotes.list()).toHaveLength(0)
  })
})
