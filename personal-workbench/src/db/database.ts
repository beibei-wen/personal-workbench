import Dexie, { type EntityTable } from 'dexie'
import type {
  BodyMetric,
  ConsultingAction,
  ConsultingClient,
  ConsultingMeeting,
  ConsultingProject,
  ConsultingTimeEntry,
  DataDesignDeliverable,
  DataDesignProject,
  DevItem,
  DevProject,
  FitnessPlan,
  Game,
  LearningItem,
  LearningNote,
  LearningSession,
  MealLog,
  MealPlan,
  PlaySession,
  QuickNote,
  SelfMediaItem,
  SelfMediaMetric,
  ShoppingItem,
  StandaloneTask,
  WaterLog,
  WorkLog,
  WorkoutEntry,
  WorkoutSession,
} from '../domain/types'
import { LocalRepository } from './repository'

export const DATABASE_NAME = 'personal-workbench'
export const SCHEMA_VERSION = 1

export type MetaRecord = {
  id: string
  schemaVersion: number
  createdAt: string
  updatedAt: string
}

export class WorkbenchDatabase extends Dexie {
  meta!: EntityTable<MetaRecord, 'id'>
  quickNotes!: EntityTable<QuickNote, 'id'>
  standaloneTasks!: EntityTable<StandaloneTask, 'id'>
  selfMediaItems!: EntityTable<SelfMediaItem, 'id'>
  selfMediaMetrics!: EntityTable<SelfMediaMetric, 'id'>
  devProjects!: EntityTable<DevProject, 'id'>
  devItems!: EntityTable<DevItem, 'id'>
  workLogs!: EntityTable<WorkLog, 'id'>
  consultingClients!: EntityTable<ConsultingClient, 'id'>
  consultingProjects!: EntityTable<ConsultingProject, 'id'>
  consultingMeetings!: EntityTable<ConsultingMeeting, 'id'>
  consultingActions!: EntityTable<ConsultingAction, 'id'>
  consultingTimeEntries!: EntityTable<ConsultingTimeEntry, 'id'>
  fitnessPlans!: EntityTable<FitnessPlan, 'id'>
  workoutSessions!: EntityTable<WorkoutSession, 'id'>
  workoutEntries!: EntityTable<WorkoutEntry, 'id'>
  bodyMetrics!: EntityTable<BodyMetric, 'id'>
  mealPlans!: EntityTable<MealPlan, 'id'>
  mealLogs!: EntityTable<MealLog, 'id'>
  waterLogs!: EntityTable<WaterLog, 'id'>
  shoppingItems!: EntityTable<ShoppingItem, 'id'>
  games!: EntityTable<Game, 'id'>
  playSessions!: EntityTable<PlaySession, 'id'>
  dataDesignProjects!: EntityTable<DataDesignProject, 'id'>
  dataDesignDeliverables!: EntityTable<DataDesignDeliverable, 'id'>
  learningItems!: EntityTable<LearningItem, 'id'>
  learningSessions!: EntityTable<LearningSession, 'id'>
  learningNotes!: EntityTable<LearningNote, 'id'>

  constructor() {
    super(DATABASE_NAME)
    this.version(SCHEMA_VERSION).stores({
      meta: 'id',
      quickNotes: 'id, status, createdAt',
      standaloneTasks: 'id, plannedDate, status, priority, updatedAt',
      selfMediaItems:
        'id, stage, platform, plannedPublishDate, plannedActionDate, actionStatus, updatedAt',
      selfMediaMetrics: 'id, itemId, date',
      devProjects: 'id, status',
      devItems:
        'id, projectId, status, type, dueDate, plannedDate, updatedAt',
      workLogs: 'id, projectId, itemId, date',
      consultingClients: 'id, status',
      consultingProjects: 'id, clientId, status',
      consultingMeetings: 'id, projectId, date',
      consultingActions:
        'id, projectId, meetingId, status, dueDate, plannedDate, updatedAt',
      consultingTimeEntries: 'id, projectId, date',
      fitnessPlans: 'id, dayOfWeek',
      workoutSessions: 'id, planId, date, plannedDate, status',
      workoutEntries: 'id, sessionId, exerciseName',
      bodyMetrics: 'id, date',
      mealPlans: 'id, date, mealType, status',
      mealLogs: 'id, date, mealType',
      waterLogs: 'id, date',
      shoppingItems: 'id, purchased, plannedDate',
      games: 'id, status, platform, updatedAt',
      playSessions: 'id, gameId, date, plannedDate',
      dataDesignProjects: 'id, type, status, priority, dueDate',
      dataDesignDeliverables: 'id, projectId, status',
      learningItems: 'id, type, status, nextReviewDate',
      learningSessions: 'id, itemId, date, plannedDate, status',
      learningNotes: 'id, itemId, reviewStatus, reviewDate',
    })
  }
}

export const db = new WorkbenchDatabase()

export const repositories = {
  quickNotes: new LocalRepository(db.quickNotes),
  standaloneTasks: new LocalRepository(db.standaloneTasks),
  selfMediaItems: new LocalRepository(db.selfMediaItems),
  selfMediaMetrics: new LocalRepository(db.selfMediaMetrics),
  devProjects: new LocalRepository(db.devProjects),
  devItems: new LocalRepository(db.devItems),
  workLogs: new LocalRepository(db.workLogs),
  consultingClients: new LocalRepository(db.consultingClients),
  consultingProjects: new LocalRepository(db.consultingProjects),
  consultingMeetings: new LocalRepository(db.consultingMeetings),
  consultingActions: new LocalRepository(db.consultingActions),
  consultingTimeEntries: new LocalRepository(db.consultingTimeEntries),
  fitnessPlans: new LocalRepository(db.fitnessPlans),
  workoutSessions: new LocalRepository(db.workoutSessions),
  workoutEntries: new LocalRepository(db.workoutEntries),
  bodyMetrics: new LocalRepository(db.bodyMetrics),
  mealPlans: new LocalRepository(db.mealPlans),
  mealLogs: new LocalRepository(db.mealLogs),
  waterLogs: new LocalRepository(db.waterLogs),
  shoppingItems: new LocalRepository(db.shoppingItems),
  games: new LocalRepository(db.games),
  playSessions: new LocalRepository(db.playSessions),
  dataDesignProjects: new LocalRepository(db.dataDesignProjects),
  dataDesignDeliverables: new LocalRepository(db.dataDesignDeliverables),
  learningItems: new LocalRepository(db.learningItems),
  learningSessions: new LocalRepository(db.learningSessions),
  learningNotes: new LocalRepository(db.learningNotes),
}

export async function verifyLocalStorage() {
  const now = new Date().toISOString()
  const existing = await db.meta.get('app')

  if (existing) {
    await db.meta.update('app', { updatedAt: now })
    return existing
  }

  const record: MetaRecord = {
    id: 'app',
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  }
  await db.meta.put(record)
  return record
}

export async function clearAllData() {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
    }
  })
  await verifyLocalStorage()
}
