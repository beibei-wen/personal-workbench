import { useState } from 'react'
import {
  App,
  Button,
  Card,
  Drawer,
  Rate,
  Select,
  Space,
  Tag,
} from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { Clock3, Edit3, Gamepad2, Plus } from 'lucide-react'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { db, repositories } from '../../db/database'
import { todayString } from '../../lib/date'
import type {
  Game,
  GameStatus,
  Priority,
} from '../../domain/types'
import { ListRow, SimpleList } from '../../components/SimpleList'

const gameStatuses: GameStatus[] = [
  'wishlist',
  'playing',
  'paused',
  'completed',
  'dropped',
]

const statusLabels: Record<GameStatus, string> = {
  wishlist: '想玩',
  playing: '正在玩',
  paused: '暂停',
  completed: '已通关',
  dropped: '放弃',
}

const statusTones: Record<GameStatus, 'neutral' | 'info' | 'success' | 'warning'> =
  {
    wishlist: 'neutral',
    playing: 'info',
    paused: 'warning',
    completed: 'success',
    dropped: 'neutral',
  }

function PlaySessionsDrawer({
  game,
  onClose,
}: {
  game?: Game
  onClose: () => void
}) {
  const { message } = App.useApp()
  const [formOpen, setFormOpen] = useState(false)
  const sessions = useLiveQuery(
    () =>
      game
        ? db.playSessions
            .where('gameId')
            .equals(game.id)
            .reverse()
            .sortBy('date')
        : [],
    [game?.id],
  )

  return (
    <Drawer
      title={game ? `游玩记录：${game.name}` : '游玩记录'}
      open={Boolean(game)}
      size="large"
      onClose={onClose}
      extra={
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={() => setFormOpen(true)}
        >
          记录游玩
        </Button>
      }
    >
      <SimpleList
        items={sessions ?? []}
        emptyText="暂无游玩记录"
        renderItem={(session) => (
          <ListRow
            key={session.id}
            actions={
              <ConfirmDeleteButton
                description={
                  session.plannedDate
                    ? '该游玩记录已关联今日计划，删除后关联行动会一起消失。'
                    : '删除后无法恢复。'
                }
                onConfirm={() => repositories.playSessions.remove(session.id)}
              />
            }
          >
            <div>
              <Space>
                <strong>{session.date}</strong>
                <Tag>{session.durationMinutes} 分钟</Tag>
                {session.plannedDate ? (
                  <Tag color="blue">计划 {session.plannedDate}</Tag>
                ) : null}
              </Space>
              <p className="record-note">
                {session.progress || session.notes || '无进展说明'}
              </p>
            </div>
          </ListRow>
        )}
      />

      <FormDrawer
        open={formOpen}
        title="记录一次游玩"
        fields={[
          {
            name: 'date',
            label: '游玩日期',
            input: 'date',
            required: true,
            span: 12,
          },
          {
            name: 'durationMinutes',
            label: '时长（分钟）',
            input: 'number',
            required: true,
            min: 1,
            span: 12,
          },
          {
            name: 'plannedDate',
            label: '计划日期',
            input: 'date',
            span: 12,
          },
          { name: 'progress', label: '本次进展', input: 'textarea' },
          { name: 'notes', label: '感想备注', input: 'textarea' },
        ]}
        initialValues={{ date: todayString() }}
        onClose={() => setFormOpen(false)}
        onSubmit={async (values) => {
          if (!game) return
          await repositories.playSessions.create({
            gameId: game.id,
            date: String(values.date),
            durationMinutes: Number(values.durationMinutes),
            plannedDate: values.plannedDate
              ? String(values.plannedDate)
              : undefined,
            progress: values.progress ? String(values.progress) : undefined,
            notes: values.notes ? String(values.notes) : undefined,
            status: 'completed',
          })
          setFormOpen(false)
          message.success('游玩记录已保存')
        }}
      />
    </Drawer>
  )
}

