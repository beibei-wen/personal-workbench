import { db, repositories } from '../db/database'
import type {
  ActionStatus,
  Priority,
} from '../domain/types'

export type PlanSourceModule =
  | 'standalone'
  | 'self-media'
  | 'development'
  | 'consulting'
  | 'fitness'
  | 'diet'
  | 'games'
  | 'data-design'
  | 'learning'

export type PlanItem = {
  id: string
  sourceModule: PlanSourceModule
  sourceId: string
  title: string
  plannedDate: string
  startTime?: string
  endTime?: string
  priority: Priority
  status: ActionStatus
  completedAt?: string
  route: string
  allowOverdue: boolean
}

export type PlanItemDraft = Omit<PlanItem, 'id' | 'route' | 'allowOverdue'> & {
  id?: string
  route?: string
  allowOverdue?: boolean
}

const priorityOrder: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function normalizedStatus(
  status: string | undefined,
  completedFallback = false,
): ActionStatus {
  if (completedFallback) {
    return 'completed'
  }
  if (status === 'in_progress' || status === 'completed') {
    return status
  }
  return 'pending'
}

async function loadPlannerCandidates(): Promise<PlanItem[]> {
  const [
    standalone,
    selfMedia,
    devItems,
    consultingActions,
    workoutSessions,
    mealPlans,
    shoppingItems,
    playSessions,
    dataProjects,
    learningSessions,
  ] = await Promise.all([
    db.standaloneTasks.toArray(),
    db.selfMediaItems.toArray(),
    db.devItems.toArray(),
    db.consultingActions.toArray(),
    db.workoutSessions.toArray(),
    db.mealPlans.toArray(),
    db.shoppingItems.toArray(),
    db.playSessions.toArray(),
    db.dataDesignProjects.toArray(),
    db.learningSessions.toArray(),
  ])

  return [
    ...standalone.map((item) => ({
      id: `standalone:${item.id}`,
      sourceModule: 'standalone' as const,
      sourceId: item.id,
      title: item.title,
      plannedDate: item.plannedDate,
      startTime: item.startTime,
      endTime: item.endTime,
      priority: item.priority,
      status: item.status,
      completedAt: item.completedAt,
      route: '/today',
      allowOverdue: true,
    })),
    ...selfMedia
      .filter((item) => item.plannedActionDate)
      .map((item) => ({
        id: `self-media:${item.id}`,
        sourceModule: 'self-media' as const,
        sourceId: item.id,
        title: item.actionTitle ?? item.title,
        plannedDate: item.plannedActionDate!,
        priority: item.priority,
        status: item.actionStatus,
        completedAt: item.completedAt,
        route: '/self-media',
        allowOverdue: true,
      })),
    ...devItems
      .filter((item) => item.plannedDate)
      .map((item) => ({
        id: `development:${item.id}`,
        sourceModule: 'development' as const,
        sourceId: item.id,
        title: item.title,
        plannedDate: item.plannedDate!,
        priority: item.priority,
        status: normalizedStatus(item.status),
        completedAt: item.completedAt,
        route: '/development',
        allowOverdue: true,
      })),
    ...consultingActions
      .filter((item) => item.plannedDate)
      .map((item) => ({
        id: `consulting:${item.id}`,
        sourceModule: 'consulting' as const,
        sourceId: item.id,
        title: item.title,
        plannedDate: item.plannedDate!,
        priority: 'medium' as const,
        status: item.status,
        completedAt: item.completedAt,
        route: '/consulting',
        allowOverdue: true,
      })),
    ...workoutSessions
      .filter((item) => item.plannedDate)
      .map((item) => ({
        id: `fitness:${item.id}`,
        sourceModule: 'fitness' as const,
        sourceId: item.id,
        title: item.title,
        plannedDate: item.plannedDate!,
        priority: 'medium' as const,
        status: normalizedStatus(item.status),
        completedAt: item.completedAt,
        route: '/fitness',
        allowOverdue: true,
      })),
    ...mealPlans.map((item) => ({
      id: `diet:${item.id}`,
      sourceModule: 'diet' as const,
      sourceId: item.id,
      title: `${item.mealType}：${item.plannedItems}`,
      plannedDate: item.date,
      priority: 'medium' as const,
      status: item.status,
      route: '/diet',
      allowOverdue: false,
    })),
    ...shoppingItems
      .filter((item) => item.plannedDate)
      .map((item) => ({
        id: `diet:${item.id}`,
        sourceModule: 'diet' as const,
        sourceId: item.id,
        title: `购买：${item.name}`,
        plannedDate: item.plannedDate!,
        priority: 'medium' as const,
        status: item.purchased
          ? ('completed' as const)
          : ('pending' as const),
        route: '/diet',
        allowOverdue: false,
      })),
    ...playSessions
      .filter((item) => item.plannedDate)
      .map((item) => ({
        id: `games:${item.id}`,
        sourceModule: 'games' as const,
        sourceId: item.id,
        title: item.progress ?? '游戏时间',
        plannedDate: item.plannedDate!,
        priority: 'low' as const,
        status: normalizedStatus(item.status),
        route: '/games',
        allowOverdue: false,
      })),
    ...dataProjects
      .filter((item) => item.plannedDate)
      .map((item) => ({
        id: `data-design:${item.id}`,
        sourceModule: 'data-design' as const,
        sourceId: item.id,
        title: item.nextAction ?? item.name,
        plannedDate: item.plannedDate!,
        priority: item.priority,
        status: normalizedStatus(
          item.status,
          item.status === 'completed',
        ),
        completedAt: item.completedAt,
        route: '/data-design',
        allowOverdue: true,
      })),
    ...learningSessions
      .filter((item) => item.plannedDate)
      .map((item) => ({
        id: `learning:${item.id}`,
        sourceModule: 'learning' as const,
        sourceId: item.id,
        title: item.note ?? '学习安排',
        plannedDate: item.plannedDate!,
        priority: 'medium' as const,
        status: item.status,
        completedAt: item.completedAt,
        route: '/learning',
        allowOverdue: true,
      })),
  ]
}

