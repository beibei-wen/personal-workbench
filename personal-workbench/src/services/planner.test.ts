import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createStandaloneTask,
  listOverduePlanItems,
  listPlanItems,
  reschedulePlanItem,
  setPlanItemStatus,
} from './planner'
import { convertQuickNote, createQuickNote } from './quickNotes'
import { DATABASE_NAME, clearAllData, db, repositories } from '../db/database'

describe('planner and quick notes', () => {
  beforeEach(async () => {
    await db.open()
    await clearAllData()
  })

  afterEach(async () => {
    db.close()
    await indexedDB.deleteDatabase(DATABASE_NAME)
  })

  it('creates, lists, completes, reopens and reschedules an independent task', async () => {
    const task = await createStandaloneTask({
      title: '写周报',
      plannedDate: '2026-09-23',
      priority: 'high',
    })

    let items = await listPlanItems('2026-09-23')
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toBe('写周报')

    await setPlanItemStatus(items[0], 'completed')
    items = await listPlanItems('2026-09-23')
    expect(items[0]?.status).toBe('completed')

    await setPlanItemStatus(items[0], 'pending')
    await reschedulePlanItem(items[0], '2026-09-24')
    expect(await listPlanItems('2026-09-23')).toHaveLength(0)
    expect(await listPlanItems('2026-09-24')).toHaveLength(1)
    expect(await repositories.standaloneTasks.get(task.id)).toMatchObject({
      status: 'pending',
      plannedDate: '2026-09-24',
    })
  })

  it('lists overdue items but excludes entertainment records', async () => {
    await createStandaloneTask({
      title: '逾期事项',
      plannedDate: '2026-09-22',
      priority: 'medium',
    })
    const game = await repositories.games.create({
      name: '测试游戏',
      platform: 'PC',
      status: 'playing',
      priority: 'low',
    })
    await repositories.playSessions.create({
      gameId: game.id,
      date: '2026-09-22',
      plannedDate: '2026-09-22',
      durationMinutes: 60,
      status: 'pending',
    })

    const overdue = await listOverduePlanItems('2026-09-23')
    expect(overdue.map((item) => item.title)).toEqual(['逾期事项'])
  })

  it('converts quick notes to today and to a specialist module', async () => {
    const todayNote = await createQuickNote('交水电费')
    await convertQuickNote(todayNote.id, 'today', '2026-09-23', 'high')
    expect(await listPlanItems('2026-09-23')).toHaveLength(1)
    expect((await repositories.quickNotes.get(todayNote.id))?.status).toBe(
      'converted',
    )

    const mediaNote = await createQuickNote('写一篇 JavaScript 文章')
    await convertQuickNote(mediaNote.id, 'self-media', '2026-09-23')
    expect(await repositories.selfMediaItems.list()).toHaveLength(1)
    expect(await listPlanItems('2026-09-23')).toHaveLength(2)
  })

  it('creates required parent records for consulting and learning conversions', async () => {
    const consultingNote = await createQuickNote('联系新客户')
    await convertQuickNote(
      consultingNote.id,
      'consulting',
      '2026-09-23',
    )
    expect(await repositories.consultingClients.list()).toHaveLength(1)
    expect(await repositories.consultingProjects.list()).toHaveLength(1)
    expect(await repositories.consultingActions.list()).toHaveLength(1)

    const learningNote = await createQuickNote('学习 TypeScript 泛型')
    await convertQuickNote(learningNote.id, 'learning', '2026-09-23')
    expect(await repositories.learningItems.list()).toHaveLength(1)
    expect(await repositories.learningSessions.list()).toHaveLength(1)
  })
})
