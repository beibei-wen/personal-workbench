import type { InsertType, Table, UpdateSpec } from 'dexie'
import type { BaseRecord } from '../domain/types'

export type NewEntity<T extends BaseRecord> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
> &
  Partial<Pick<T, 'id' | 'createdAt' | 'updatedAt'>>

export class LocalRepository<T extends BaseRecord> {
  private readonly table: Table<T, string, InsertType<T, 'id'>>

  constructor(table: Table<T, string, InsertType<T, 'id'>>) {
    this.table = table
  }

  async list() {
    return this.table.toArray()
  }

  async get(id: string) {
    return this.table.get(id)
  }

  async create(input: NewEntity<T>) {
    const now = new Date().toISOString()
    const record = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      createdAt: input.createdAt ?? now,
      updatedAt: now,
    } as T

    await this.table.add(record)
    return record
  }

  async update(id: string, changes: Partial<T>) {
    const updatedAt = new Date().toISOString()
    await this.table.update(id, {
      ...changes,
      id,
      updatedAt,
    } as UpdateSpec<InsertType<T, 'id'>>)
    return this.get(id)
  }

  async remove(id: string) {
    await this.table.delete(id)
  }

  async clear() {
    await this.table.clear()
  }
}
