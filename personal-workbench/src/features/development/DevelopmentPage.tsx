import { useState } from 'react'
import {
  App,
  Button,
  Card,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useLiveQuery } from 'dexie-react-hooks'
import { Clock3, Edit3, Plus } from 'lucide-react'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { StatusTag } from '../../components/StatusTag'
import { db, repositories } from '../../db/database'
import { todayString } from '../../lib/date'
import type {
  ActionStatus,
  DevItem,
  DevItemType,
  DevProject,
  DevProjectStatus,
  Priority,
} from '../../domain/types'

const statusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  blocked: '阻塞',
  completed: '已完成',
  active: '进行中',
  paused: '暂停',
  archived: '归档',
}

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export function DevelopmentPage() {
  const { message } = App.useApp()
  const [activeTab, setActiveTab] = useState('items')
  const [projectOpen, setProjectOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<DevProject>()
  const [editingItem, setEditingItem] = useState<DevItem>()
  const [logItem, setLogItem] = useState<DevItem>()
  const [projectFilter, setProjectFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<string>()

  const data = useLiveQuery(
    async () => {
      const projects = await db.devProjects.toArray()
      return {
        projects: projects.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
        items: await db.devItems.orderBy('updatedAt').reverse().toArray(),
        logs: await db.workLogs.orderBy('date').reverse().toArray(),
      }
    },
    [],
  )

  const projects = data?.projects ?? []
  const items = data?.items ?? []
  const logs = data?.logs ?? []
  const projectMap = new Map(projects.map((item) => [item.id, item.name]))
  const visibleItems = items.filter(
    (item) =>
      (!projectFilter || item.projectId === projectFilter) &&
      (!statusFilter || item.status === statusFilter),
  )

  const itemColumns: ColumnsType<DevItem> = [
    {
      title: '任务',
      dataIndex: 'title',
      render: (value, item) => (
        <div>
          <strong>{value}</strong>
          <div className="table-secondary">
            {projectMap.get(item.projectId) ?? '未知项目'}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (value: DevItemType) => (
        <Tag color={value === 'bug' ? 'red' : 'blue'}>
          {value === 'bug' ? '缺陷' : '任务'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: string) => (
        <StatusTag
          label={statusLabels[value] ?? value}
          tone={
            value === 'blocked'
              ? 'danger'
              : value === 'completed'
                ? 'success'
                : value === 'in_progress'
                  ? 'info'
                  : 'neutral'
          }
        />
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 90,
      render: (value: Priority) => priorityLabels[value],
    },
    {
      title: '截止',
      dataIndex: 'dueDate',
      width: 110,
      render: (value: string | undefined) => value ?? '-',
    },
    {
      title: '阻塞 / 下一步',
      dataIndex: 'blocker',
      ellipsis: true,
      render: (_: string, item) =>
        item.blocker ? (
          <Typography.Text type="danger">{item.blocker}</Typography.Text>
        ) : (
          item.nextAction ?? '-'
        ),
    },
    {
      title: '操作',
      width: 150,
      render: (_, item) => (
        <Space size={2}>
          <Button
            type="text"
            size="small"
            icon={<Clock3 size={15} />}
            aria-label={`记录${item.title}工作`}
            onClick={() => {
              setLogItem(item)
              setLogOpen(true)
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<Edit3 size={15} />}
            aria-label={`编辑${item.title}`}
            onClick={() => {
              setEditingItem(item)
              setItemOpen(true)
            }}
          />
          <ConfirmDeleteButton
            description={
              item.plannedDate
                ? '该任务已关联今日计划，删除后关联行动会一起消失。'
                : '删除后无法恢复。'
            }
            onConfirm={async () => {
              await db.transaction(
                'rw',
                db.devItems,
                db.workLogs,
                async () => {
                  await db.workLogs.where('itemId').equals(item.id).delete()
                  await db.devItems.delete(item.id)
                },
              )
            }}
          />
        </Space>
      ),
    },
  ]

  return (
    <section className="page">
      <PageHeader
        title="开发工作"
        description="按项目推进任务、缺陷、阻塞和每日工作记录。"
        actions={
          <>
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingProject(undefined)
                setProjectOpen(true)
              }}
            >
              新增项目
            </Button>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingItem(undefined)
                setItemOpen(true)
              }}
            >
              新增任务或缺陷
            </Button>
          </>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'items', label: `任务与缺陷 ${items.length}` },
          { key: 'projects', label: `项目 ${projects.length}` },
          { key: 'logs', label: `工作记录 ${logs.length}` },
        ]}
      />

      {activeTab === 'items' ? (
        <>
          <div className="filter-row">
            <Select
              allowClear
              value={projectFilter}
              placeholder="全部项目"
              aria-label="项目筛选"
              style={{ width: 190 }}
              onChange={setProjectFilter}
              options={projects.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
            />
            <Select
              allowClear
              value={statusFilter}
              placeholder="全部状态"
              aria-label="状态筛选"
              style={{ width: 160 }}
              onChange={setStatusFilter}
              options={Object.entries(statusLabels)
                .filter(([key]) => key !== 'archived')
                .map(([value, label]) => ({ value, label }))}
            />
          </div>
          <Table
            rowKey="id"
            dataSource={visibleItems}
            columns={itemColumns}
            pagination={{ pageSize: 12, hideOnSinglePage: true }}
            locale={{ emptyText: '暂无开发任务或缺陷' }}
          />
        </>
      ) : null}

      {activeTab === 'projects' ? (
        <div className="project-grid">
          {projects.map((project) => {
            const projectItems = items.filter(
              (item) => item.projectId === project.id,
            )
            return (
              <Card
                key={project.id}
                title={project.name}
                size="small"
                extra={
                  <Space size={2}>
                    <Button
                      type="text"
                      size="small"
                      icon={<Edit3 size={15} />}
                      aria-label={`编辑项目${project.name}`}
                      onClick={() => {
                        setEditingProject(project)
                        setProjectOpen(true)
                      }}
                    />
                    <ConfirmDeleteButton
                      title="删除项目及全部任务？"
                      onConfirm={async () => {
                        await db.transaction(
                          'rw',
                          db.devProjects,
                          db.devItems,
                          db.workLogs,
                          async () => {
                            const itemIds = await db.devItems
                              .where('projectId')
                              .equals(project.id)
                              .primaryKeys()
                            await db.workLogs
                              .where('projectId')
                              .equals(project.id)
                              .delete()
                            await db.workLogs
                              .where('itemId')
                              .anyOf(itemIds)
                              .delete()
                            await db.devItems
                              .where('projectId')
                              .equals(project.id)
                              .delete()
                            await db.devProjects.delete(project.id)
                          },
                        )
                      }}
                    />
                  </Space>
                }
              >
                <StatusTag
                  label={statusLabels[project.status] ?? project.status}
                  tone={
                    project.status === 'active'
                      ? 'info'
                      : project.status === 'completed'
                        ? 'success'
                        : 'neutral'
                  }
                />
                <p className="record-note">
                  {project.description || '暂无项目说明'}
                </p>
                <div className="project-counts">
                  <span>任务 {projectItems.length}</span>
                  <span>
                    阻塞{' '}
                    {
                      projectItems.filter((item) => item.status === 'blocked')
                        .length
                    }
                  </span>
                  <span>
                    完成{' '}
                    {
                      projectItems.filter(
                        (item) => item.status === 'completed',
                      ).length
                    }
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      ) : null}

      {activeTab === 'logs' ? (
        <Table
          rowKey="id"
          dataSource={logs}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          columns={[
            { title: '日期', dataIndex: 'date', width: 120 },
            {
              title: '项目',
              dataIndex: 'projectId',
              render: (value: string) => projectMap.get(value) ?? '-',
            },
            {
              title: '任务',
              dataIndex: 'itemId',
              render: (value: string) =>
                items.find((item) => item.id === value)?.title ?? '-',
            },
            {
              title: '时长',
              dataIndex: 'durationMinutes',
              render: (value: number) => `${value} 分钟`,
            },
            { title: '说明', dataIndex: 'note' },
            {
              title: '操作',
              width: 70,
              render: (_, log) => (
                <ConfirmDeleteButton
                  onConfirm={() => repositories.workLogs.remove(log.id)}
                />
              ),
            },
          ]}
          locale={{ emptyText: '暂无工作记录' }}
        />
      ) : null}

      <FormDrawer
        open={projectOpen}
        title={editingProject ? '编辑开发项目' : '新增开发项目'}
        fields={[
          {
            name: 'name',
            label: '项目名称',
            input: 'text',
            required: true,
          },
          {
            name: 'status',
            label: '项目状态',
            input: 'select',
            required: true,
            options: [
              { value: 'active', label: '进行中' },
              { value: 'paused', label: '暂停' },
              { value: 'completed', label: '已完成' },
              { value: 'archived', label: '归档' },
            ],
          },
          {
            name: 'description',
            label: '项目说明',
            input: 'textarea',
          },
        ]}
        initialValues={editingProject ?? { status: 'active' }}
        onClose={() => setProjectOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            name: String(values.name),
            description: values.description
              ? String(values.description)
              : undefined,
            status: values.status as DevProjectStatus,
          }
          if (editingProject) {
            await repositories.devProjects.update(editingProject.id, payload)
          } else {
            await repositories.devProjects.create(payload)
          }
          setProjectOpen(false)
          message.success(editingProject ? '项目已更新' : '项目已创建')
        }}
      />

      <FormDrawer
        open={itemOpen}
        title={editingItem ? '编辑任务或缺陷' : '新增任务或缺陷'}
        fields={[
          {
            name: 'projectId',
            label: '所属项目',
            input: 'select',
            required: true,
            options: projects.map((project) => ({
              value: project.id,
              label: project.name,
            })),
          },
          { name: 'title', label: '标题', input: 'text', required: true },
          {
            name: 'type',
            label: '类型',
            input: 'select',
            required: true,
            span: 12,
            options: [
              { value: 'task', label: '任务' },
              { value: 'bug', label: '缺陷' },
            ],
          },
          {
            name: 'priority',
            label: '优先级',
            input: 'select',
            required: true,
            span: 12,
            options: Object.entries(priorityLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            span: 12,
            options: [
              { value: 'pending', label: '待处理' },
              { value: 'in_progress', label: '进行中' },
              { value: 'blocked', label: '阻塞' },
              { value: 'completed', label: '已完成' },
            ],
          },
          {
            name: 'milestone',
            label: '版本或阶段',
            input: 'text',
            span: 12,
          },
          {
            name: 'dueDate',
            label: '截止日期',
            input: 'date',
            span: 12,
          },
          {
            name: 'plannedDate',
            label: '安排到今日',
            input: 'date',
            span: 12,
          },
          { name: 'blocker', label: '阻塞原因', input: 'textarea' },
          { name: 'nextAction', label: '下一步行动', input: 'textarea' },
        ]}
        initialValues={
          editingItem ?? {
            type: 'task',
            priority: 'medium',
            status: 'pending',
          }
        }
        onClose={() => setItemOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            projectId: String(values.projectId),
            title: String(values.title),
            type: values.type as DevItemType,
            priority: values.priority as Priority,
            status: values.status as ActionStatus | 'blocked',
            milestone: values.milestone
              ? String(values.milestone)
              : undefined,
            dueDate: values.dueDate ? String(values.dueDate) : undefined,
            plannedDate: values.plannedDate
              ? String(values.plannedDate)
              : undefined,
            blocker: values.blocker ? String(values.blocker) : undefined,
            nextAction: values.nextAction
              ? String(values.nextAction)
              : undefined,
            completedAt:
              values.status === 'completed'
                ? new Date().toISOString()
                : undefined,
          }
          if (editingItem) {
            await repositories.devItems.update(editingItem.id, payload)
          } else {
            await repositories.devItems.create(payload)
          }
          setItemOpen(false)
          message.success(editingItem ? '任务已更新' : '任务已创建')
        }}
      />

      <FormDrawer
        open={logOpen}
        title={logItem ? `记录工作：${logItem.title}` : '记录工作'}
        fields={[
          {
            name: 'date',
            label: '日期',
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
          { name: 'note', label: '工作说明', input: 'textarea' },
        ]}
        initialValues={{ date: todayString() }}
        onClose={() => setLogOpen(false)}
        onSubmit={async (values) => {
          await repositories.workLogs.create({
            projectId: logItem?.projectId,
            itemId: logItem?.id,
            date: String(values.date),
            durationMinutes: Number(values.durationMinutes),
            note: values.note ? String(values.note) : undefined,
          })
          setLogOpen(false)
          message.success('工作记录已添加')
        }}
      />
    </section>
  )
}
