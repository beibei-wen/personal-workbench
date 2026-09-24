import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDashboardSummaries } from './dashboard'
import { DATABASE_NAME, clearAllData, db, repositories } from '../db/database'

describe('dashboard summaries', () => {
  beforeEach(async () => {
    await db.open()
    await clearAllData()
  })

  afterEach(async () => {
    db.close()
    await indexedDB.deleteDatabase(DATABASE_NAME)
  })

  it('returns all module cards and prioritizes actionable records', async () => {
    await repositories.devProjects.create({
      name: '测试项目',
      status: 'active',
    })
    const project = await db.devProjects.toCollection().first()
    await repositories.devItems.create({
      projectId: project!.id,
      title: '修复阻塞',
      type: 'bug',
      priority: 'high',
      status: 'blocked',
      plannedDate: '2026-09-23',
    })
    await repositories.games.create({
      name: '当前游戏',
      platform: 'PC',
      status: 'playing',
      priority: 'medium',
    })

    const summaries = await getDashboardSummaries('2026-09-23')
    expect(summaries).toHaveLength(8)
    expect(
      summaries.find((item) => item.module === '开发工作')?.items[0]?.title,
    ).toBe('修复阻塞')
    expect(
      summaries.find((item) => item.module === '游戏娱乐')?.items[0]?.title,
    ).toBe('当前游戏')
  })

  it('returns neutral empty summaries when no records exist', async () => {
    const summaries = await getDashboardSummaries('2026-09-23')
    expect(summaries.every((item) => item.items.length === 0)).toBe(true)
    expect(summaries.every((item) => item.tone === 'neutral')).toBe(true)
  })
})
