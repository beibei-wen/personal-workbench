import dayjs from 'dayjs'
import { db } from '../db/database'
import type { StatusTone } from '../components/StatusTag'

export type DashboardSummaryItem = {
  id: string
  title: string
  meta?: string
}

export type DashboardSummary = {
  module: string
  path: string
  tone: StatusTone
  items: DashboardSummaryItem[]
}

export async function getDashboardSummaries(
  date = dayjs().format('YYYY-MM-DD'),
): Promise<DashboardSummary[]> {
  const [
    selfMedia,
    devItems,
    consultingActions,
    consultingMeetings,
    workoutSessions,
    mealPlans,
    waterLogs,
    shoppingItems,
    games,
    playSessions,
    dataProjects,
    learningItems,
    learningSessions,
  ] = await Promise.all([
    db.selfMediaItems.toArray(),
    db.devItems.toArray(),
    db.consultingActions.toArray(),
    db.consultingMeetings.toArray(),
    db.workoutSessions.toArray(),
    db.mealPlans.toArray(),
    db.waterLogs.toArray(),
    db.shoppingItems.toArray(),
    db.games.toArray(),
    db.playSessions.toArray(),
    db.dataDesignProjects.toArray(),
    db.learningItems.toArray(),
    db.learningSessions.toArray(),
  ])

  const mediaItems = selfMedia
    .filter(
      (item) =>
        item.actionStatus !== 'completed' ||
        (item.publishedAt && item.stage !== 'review'),
    )
    .sort((left, right) =>
      (left.plannedPublishDate ?? '9999').localeCompare(
        right.plannedPublishDate ?? '9999',
      ),
    )
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: item.plannedPublishDate
        ? `计划 ${item.plannedPublishDate}`
        : '待安排',
    }))

  const developmentItems = devItems
    .filter(
      (item) =>
        item.status !== 'completed' &&
        (item.status === 'blocked' ||
          (item.dueDate && item.dueDate <= date) ||
          item.plannedDate === date),
    )
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: item.status === 'blocked' ? '阻塞' : item.dueDate ?? '进行中',
    }))

  const consultingItems = [
    ...consultingMeetings
      .filter((item) => item.date === date)
      .map((item) => ({
        id: item.id,
        title: item.title,
        meta: '今日会议',
      })),
    ...consultingActions
      .filter(
        (item) =>
          item.status !== 'completed' &&
          ((item.dueDate && item.dueDate <= date) ||
            item.plannedDate === date),
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        meta: item.dueDate ? `截止 ${item.dueDate}` : '待跟进',
      })),
  ].slice(0, 4)

  const fitnessItems = (
    workoutSessions.filter((item) => item.plannedDate === date).length
      ? workoutSessions.filter((item) => item.plannedDate === date)
      : workoutSessions
          .filter((item) => item.status === 'completed')
          .sort((left, right) => right.date.localeCompare(left.date))
          .slice(0, 1)
  ).map((item) => ({
    id: item.id,
    title: item.title,
    meta: item.status === 'completed' ? '最近完成' : '今日训练',
  }))

  const dietItems = [
    ...mealPlans
      .filter((item) => item.date === date)
      .map((item) => ({
        id: item.id,
        title: item.plannedItems,
        meta: item.mealType,
      })),
    ...shoppingItems
      .filter((item) => !item.purchased)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.name,
        meta: '待购买',
      })),
  ].slice(0, 4)

  const waterToday = waterLogs
    .filter((item) => item.date === date)
    .reduce((sum, item) => sum + item.amountMl, 0)
  if (waterToday > 0) {
    dietItems.push({
      id: `water-${date}`,
      title: `饮水 ${waterToday} ml`,
      meta: '今日记录',
    })
  }

  const gameItems = [
    ...games
      .filter((item) => item.status === 'playing')
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        title: item.name,
        meta: '正在玩',
      })),
    ...playSessions
      .filter((item) => item.plannedDate === date)
      .map((item) => ({
        id: item.id,
        title: item.progress ?? '计划游戏时间',
        meta: '今日安排',
      })),
  ].slice(0, 4)

  const dataDesignItems = dataProjects
    .filter(
      (item) =>
        item.status !== 'completed' &&
        (item.status === 'blocked' ||
          (item.dueDate && item.dueDate <= date) ||
          item.plannedDate === date),
    )
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.nextAction ?? item.name,
      meta: item.status === 'blocked' ? '阻塞' : item.dueDate ?? '进行中',
    }))

  const learningNow = learningItems.filter(
    (item) =>
      item.status !== 'completed' &&
      (item.nextReviewDate && item.nextReviewDate <= date),
  )
  const learningToday = learningSessions.filter(
    (item) => item.plannedDate === date && item.status !== 'completed',
  )
  const learningSummary = [
    ...learningToday.map((item) => ({
      id: item.id,
      title: item.note ?? '学习安排',
      meta: '今日学习',
    })),
    ...learningNow.map((item) => ({
      id: item.id,
      title: item.title,
      meta: `复习 ${item.nextReviewDate}`,
    })),
  ].slice(0, 4)

  return [
    {
      module: '自媒体',
      path: '/self-media',
      tone: mediaItems.length ? 'info' : 'neutral',
      items: mediaItems,
    },
    {
      module: '开发工作',
      path: '/development',
      tone: developmentItems.length ? 'warning' : 'neutral',
      items: developmentItems,
    },
    {
      module: '咨询工作',
      path: '/consulting',
      tone: consultingItems.length ? 'info' : 'neutral',
      items: consultingItems,
    },
    {
      module: '健身计划',
      path: '/fitness',
      tone: fitnessItems.length ? 'success' : 'neutral',
      items: fitnessItems,
    },
    {
      module: '饮食计划',
      path: '/diet',
      tone: dietItems.length ? 'success' : 'neutral',
      items: dietItems,
    },
    {
      module: '游戏娱乐',
      path: '/games',
      tone: gameItems.length ? 'info' : 'neutral',
      items: gameItems,
    },
    {
      module: '数据与设计',
      path: '/data-design',
      tone: dataDesignItems.length ? 'warning' : 'neutral',
      items: dataDesignItems,
    },
    {
      module: '学习计划',
      path: '/learning',
      tone: learningSummary.length ? 'info' : 'neutral',
      items: learningSummary,
    },
  ]
}
