import { useState } from 'react'
import {
  App,
  Button,
  Card,
  Progress,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, Edit3, Plus } from 'lucide-react'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { StatusTag } from '../../components/StatusTag'
import { db, repositories } from '../../db/database'
import { todayString } from '../../lib/date'
import type {
  ActionStatus,
  LearningItem,
  LearningType,
} from '../../domain/types'

const learningTypeLabels: Record<LearningType, string> = {
  course: '课程',
  book: '书籍',
  skill: '技能',
}

const learningStatusLabels: Record<string, string> = {
  planned: '计划中',
  in_progress: '学习中',
  paused: '暂停',
  completed: '已完成',
}

export function LearningPage() {
  const { message } = App.useApp()
  const [activeTab, setActiveTab] = useState('items')
  const [itemOpen, setItemOpen] = useState(false)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LearningItem>()

  const data = useLiveQuery(
    async () => {
      const items = await db.learningItems.toArray()
      const notes = await db.learningNotes.toArray()
      return {
        items: items.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
        sessions: await db.learningSessions
          .orderBy('date')
          .reverse()
          .toArray(),
        notes: notes.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
      }
    },
    [],
  )

  const items = data?.items ?? []
  const sessions = data?.sessions ?? []
  const notes = data?.notes ?? []
  const itemMap = new Map(items.map((item) => [item.id, item.title]))

  return (
    <section className="page">
      <PageHeader
        title="学习计划"
        description="管理课程、书籍和技能，记录学习进度、笔记与复习。"
        actions={
          <>
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingItem(undefined)
                setItemOpen(true)
              }}
            >
              新增学习内容
            </Button>
            <Button
              type="primary"
              icon={<BookOpen size={16} />}
              onClick={() => setSessionOpen(true)}
            >
              记录学习
            </Button>
          </>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'items', label: `学习内容 ${items.length}` },
          { key: 'sessions', label: `学习记录 ${sessions.length}` },
          { key: 'notes', label: `笔记与复习 ${notes.length}` },
        ]}
      />

      {activeTab === 'items' ? (
        <div className="learning-grid">
          {items.map((item) => (
            <Card
              key={item.id}
              size="small"
              title={item.title}
              extra={
                <Space size={2}>
                  <Button
                    type="text"
                    size="small"
                    icon={<Edit3 size={15} />}
                    aria-label={`编辑学习内容${item.title}`}
                    onClick={() => {
                      setEditingItem(item)
                      setItemOpen(true)
                    }}
                  />
                  <ConfirmDeleteButton
                    title="删除学习内容及记录？"
                    onConfirm={async () => {
                      await db.transaction(
                        'rw',
                        db.learningItems,
                        db.learningSessions,
                        db.learningNotes,
                        async () => {
                          await db.learningSessions
                            .where('itemId')
                            .equals(item.id)
                            .delete()
                          await db.learningNotes
                            .where('itemId')
                            .equals(item.id)
                            .delete()
                          await db.learningItems.delete(item.id)
                        },
                      )
                    }}
                  />
                </Space>
              }
            >
              <Space wrap>
                <Tag>{learningTypeLabels[item.type]}</Tag>
                <StatusTag
                  label={
                    learningStatusLabels[item.status] ?? item.status
                  }
                  tone={
                    item.status === 'completed'
                      ? 'success'
                      : item.status === 'in_progress'
                        ? 'info'
                        : 'neutral'
                  }
                />
              </Space>
              <p className="record-note">{item.goal || '暂无学习目标'}</p>
              <Progress percent={item.progress} size="small" />
              {item.nextReviewDate ? (
                <p className="record-note">复习：{item.nextReviewDate}</p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {activeTab === 'sessions' ? (
        <>
          <div className="subsection-heading">
            <h3>学习记录</h3>
            <Button
              size="small"
              icon={<Plus size={14} />}
              onClick={() => setSessionOpen(true)}
            >
              记录学习
            </Button>
          </div>
          <Table
            rowKey="id"
            dataSource={sessions}
            pagination={{ pageSize: 12, hideOnSinglePage: true }}
            columns={[
              { title: '日期', dataIndex: 'date', width: 115 },
              {
                title: '学习内容',
                dataIndex: 'itemId',
                render: (value: string) => itemMap.get(value) ?? '-',
              },
              {
                title: '时长',
                dataIndex: 'durationMinutes',
                width: 90,
                render: (value: number) => `${value} 分钟`,
              },
              {
                title: '进度',
                dataIndex: 'progress',
                width: 80,
                render: (value: number) => `${value}%`,
              },
              {
                title: '状态',
                dataIndex: 'status',
                width: 90,
                render: (value: ActionStatus) => (
                  <StatusTag
                    label={
                      value === 'completed'
                        ? '完成'
                        : value === 'in_progress'
                          ? '进行中'
                          : '待学习'
                    }
                    tone={value === 'completed' ? 'success' : 'neutral'}
                  />
                ),
              },
              { title: '备注', dataIndex: 'note', ellipsis: true },
              {
                title: '操作',
                width: 70,
                render: (_, session) => (
                  <ConfirmDeleteButton
                    description={
                      session.plannedDate
                        ? '该学习记录已关联今日计划，删除后关联行动会一起消失。'
                        : '删除后无法恢复。'
                    }
                    onConfirm={() =>
                      repositories.learningSessions.remove(session.id)
                    }
                  />
                ),
              },
            ]}
            locale={{ emptyText: '暂无学习记录' }}
          />
        </>
      ) : null}

      {activeTab === 'notes' ? (
        <>
          <div className="subsection-heading">
            <h3>笔记与复习</h3>
            <Button
              size="small"
              icon={<Plus size={14} />}
              onClick={() => setNoteOpen(true)}
            >
              新增笔记
            </Button>
          </div>
          <Table
            rowKey="id"
            dataSource={notes}
            pagination={{ pageSize: 12, hideOnSinglePage: true }}
            columns={[
              {
                title: '学习内容',
                dataIndex: 'itemId',
                render: (value: string) => itemMap.get(value) ?? '-',
              },
              { title: '笔记', dataIndex: 'content', ellipsis: true },
              { title: '问题', dataIndex: 'question', ellipsis: true },
              {
                title: '复习状态',
                dataIndex: 'reviewStatus',
                width: 100,
                render: (value: string) => (
                  <StatusTag
                    label={
                      value === 'mastered'
                        ? '已掌握'
                        : value === 'reviewing'
                          ? '复习中'
                          : '待复习'
                    }
                    tone={
                      value === 'mastered'
                        ? 'success'
                        : value === 'reviewing'
                          ? 'info'
                          : 'warning'
                    }
                  />
                ),
              },
              { title: '复习日期', dataIndex: 'reviewDate', width: 115 },
              {
                title: '操作',
                width: 120,
                render: (_, note) => (
                  <Space size={2}>
                    {note.reviewStatus !== 'mastered' ? (
                      <Button
                        type="text"
                        size="small"
                        onClick={() =>
                          repositories.learningNotes.update(note.id, {
                            reviewStatus: 'mastered',
                          })
                        }
                      >
                        已掌握
                      </Button>
                    ) : null}
                    <ConfirmDeleteButton
                      onConfirm={() =>
                        repositories.learningNotes.remove(note.id)
                      }
                    />
                  </Space>
                ),
              },
            ]}
            locale={{ emptyText: '暂无学习笔记' }}
          />
        </>
      ) : null}

      <FormDrawer
        open={itemOpen}
        title={editingItem ? '编辑学习内容' : '新增学习内容'}
        fields={[
          { name: 'title', label: '标题', input: 'text', required: true },
          {
            name: 'type',
            label: '类型',
            input: 'select',
            required: true,
            span: 12,
            options: Object.entries(learningTypeLabels).map(
              ([value, label]) => ({ value, label }),
            ),
          },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            span: 12,
            options: Object.entries(learningStatusLabels).map(
              ([value, label]) => ({ value, label }),
            ),
          },
          {
            name: 'progress',
            label: '学习进度（%）',
            input: 'number',
            required: true,
            min: 0,
            max: 100,
            span: 12,
          },
          {
            name: 'nextReviewDate',
            label: '下次复习',
            input: 'date',
            span: 12,
          },
          { name: 'goal', label: '学习目标', input: 'textarea' },
          { name: 'outline', label: '章节或提纲', input: 'textarea' },
        ]}
        initialValues={
          editingItem ?? {
            type: 'course',
            status: 'planned',
            progress: 0,
          }
        }
        onClose={() => setItemOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            title: String(values.title),
            type: values.type as LearningType,
            status: values.status as
              | 'planned'
              | 'in_progress'
              | 'paused'
              | 'completed',
            progress: Number(values.progress),
            goal: values.goal ? String(values.goal) : undefined,
            outline: values.outline ? String(values.outline) : undefined,
            nextReviewDate: values.nextReviewDate
              ? String(values.nextReviewDate)
              : undefined,
            completedAt:
              values.status === 'completed'
                ? new Date().toISOString()
                : undefined,
          }
          if (editingItem) {
            await repositories.learningItems.update(editingItem.id, payload)
          } else {
            await repositories.learningItems.create(payload)
          }
          setItemOpen(false)
          message.success('学习内容已保存')
        }}
      />

      <FormDrawer
        open={sessionOpen}
        title="记录一次学习"
        fields={[
          {
            name: 'itemId',
            label: '学习内容',
            input: 'select',
            required: true,
            options: items.map((item) => ({
              value: item.id,
              label: item.title,
            })),
          },
          {
            name: 'date',
            label: '日期',
            input: 'date',
            required: true,
            span: 12,
          },
          {
            name: 'plannedDate',
            label: '安排到今日',
            input: 'date',
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
            name: 'progress',
            label: '当前进度（%）',
            input: 'number',
            required: true,
            min: 0,
            max: 100,
            span: 12,
          },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            options: [
              { value: 'pending', label: '待学习' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '完成' },
            ],
          },
          { name: 'note', label: '学习记录', input: 'textarea' },
        ]}
        initialValues={{
          date: todayString(),
          status: 'in_progress',
          progress: 0,
        }}
        onClose={() => setSessionOpen(false)}
        onSubmit={async (values) => {
          const itemId = String(values.itemId)
          await repositories.learningSessions.create({
            itemId,
            date: String(values.date),
            plannedDate: values.plannedDate
              ? String(values.plannedDate)
              : undefined,
            durationMinutes: Number(values.durationMinutes),
            progress: Number(values.progress),
            status: values.status as ActionStatus,
            note: values.note ? String(values.note) : undefined,
            completedAt:
              values.status === 'completed'
                ? new Date().toISOString()
                : undefined,
          })
          await repositories.learningItems.update(itemId, {
            progress: Number(values.progress),
            status:
              Number(values.progress) >= 100
                ? 'completed'
                : 'in_progress',
          })
          setSessionOpen(false)
          message.success('学习记录已保存')
        }}
      />

      <FormDrawer
        open={noteOpen}
        title="新增学习笔记"
        fields={[
          {
            name: 'itemId',
            label: '学习内容',
            input: 'select',
            required: true,
            options: items.map((item) => ({
              value: item.id,
              label: item.title,
            })),
          },
          {
            name: 'content',
            label: '笔记内容',
            input: 'textarea',
            required: true,
          },
          { name: 'question', label: '待解决问题', input: 'textarea' },
          {
            name: 'reviewStatus',
            label: '复习状态',
            input: 'select',
            required: true,
            options: [
              { value: 'new', label: '待复习' },
              { value: 'reviewing', label: '复习中' },
              { value: 'mastered', label: '已掌握' },
            ],
          },
          {
            name: 'reviewDate',
            label: '复习日期',
            input: 'date',
          },
        ]}
        initialValues={{ reviewStatus: 'new' }}
        onClose={() => setNoteOpen(false)}
        onSubmit={async (values) => {
          await repositories.learningNotes.create({
            itemId: String(values.itemId),
            content: String(values.content),
            question: values.question
              ? String(values.question)
              : undefined,
            reviewStatus: values.reviewStatus as
              | 'new'
              | 'reviewing'
              | 'mastered',
            reviewDate: values.reviewDate
              ? String(values.reviewDate)
              : undefined,
          })
          setNoteOpen(false)
          message.success('学习笔记已保存')
        }}
      />
    </section>
  )
}
