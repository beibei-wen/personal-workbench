import { z } from 'zod'
import { db, SCHEMA_VERSION, verifyLocalStorage } from '../db/database'

export const BACKUP_APP_ID = 'personal-workbench'
export const APP_VERSION = '0.1.0'

const backupSchema = z.object({
  appId: z.literal(BACKUP_APP_ID),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string().min(1),
  appVersion: z.string().min(1),
  counts: z.record(z.string(), z.number().int().nonnegative()),
  data: z.record(
    z.string(),
    z.array(z.record(z.string(), z.unknown())),
  ),
})

export type BackupFile = z.infer<typeof backupSchema>

export async function createBackup(): Promise<BackupFile> {
  const data: BackupFile['data'] = {}
  const counts: BackupFile['counts'] = {}

  for (const table of db.tables) {
    const rows = await table.toArray()
    data[table.name] = rows as Record<string, unknown>[]
    counts[table.name] = rows.length
  }

  return {
    appId: BACKUP_APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    counts,
    data,
  }
}

export function parseBackup(value: unknown) {
  const result = backupSchema.safeParse(value)
  if (!result.success) {
    throw new Error(`备份文件结构无效：${result.error.issues[0]?.message ?? '未知错误'}`)
  }

  const backup = result.data
  const tableNames = new Set(db.tables.map((table) => table.name))

  for (const [tableName, count] of Object.entries(backup.counts)) {
    if (!tableNames.has(tableName)) {
      throw new Error(`备份包含未知数据表：${tableName}`)
    }
    if ((backup.data[tableName]?.length ?? 0) !== count) {
      throw new Error(`备份记录数量不一致：${tableName}`)
    }
  }

  for (const table of db.tables) {
    if (!(table.name in backup.data)) {
      throw new Error(`备份缺少数据表：${table.name}`)
    }
  }

  if (backup.schemaVersion > SCHEMA_VERSION) {
    throw new Error('备份来自更高版本，当前应用无法恢复')
  }

  return backup
}

export async function parseBackupText(text: string) {
  let value: unknown

  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('备份文件不是有效的 JSON')
  }

  return parseBackup(value)
}

export async function restoreBackup(value: unknown) {
  const backup = parseBackup(value)

  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
      const rows = backup.data[table.name] ?? []
      if (rows.length > 0) {
        await table.bulkAdd(rows)
      }
    }
  })

  await verifyLocalStorage()
  return backup
}

export function downloadBackup(backup: BackupFile) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const timestamp = backup.exportedAt
    .replaceAll(':', '-')
    .replaceAll('.', '-')
  link.href = url
  link.download = `personal-workbench-backup-${timestamp}.json`
  link.click()
  URL.revokeObjectURL(url)
  return link.download
}