export async function listPlanItems(date: string) {
  const items = await loadPlannerCandidates()

  return items
    .filter((item) => item.plannedDate === date)
    .sort((left, right) => {
      const timeComparison = (left.startTime ?? '99:99').localeCompare(
        right.startTime ?? '99:99',
      )
      if (timeComparison !== 0) {
        return timeComparison
      }
      return priorityOrder[left.priority] - priorityOrder[right.priority]
    })
}

export async function listOverduePlanItems(date: string) {
  const items = await loadPlannerCandidates()

  return items
    .filter(
      (item) =>
        item.allowOverdue &&
        item.plannedDate < date &&
        item.status !== 'completed',
    )
    .sort((left, right) => left.plannedDate.localeCompare(right.plannedDate))
}

export async function createStandaloneTask(draft: {
  title: string
  notes?: string
  plannedDate: string
  startTime?: string
  endTime?: string
  priority: Priority
}) {
  return repositories.standaloneTasks.create({
    ...draft,
    status: 'pending',
  })
}

export async function updateStandaloneTask(
  id: string,
  changes: Partial<{
    title: string
    notes: string
    plannedDate: string
    startTime: string
    endTime: string
    priority: Priority
    status: ActionStatus
    completedAt?: string
  }>,
) {
  return repositories.standaloneTasks.update(id, changes)
}

export async function setPlanItemStatus(
  item: PlanItem,
  status: ActionStatus,
) {
  const completedAt =
    status === 'completed' ? new Date().toISOString() : undefined

  switch (item.sourceModule) {
    case 'standalone':
      return repositories.standaloneTasks.update(item.sourceId, {
        status,
        completedAt,
      })
    case 'self-media':
      return repositories.selfMediaItems.update(item.sourceId, {
        actionStatus: status,
        completedAt,
      })
    case 'development':
      return repositories.devItems.update(item.sourceId, {
        status,
        completedAt,
      })
    case 'consulting':
      return repositories.consultingActions.update(item.sourceId, {
        status,
        completedAt,
      })
    case 'fitness':
      return repositories.workoutSessions.update(item.sourceId, {
        status,
        completedAt,
      })
    case 'diet': {
      const shopping = await db.shoppingItems.get(item.sourceId)
      if (shopping) {
        return repositories.shoppingItems.update(item.sourceId, {
          purchased: status === 'completed',
        })
      }
      return repositories.mealPlans.update(item.sourceId, { status })
    }
    case 'games':
      return repositories.playSessions.update(item.sourceId, { status })
    case 'data-design':
      return repositories.dataDesignProjects.update(item.sourceId, {
        status: status === 'completed' ? 'completed' : 'active',
        completedAt,
      })
    case 'learning':
      return repositories.learningSessions.update(item.sourceId, {
        status,
        completedAt,
      })
  }
}

export async function reschedulePlanItem(item: PlanItem, plannedDate: string) {
  switch (item.sourceModule) {
    case 'standalone':
      return repositories.standaloneTasks.update(item.sourceId, { plannedDate })
    case 'self-media':
      return repositories.selfMediaItems.update(item.sourceId, {
        plannedActionDate: plannedDate,
      })
    case 'development':
      return repositories.devItems.update(item.sourceId, { plannedDate })
    case 'consulting':
      return repositories.consultingActions.update(item.sourceId, {
        plannedDate,
      })
    case 'fitness':
      return repositories.workoutSessions.update(item.sourceId, {
        plannedDate,
      })
    case 'diet': {
      const shopping = await db.shoppingItems.get(item.sourceId)
      if (shopping) {
        return repositories.shoppingItems.update(item.sourceId, {
          plannedDate,
        })
      }
      return repositories.mealPlans.update(item.sourceId, { date: plannedDate })
    }
    case 'games':
      return repositories.playSessions.update(item.sourceId, { plannedDate })
    case 'data-design':
      return repositories.dataDesignProjects.update(item.sourceId, {
        plannedDate,
      })
    case 'learning':
      return repositories.learningSessions.update(item.sourceId, {
        plannedDate,
      })
  }
}
