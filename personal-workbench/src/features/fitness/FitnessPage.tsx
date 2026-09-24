import { useState } from 'react'
import {
  App,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell, Edit3, Play, Plus } from 'lucide-react'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { StatusTag } from '../../components/StatusTag'
import { db, repositories } from '../../db/database'
import { todayString } from '../../lib/date'
import type {
  ActionStatus,
  FitnessPlan,
  PlannedExercise,
  WorkoutSession,
} from '../../domain/types'
import { ListRow, SimpleList } from '../../components/SimpleList'

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function parseExercises(value: string): PlannedExercise[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, sets, reps, weight, durationMinutes] = line
        .split('|')
        .map((part) => part.trim())
      return {
        name,
        sets: sets ? Number(sets) : undefined,
        reps: reps ? Number(reps) : undefined,
        weight: weight ? Number(weight) : undefined,
        durationMinutes: durationMinutes
          ? Number(durationMinutes)
          : undefined,
      }
    })
}

function formatExercises(exercises: PlannedExercise[]) {
  return exercises
    .map((exercise) =>
      [
        exercise.name,
        exercise.sets,
        exercise.reps,
        exercise.weight,
        exercise.durationMinutes,
      ]
        .filter((value) => value !== undefined)
        .join(' | '),
    )
    .join('\n')
}

