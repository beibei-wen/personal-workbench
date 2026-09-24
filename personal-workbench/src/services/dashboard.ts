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
    devProjects,
    devItems,
    consultingActions,
    consultingMeetings,
    fitnessPlans,
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
    db.devProjects.toArray(),
    db.devItems.toArray(),
    db.consultingActions.toArray(),
    db.consultingMeetings.toArray(),
    db.fitnessPlans.toArray(),
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
  const upcomingDate = dayjs(date).add(7, 'day').format('YYYY-MM-DD')
  const weekday = dayjs(date).day() || 7

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
          (item.dueDate &&
            item.dueDate >= date &&
            item.dueDate <= upcomingDate) ||
          (item.dueDate && item.dueDate < date) ||
          item.plannedDate === date),
    )
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: item.status === 'blocked' ? '阻塞' : item.dueDate ?? '进行中',
    }))
  const activeProjectItems = devProjects
    .filter((project) => project.status === 'active')
    .slice(0, 2)
    .map((project) => ({
      id: `project:${project.id}`,
      title: project.name,
      meta: '进行中项目',
    }))
  const developmentSummary = [...developmentItems, ...activeProjectItems].slice(
    0,
    4,
  )

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
            (item.dueDate &&
              item.dueDate > date &&
              item.dueDate <= upcomingDate) ||
            item.plannedDate === date),
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        meta: item.dueDate
          ? `${item.dueDate < date ? '已到期' : '截止'} ${item.dueDate}`
          : '待跟进',
      })),
  ].slice(0, 4)

  const todayFitnessPlans = fitnessPlans
    .filter((plan) => plan.dayOfWeek === weekday)
    .map((plan) => ({
      id: `plan:${plan.id}`,
      title: plan.title,
      meta:
        plan.exercises.length > 0
          ? `今日训练 · ${plan.exercises.length} 个动作`
          : '今日训练计划',
    }))
  const todayWorkoutSessions = workoutSessions
    .filter(
      (session) =>
        session.plannedDate === date ||
        (session.date === date && session.status !== 'completed'),
    )
    .map((session) => ({
      id: `session:${session.id}`,
      title: session.title,
      meta:
        session.status === 'completed'
          ? '今日完成'
          : session.status === 'partial'
            ? '今日部分完成'
            : '今日训练记录',
    }))
  const activeWorkoutSessions = workoutSessions
    .filter(
      (session) =>
        session.date < date &&
        (session.status === 'pending' ||
          session.status === 'in_progress' ||
          session.status === 'partial'),
    )
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 2)
    .map((session) => ({
      id: `active:${session.id}`,
      title: session.title,
      meta: '需要继续记录',
    }))
  const latestWorkoutSession = workoutSessions
    .filter((session) => session.status === 'completed')
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 1)
    .map((session) => ({
      id: `latest:${session.id}`,
      title: session.title,
      meta: '最近完成',
    }))
  const fitnessItems = [
    ...todayFitnessPlans,
    ...todayWorkoutSessions,
    ...activeWorkoutSessions,
    ...(todayFitnessPlans.length + todayWorkoutSessions.length === 0
      ? latestWorkoutSession
      : []),
  ].slice(0, 4)

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
  ]
  if (
    gameItems.length === 0 &&
    playSessions.some((session) => session.status === 'completed')
  ) {
    const latestGameSession = playSessions
      .filter((session) => session.status === 'completed')
      .sort((left, right) => right.date.localeCompare(left.date))[0]
    if (latestGameSession) {
      gameItems.push({
        id: `latest:${latestGameSession.id}`,
        title: latestGameSession.progress ?? '最近游玩',
        meta: '最近游玩记录',
      })
    }
  }
  const visibleGameItems = gameItems.slice(0, 4)

  const dataDesignItems = dataProjects
    .filter(
      (item) =>
        item.status !== 'completed' &&
        (item.status === 'blocked' ||
          (item.dueDate && item.dueDate <= date) ||
          (item.dueDate &&
            item.dueDate > date &&
            item.dueDate <= upcomingDate) ||
          item.plannedDate === date),
    )
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.nextAction ?? item.name,
      meta:
        item.status === 'blocked'
          ? '阻塞'
          : item.dueDate
            ? `${item.dueDate < date ? '已到期' : '即将交付'} ${item.dueDate}`
            : '进行中',
    }))

  const learningNow = learningItems
    .filter(
      (item) =>
        item.status !== 'completed' &&
        (item.status === 'in_progress' ||
          (item.nextReviewDate && item.nextReviewDate <= date)),
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta:
        item.nextReviewDate && item.nextReviewDate <= date
          ? `复习 ${item.nextReviewDate}`
          : `学习中 ${item.progress}%`,
    }))
  const learningToday = learningSessions.filter(
    (item) =>
      (item.plannedDate === date || item.date === date) &&
      item.status !== 'completed',
  )
  const learningSummary = [
    ...learningToday.map((item) => ({
      id: item.id,
      title: item.note ?? '学习安排',
      meta: '今日学习',
    })),
    ...learningNow,
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
      tone: developmentSummary.length ? 'warning' : 'neutral',
      items: developmentSummary,
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
      tone: visibleGameItems.length ? 'info' : 'neutral',
      items: visibleGameItems,
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
