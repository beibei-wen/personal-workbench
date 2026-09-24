import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BACKUP_APP_ID,
  createBackup,
  parseBackup,
  parseBackupText,
  restoreBackup,
} from './backup'
import { DATABASE_NAME, clearAllData, db, repositories } from '../db/database'

describe('backup service', () => {
  beforeEach(async () => {
    await db.open()
    await clearAllData()
  })

  afterEach(async () => {
    db.close()
    await indexedDB.deleteDatabase(DATABASE_NAME)
  })

  it('exports every table and restores the exact records', async () => {
    const note = await repositories.quickNotes.create({
      text: '需要备份的备忘',
      status: 'open',
    })

    const backup = await createBackup()
    expect(backup.appId).toBe(BACKUP_APP_ID)
    expect(backup.counts.quickNotes).toBe(1)
    expect(backup.data.quickNotes[0]?.text).toBe('需要备份的备忘')
    expect(db.tables.every((table) => table.name in backup.data)).toBe(true)

    await clearAllData()
    expect(await repositories.quickNotes.list()).toHaveLength(0)

    await restoreBackup(backup)
    expect((await repositories.quickNotes.get(note.id))?.text).toBe(
      '需要备份的备忘',
    )
  })

  it('rejects a backup for another application without touching data', async () => {
    await repositories.quickNotes.create({
      text: '保留现有数据',
      status: 'open',
    })

    const backup = await createBackup()
    const invalid = { ...backup, appId: 'another-app' }

    expect(() => parseBackup(invalid)).toThrow('备份文件结构无效')
    await expect(restoreBackup(invalid)).rejects.toThrow()
    expect(await repositories.quickNotes.list()).toHaveLength(1)
  })

  it('rejects count mismatches and invalid JSON', async () => {
    const backup = await createBackup()
    backup.counts.quickNotes = 1

    expect(() => parseBackup(backup)).toThrow('备份记录数量不一致')
    await expect(parseBackupText('{broken')).rejects.toThrow(
      '备份文件不是有效的 JSON',
    )
  })
})
