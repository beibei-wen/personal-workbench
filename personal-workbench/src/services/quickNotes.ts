import dayjs from 'dayjs'
import { db, repositories } from '../db/database'
import type { Priority } from '../domain/types'
import { createStandaloneTask } from './planner'

export type QuickNoteTarget =
  | 'today'
  | 'self-media'
  | 'development'
  | 'consulting'
  | 'fitness'
  | 'diet'
  | 'games'
  | 'data-design'
  | 'design'
  | 'learning'

export const quickNoteTargetLabels: Record<QuickNoteTarget, string> = {
  today: '今日计划独立事项',
  'self-media': '自媒体选题',
  development: '开发任务',
  consulting: '咨询行动项',
  fitness: '健身训练',
  diet: '购物清单',
  games: '想玩的游戏',
  'data-design': '数据项目',
  design: '设计项目',
  learning: '学习内容',
}

export async function createQuickNote(text: string) {
  return repositories.quickNotes.create({ text, status: 'open' })
}

export async function convertQuickNote(
  id: string,
  target: QuickNoteTarget,
  plannedDate = dayjs().format('YYYY-MM-DD'),
  priority: Priority = 'medium',
) {
  const note = await repositories.quickNotes.get(id)
  if (!note) {
    throw new Error('快速备忘不存在')
  }

  let convertedTo = target
  let createdLearningItemId: string | undefined

  switch (target) {
    case 'today':
      await createStandaloneTask({
        title: note.text,
        plannedDate,
        priority,
      })
      break
    case 'self-media':
      await repositories.selfMediaItems.create({
        title: note.text,
        platform: '待补充',
        contentType: '待补充',
        stage: 'idea',
        actionTitle: note.text,
        plannedActionDate: plannedDate,
        priority,
        actionStatus: 'pending',
      })
      break
    case 'development': {
      const project =
        (await db.devProjects
          .filter((item) => item.name === '快速记录')
          .first()) ??
        (await repositories.devProjects.create({
          name: '快速记录',
          status: 'active',
        }))
      await repositories.devItems.create({
        projectId: project.id,
        title: note.text,
        type: 'task',
        priority,
        status: 'pending',
        plannedDate,
      })
      break
    }
    case 'consulting': {
      const client =
        (await db.consultingClients
          .filter((item) => item.name === '未分类客户')
          .first()) ??
        (await repositories.consultingClients.create({
          name: '未分类客户',
          status: 'active',
        }))
      const project =
        (await db.consultingProjects
          .filter(
            (item) =>
              item.clientId === client.id && item.name === '快速记录',
          )
          .first()) ??
        (await repositories.consultingProjects.create({
          clientId: client.id,
          name: '快速记录',
          status: 'active',
        }))
      await repositories.consultingActions.create({
        projectId: project.id,
        title: note.text,
        plannedDate,
        status: 'pending',
      })
      break
    }
    case 'fitness':
      await repositories.workoutSessions.create({
        date: plannedDate,
        plannedDate,
        title: note.text,
        status: 'pending',
      })
      break
    case 'diet':
      await repositories.shoppingItems.create({
        name: note.text,
        purchased: false,
        plannedDate,
      })
      break
    case 'games': {
      const game = await repositories.games.create({
        name: note.text,
        platform: '待补充',
        status: 'wishlist',
        priority,
      })
      await repositories.playSessions.create({
        gameId: game.id,
        date: plannedDate,
        plannedDate,
        durationMinutes: 0,
        progress: `准备玩：${note.text}`,
        status: 'pending',
      })
      break
    }
    case 'data-design':
    case 'design':
      await repositories.dataDesignProjects.create({
        name: note.text,
        type: target === 'design' ? 'design' : 'data',
        status: 'planning',
        priority,
        plannedDate,
        nextAction: note.text,
      })
      break
    case 'learning': {
      const learningItem = await repositories.learningItems.create({
        title: note.text,
        type: 'skill',
        status: 'planned',
        progress: 0,
      })
      createdLearningItemId = learningItem.id
      convertedTo = 'learning'
      break
    }
  }

  if (createdLearningItemId) {
    await repositories.learningSessions.create({
      itemId: createdLearningItemId,
      date: plannedDate,
      plannedDate,
      durationMinutes: 30,
      progress: 0,
      status: 'pending',
      note: note.text,
    })
  }

  await repositories.quickNotes.update(id, {
    status: 'converted',
    convertedTo,
  })
}