function SessionEntriesDrawer({
  session,
  onClose,
}: {
  session?: WorkoutSession
  onClose: () => void
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const entries = useLiveQuery(
    () =>
      session
        ? db.workoutEntries.where('sessionId').equals(session.id).toArray()
        : [],
    [session?.id],
  )

  const addEntry = async (values: Record<string, unknown>) => {
    if (!session) return
    await repositories.workoutEntries.create({
      sessionId: session.id,
      exerciseName: String(values.exerciseName),
      sets: values.sets === undefined ? undefined : Number(values.sets),
      reps: values.reps === undefined ? undefined : Number(values.reps),
      weight:
        values.weight === undefined ? undefined : Number(values.weight),
      durationMinutes:
        values.durationMinutes === undefined
          ? undefined
          : Number(values.durationMinutes),
    })
    form.resetFields()
    message.success('动作已添加')
  }

  return (
    <Drawer
      title={session ? `训练动作：${session.title}` : '训练动作'}
      open={Boolean(session)}
      size="large"
      onClose={onClose}
    >
      <Form
        form={form}
        layout="inline"
        onFinish={addEntry}
        className="metric-form"
      >
        <Form.Item
          name="exerciseName"
          rules={[{ required: true, message: '请输入动作' }]}
        >
          <Input placeholder="动作" aria-label="动作名称" />
        </Form.Item>
        <Form.Item name="sets">
          <InputNumber placeholder="组" aria-label="组数" min={1} />
        </Form.Item>
        <Form.Item name="reps">
          <InputNumber placeholder="次" aria-label="次数" min={1} />
        </Form.Item>
        <Form.Item name="weight">
          <InputNumber placeholder="重量" aria-label="重量" min={0} />
        </Form.Item>
        <Form.Item name="durationMinutes">
          <InputNumber placeholder="分钟" aria-label="动作时长" min={1} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            添加
          </Button>
        </Form.Item>
      </Form>
      <SimpleList
        items={entries ?? []}
        emptyText="暂无动作记录"
        renderItem={(entry) => (
          <ListRow
            key={entry.id}
            actions={
              <ConfirmDeleteButton
                onConfirm={() =>
                  repositories.workoutEntries.remove(entry.id)
                }
              />
            }
          >
            <Space wrap>
              <strong>{entry.exerciseName}</strong>
              {entry.sets ? <Tag>{entry.sets} 组</Tag> : null}
              {entry.reps ? <Tag>{entry.reps} 次</Tag> : null}
              {entry.weight ? <Tag>{entry.weight} kg</Tag> : null}
              {entry.durationMinutes ? (
                <Tag>{entry.durationMinutes} 分钟</Tag>
              ) : null}
            </Space>
          </ListRow>
        )}
      />
    </Drawer>
  )
}

export function FitnessPage() {
  const { message } = App.useApp()
  const [activeTab, setActiveTab] = useState('plans')
  const [planOpen, setPlanOpen] = useState(false)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [metricOpen, setMetricOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<FitnessPlan>()
  const [editingSession, setEditingSession] = useState<WorkoutSession>()
  const [entrySession, setEntrySession] = useState<WorkoutSession>()

  const data = useLiveQuery(
    async () => ({
      plans: await db.fitnessPlans.toArray(),
      sessions: await db.workoutSessions.orderBy('date').reverse().toArray(),
      metrics: await db.bodyMetrics.orderBy('date').reverse().toArray(),
    }),
    [],
  )

  return (
    <section className="page">
      <PageHeader
        title="健身计划"
        description="安排每周训练，记录动作、组次重量和身体指标。"
        actions={
          <>
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingPlan(undefined)
                setPlanOpen(true)
              }}
            >
              新增训练计划
            </Button>
            <Button
              type="primary"
              icon={<Play size={16} />}
              onClick={() => {
                setEditingSession(undefined)
                setSessionOpen(true)
              }}
            >
              记录训练
            </Button>
          </>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'plans', label: `每周安排 ${data?.plans.length ?? 0}` },
          { key: 'sessions', label: `训练记录 ${data?.sessions.length ?? 0}` },
          { key: 'metrics', label: `身体指标 ${data?.metrics.length ?? 0}` },
        ]}
      />

      {activeTab === 'plans' ? (
        <div className="week-grid">
          {weekdays.map((weekday, index) => {
            const plan = data?.plans.find(
              (item) => item.dayOfWeek === index + 1,
            )
            return (
              <Card
                key={weekday}
                size="small"
                title={weekday}
                className="week-card"
                extra={
                  plan ? (
                    <Space size={2}>
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit3 size={15} />}
                        aria-label={`编辑${weekday}计划`}
                        onClick={() => {
                          setEditingPlan(plan)
                          setPlanOpen(true)
                        }}
                      />
                      <ConfirmDeleteButton
                        onConfirm={() =>
                          repositories.fitnessPlans.remove(plan.id)
                        }
                      />
                    </Space>
                  ) : null
                }
              >
                {plan ? (
                  <>
                    <strong>{plan.title}</strong>
                    <ul className="compact-list">
                      {plan.exercises.map((exercise) => (
                        <li key={exercise.name}>
                          {exercise.name}
                          {exercise.sets && exercise.reps
                            ? ` ${exercise.sets}x${exercise.reps}`
                            : ''}
                          {exercise.weight ? ` ${exercise.weight}kg` : ''}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Button
                    type="text"
                    icon={<Plus size={15} />}
                    onClick={() => {
                      setEditingPlan({
                        id: '',
                        dayOfWeek: index + 1,
                        title: '',
                        exercises: [],
                        createdAt: '',
                        updatedAt: '',
                      })
                      setPlanOpen(true)
                    }}
                  >
                    安排训练
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      ) : null}

      {activeTab === 'sessions' ? (
        <Table
          rowKey="id"
          dataSource={data?.sessions ?? []}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          columns={[
            { title: '日期', dataIndex: 'date', width: 120 },
            { title: '训练', dataIndex: 'title' },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (value: string) => (
                <StatusTag
                  label={
                    value === 'completed'
                      ? '完成'
                      : value === 'partial'
                        ? '部分完成'
                        : value === 'in_progress'
                          ? '进行中'
                          : '待训练'
                  }
                  tone={
                    value === 'completed'
                      ? 'success'
                      : value === 'partial'
                        ? 'warning'
                        : 'neutral'
                  }
                />
              ),
            },
            {
              title: '操作',
              width: 140,
              render: (_, session) => (
                <Space size={2}>
                  <Button
                    type="text"
                    size="small"
                    icon={<Dumbbell size={15} />}
                    aria-label={`记录${session.title}动作`}
                    onClick={() => setEntrySession(session)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<Edit3 size={15} />}
                    aria-label={`编辑训练${session.title}`}
                    onClick={() => {
                      setEditingSession(session)
                      setSessionOpen(true)
                    }}
                  />
                  <ConfirmDeleteButton
                    description={
                      session.plannedDate
                        ? '该训练已关联今日计划，删除后关联行动会一起消失。'
                        : '删除后无法恢复。'
                    }
                    onConfirm={async () => {
                      await db.transaction(
                        'rw',
                        db.workoutSessions,
                        db.workoutEntries,
                        async () => {
                          await db.workoutEntries
                            .where('sessionId')
                            .equals(session.id)
                            .delete()
                          await db.workoutSessions.delete(session.id)
                        },
                      )
                    }}
                  />
                </Space>
              ),
            },
          ]}
          locale={{ emptyText: '暂无训练记录' }}
        />
      ) : null}

      {activeTab === 'metrics' ? (
        <>
          <div className="subsection-heading">
            <h3>身体指标</h3>
            <Button
              size="small"
              icon={<Plus size={14} />}
              onClick={() => setMetricOpen(true)}
            >
              新增指标
            </Button>
          </div>
          <Table
            rowKey="id"
            dataSource={data?.metrics ?? []}
            pagination={false}
            columns={[
              { title: '日期', dataIndex: 'date' },
              {
                title: '体重',
                dataIndex: 'weight',
                render: (value?: number) => (value ? `${value} kg` : '-'),
              },
              {
                title: '腰围',
                dataIndex: 'waist',
                render: (value?: number) => (value ? `${value} cm` : '-'),
              },
              {
                title: '胸围',
                dataIndex: 'chest',
                render: (value?: number) => (value ? `${value} cm` : '-'),
              },
              { title: '备注', dataIndex: 'note' },
              {
                title: '操作',
                width: 70,
                render: (_, metric) => (
                  <ConfirmDeleteButton
                    onConfirm={() =>
                      repositories.bodyMetrics.remove(metric.id)
                    }
                  />
                ),
              },
            ]}
            locale={{ emptyText: '暂无身体指标' }}
          />
        </>
      ) : null}

      <FormDrawer
        open={planOpen}
        title={editingPlan?.id ? '编辑训练计划' : '新增训练计划'}
        fields={[
          {
            name: 'dayOfWeek',
            label: '训练日',
            input: 'select',
            required: true,
            options: weekdays.map((label, index) => ({
              value: index + 1,
              label,
            })),
          },
          {
            name: 'title',
            label: '训练主题',
            input: 'text',
            required: true,
          },
          {
            name: 'exercisesText',
            label: '动作清单',
            input: 'textarea',
            required: true,
            rows: 7,
            placeholder: '每行一个动作，格式：深蹲|4|8|60',
          },
          { name: 'notes', label: '备注', input: 'textarea' },
        ]}
        initialValues={
          editingPlan
            ? {
                ...editingPlan,
                exercisesText: formatExercises(editingPlan.exercises),
              }
            : { dayOfWeek: 1 }
        }
        onClose={() => setPlanOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            dayOfWeek: Number(values.dayOfWeek),
            title: String(values.title),
            exercises: parseExercises(String(values.exercisesText)),
            notes: values.notes ? String(values.notes) : undefined,
          }
          if (editingPlan?.id) {
            await repositories.fitnessPlans.update(editingPlan.id, payload)
          } else {
            await repositories.fitnessPlans.create(payload)
          }
          setPlanOpen(false)
          message.success('训练计划已保存')
        }}
      />

      <FormDrawer
        open={sessionOpen}
        title={editingSession ? '编辑训练记录' : '记录一次训练'}
        fields={[
          { name: 'title', label: '训练主题', input: 'text', required: true },
          {
            name: 'date',
            label: '训练日期',
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
            name: 'status',
            label: '完成状态',
            input: 'select',
            required: true,
            options: [
              { value: 'pending', label: '待训练' },
              { value: 'in_progress', label: '进行中' },
              { value: 'partial', label: '部分完成' },
              { value: 'completed', label: '完成' },
            ],
          },
          { name: 'notes', label: '训练感受', input: 'textarea' },
        ]}
        initialValues={
          editingSession ?? {
            date: todayString(),
            status: 'pending',
          }
        }
        onClose={() => setSessionOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            title: String(values.title),
            date: String(values.date),
            plannedDate: values.plannedDate
              ? String(values.plannedDate)
              : undefined,
            status: values.status as ActionStatus | 'partial',
            notes: values.notes ? String(values.notes) : undefined,
            completedAt:
              values.status === 'completed'
                ? new Date().toISOString()
                : undefined,
          }
          if (editingSession) {
            await repositories.workoutSessions.update(
              editingSession.id,
              payload,
            )
          } else {
            await repositories.workoutSessions.create(payload)
          }
          setSessionOpen(false)
          message.success('训练记录已保存')
        }}
      />

      <FormDrawer
        open={metricOpen}
        title="新增身体指标"
        fields={[
          {
            name: 'date',
            label: '日期',
            input: 'date',
            required: true,
          },
          {
            name: 'weight',
            label: '体重（kg）',
            input: 'number',
            step: 0.1,
            span: 12,
          },
          {
            name: 'waist',
            label: '腰围（cm）',
            input: 'number',
            step: 0.1,
            span: 12,
          },
          {
            name: 'chest',
            label: '胸围（cm）',
            input: 'number',
            step: 0.1,
            span: 12,
          },
          { name: 'note', label: '备注', input: 'textarea' },
        ]}
        initialValues={{ date: todayString() }}
        onClose={() => setMetricOpen(false)}
        onSubmit={async (values) => {
          await repositories.bodyMetrics.create({
            date: String(values.date),
            weight: values.weight === undefined ? undefined : Number(values.weight),
            waist: values.waist === undefined ? undefined : Number(values.waist),
            chest: values.chest === undefined ? undefined : Number(values.chest),
            note: values.note ? String(values.note) : undefined,
          })
          setMetricOpen(false)
          message.success('身体指标已添加')
        }}
      />

      <SessionEntriesDrawer
        session={entrySession}
        onClose={() => setEntrySession(undefined)}
      />
    </section>
  )
}