export function GamesPage() {
  const { message } = App.useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Game>()
  const [sessionGame, setSessionGame] = useState<Game>()
  const [statusFilter, setStatusFilter] = useState<GameStatus>()
  const games = useLiveQuery(
    () => db.games.orderBy('updatedAt').reverse().toArray(),
    [],
  )

  const filtered = (games ?? []).filter(
    (game) => !statusFilter || game.status === statusFilter,
  )

  return (
    <section className="page">
      <PageHeader
        title="游戏娱乐"
        description="管理想玩、正在玩和已通关的游戏，记录游玩时间与感想。"
        actions={
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            新增游戏
          </Button>
        }
      />

      <div className="filter-row">
        <Select
          allowClear
          value={statusFilter}
          placeholder="全部游戏状态"
          aria-label="游戏状态筛选"
          style={{ width: 180 }}
          onChange={setStatusFilter}
          options={gameStatuses.map((value) => ({
            value,
            label: statusLabels[value],
          }))}
        />
      </div>

      <div className="game-grid">
        {filtered.map((game) => (
          <Card
            key={game.id}
            className="game-card"
            title={
              <Space>
                <Gamepad2 size={18} />
                <span>{game.name}</span>
              </Space>
            }
            extra={
              <Tag color={statusTones[game.status]}>
                {statusLabels[game.status]}
              </Tag>
            }
            actions={[
              <Button
                key="play"
                type="text"
                icon={<Clock3 size={15} />}
                aria-label={`${game.name}游玩记录`}
                onClick={() => setSessionGame(game)}
              >
                记录游玩
              </Button>,
              <Button
                key="edit"
                type="text"
                icon={<Edit3 size={15} />}
                aria-label={`编辑游戏${game.name}`}
                onClick={() => {
                  setEditing(game)
                  setFormOpen(true)
                }}
              >
                编辑
              </Button>,
              <ConfirmDeleteButton
                key="delete"
                onConfirm={async () => {
                  await db.transaction(
                    'rw',
                    db.games,
                    db.playSessions,
                    async () => {
                      await db.playSessions
                        .where('gameId')
                        .equals(game.id)
                        .delete()
                      await db.games.delete(game.id)
                    },
                  )
                }}
              />,
            ]}
          >
            <div className="game-meta">
              <span>{game.platform}</span>
              <span>优先级：{game.priority}</span>
              {game.estimatedHours ? (
                <span>预计 {game.estimatedHours} 小时</span>
              ) : null}
            </div>
            {game.rating ? (
              <Rate disabled allowHalf value={game.rating} />
            ) : null}
            <p className="record-note">
              {game.progress || game.review || '暂无进度或感想'}
            </p>
          </Card>
        ))}
      </div>

      <FormDrawer
        open={formOpen}
        title={editing ? '编辑游戏' : '新增游戏'}
        fields={[
          { name: 'name', label: '游戏名称', input: 'text', required: true },
          {
            name: 'platform',
            label: '平台',
            input: 'text',
            required: true,
            span: 12,
          },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            span: 12,
            options: gameStatuses.map((value) => ({
              value,
              label: statusLabels[value],
            })),
          },
          {
            name: 'priority',
            label: '优先级',
            input: 'select',
            required: true,
            span: 12,
            options: [
              { value: 'high', label: '高' },
              { value: 'medium', label: '中' },
              { value: 'low', label: '低' },
            ],
          },
          {
            name: 'estimatedHours',
            label: '预计时长（小时）',
            input: 'number',
            min: 0,
            step: 0.5,
            span: 12,
          },
          { name: 'progress', label: '当前进度', input: 'textarea' },
          {
            name: 'rating',
            label: '评分（0-5）',
            input: 'number',
            min: 0,
            max: 5,
            step: 0.5,
          },
          { name: 'review', label: '感想', input: 'textarea' },
          {
            name: 'coverPath',
            label: '封面链接或本机路径',
            input: 'text',
          },
        ]}
        initialValues={
          editing ?? {
            status: 'wishlist',
            priority: 'medium',
          }
        }
        onClose={() => setFormOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            name: String(values.name),
            platform: String(values.platform),
            status: values.status as GameStatus,
            priority: values.priority as Priority,
            estimatedHours:
              values.estimatedHours === undefined
                ? undefined
                : Number(values.estimatedHours),
            progress: values.progress
              ? String(values.progress)
              : undefined,
            rating:
              values.rating === undefined ? undefined : Number(values.rating),
            review: values.review ? String(values.review) : undefined,
            coverPath: values.coverPath
              ? String(values.coverPath)
              : undefined,
            completedAt:
              values.status === 'completed'
                ? new Date().toISOString()
                : undefined,
          }
          if (editing) {
            await repositories.games.update(editing.id, payload)
          } else {
            await repositories.games.create(payload)
          }
          setFormOpen(false)
          message.success('游戏已保存')
        }}
      />

      <PlaySessionsDrawer
        game={sessionGame}
        onClose={() => setSessionGame(undefined)}
      />
    </section>
  )
}
