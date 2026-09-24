import { useState } from 'react'
import {
  App,
  Button,
  Card,
  Dropdown,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, Edit3, Plus } from 'lucide-react'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { StatusTag } from '../../components/StatusTag'
import { db, repositories } from '../../db/database'
import { todayString } from '../../lib/date'
import type {
  ActionStatus,
  ConsultingAction,
  ConsultingClient,
  ConsultingMeeting,
  ConsultingProject,
  ConsultingTimeEntry,
} from '../../domain/types'

const formKeys = [
  'client',
  'project',
  'meeting',
  'action',
  'time',
] as const

type FormKey = (typeof formKeys)[number]

const actionStatusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
}

export function ConsultingPage() {
  const { message } = App.useApp()
  const [activeTab, setActiveTab] = useState('projects')
  const [formKey, setFormKey] = useState<FormKey>()
  const [editingClient, setEditingClient] = useState<ConsultingClient>()
  const [editingProject, setEditingProject] = useState<ConsultingProject>()
  const [editingMeeting, setEditingMeeting] = useState<ConsultingMeeting>()
  const [editingAction, setEditingAction] = useState<ConsultingAction>()
  const [editingTime, setEditingTime] = useState<ConsultingTimeEntry>()

  const data = useLiveQuery(
    async () => {
      const clients = await db.consultingClients.toArray()
      const projects = await db.consultingProjects.toArray()
      return {
        clients: clients.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
        projects: projects.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
        meetings: await db.consultingMeetings
          .orderBy('date')
          .reverse()
          .toArray(),
        actions: await db.consultingActions
          .orderBy('updatedAt')
          .reverse()
          .toArray(),
        times: await db.consultingTimeEntries
          .orderBy('date')
          .reverse()
          .toArray(),
      }
    },
    [],
  )

  const clients = data?.clients ?? []
  const projects = data?.projects ?? []
  const meetings = data?.meetings ?? []
  const actions = data?.actions ?? []
  const times = data?.times ?? []
  const clientMap = new Map(clients.map((item) => [item.id, item.name]))
  const projectMap = new Map(projects.map((item) => [item.id, item.name]))

  const openForm = (key: FormKey) => {
    setEditingClient(undefined)
    setEditingProject(undefined)
    setEditingMeeting(undefined)
    setEditingAction(undefined)
    setEditingTime(undefined)
    setFormKey(key)
  }

  return (
    <section className="page">
      <PageHeader
        title="咨询工作"
        description="管理客户、咨询项目、会议、行动项、跟进和工时费用。"
        actions={
          <Dropdown
            menu={{
              items: [
                { key: 'client', label: '新增客户' },
                { key: 'project', label: '新增咨询项目' },
                { key: 'meeting', label: '新增会议' },
                { key: 'action', label: '新增行动项' },
                { key: 'time', label: '记录工时' },
              ],
              onClick: ({ key }) => openForm(key as FormKey),
            }}
          >
            <Button type="primary" icon={<Plus size={16} />}>
              新增记录 <ChevronDown size={15} />
            </Button>
          </Dropdown>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'projects', label: `客户与项目 ${projects.length}` },
          { key: 'followups', label: `会议与跟进 ${actions.length}` },
          { key: 'time', label: `工时与费用 ${times.length}` },
        ]}
      />

      {activeTab === 'projects' ? (
        <div className="split-grid">
          <section>
            <div className="subsection-heading">
              <h3>客户</h3>
              <Button
                size="small"
                icon={<Plus size={14} />}
                onClick={() => openForm('client')}
              >
                新增客户
              </Button>
            </div>
            <div className="stack-grid">
              {clients.map((client) => (
                <Card
                  key={client.id}
                  size="small"
                  title={client.name}
                  extra={
                    <Space size={2}>
                      <StatusTag
                        label={client.status === 'active' ? '合作中' : '停用'}
                        tone={client.status === 'active' ? 'success' : 'neutral'}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit3 size={15} />}
                        aria-label={`编辑客户${client.name}`}
                        onClick={() => {
                          setEditingClient(client)
                          setFormKey('client')
                        }}
                      />
                      <ConfirmDeleteButton
                        title="删除客户及关联项目？"
                        description="客户下的咨询项目、会议、行动项和工时记录会一起删除。"
                        onConfirm={async () => {
                          await db.transaction(
                            'rw',
                            db.consultingClients,
                            db.consultingProjects,
                            db.consultingMeetings,
                            db.consultingActions,
                            db.consultingTimeEntries,
                            async () => {
                              const projectIds =
                                await db.consultingProjects
                                  .where('clientId')
                                  .equals(client.id)
                                  .primaryKeys()
                              if (projectIds.length) {
                                await db.consultingMeetings
                                  .where('projectId')
                                  .anyOf(projectIds)
                                  .delete()
                                await db.consultingActions
                                  .where('projectId')
                                  .anyOf(projectIds)
                                  .delete()
                                await db.consultingTimeEntries
                                  .where('projectId')
                                  .anyOf(projectIds)
                                  .delete()
                              }
                              await db.consultingProjects
                                .where('clientId')
                                .equals(client.id)
                                .delete()
                              await db.consultingClients.delete(client.id)
                            },
                          )
                        }}
                      />
                    </Space>
                  }
                >
                  <p className="record-note">{client.contact || '暂无联系方式'}</p>
                  <p className="record-note">{client.notes || '暂无备注'}</p>
                </Card>
              ))}
              {!clients.length ? <p className="record-note">暂无客户</p> : null}
            </div>
          </section>
          <section>
            <div className="subsection-heading">
              <h3>咨询项目</h3>
              <Button
                size="small"
                icon={<Plus size={14} />}
                onClick={() => openForm('project')}
              >
                新增项目
              </Button>
            </div>
            <div className="stack-grid">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  size="small"
                  title={project.name}
                  extra={
                    <Space size={2}>
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit3 size={15} />}
                        aria-label={`编辑咨询项目${project.name}`}
                        onClick={() => {
                          setEditingProject(project)
                          setFormKey('project')
                        }}
                      />
                      <ConfirmDeleteButton
                        title="删除咨询项目？"
                        description={
                          actions.some(
                            (action) => action.projectId === project.id,
                          )
                            ? '项目中的会议、行动项和工时记录会一起删除，关联今日计划也会消失。'
                            : '项目下的相关记录删除后无法恢复。'
                        }
                        onConfirm={async () => {
                          await db.transaction(
                            'rw',
                            db.consultingProjects,
                            db.consultingMeetings,
                            db.consultingActions,
                            db.consultingTimeEntries,
                            async () => {
                              await db.consultingMeetings
                                .where('projectId')
                                .equals(project.id)
                                .delete()
                              await db.consultingActions
                                .where('projectId')
                                .equals(project.id)
                                .delete()
                              await db.consultingTimeEntries
                                .where('projectId')
                                .equals(project.id)
                                .delete()
                              await db.consultingProjects.delete(project.id)
                            },
                          )
                        }}
                      />
                    </Space>
                  }
                >
                  <Space wrap>
                    <Tag>{clientMap.get(project.clientId) ?? '未知客户'}</Tag>
                    <StatusTag
                      label={{
                        planning: '规划',
                        active: '进行中',
                        paused: '暂停',
                        completed: '已完成',
                      }[project.status]}
                      tone={
                        project.status === 'completed'
                          ? 'success'
                          : project.status === 'active'
                            ? 'info'
                            : 'neutral'
                      }
                    />
                  </Space>
                  <p className="record-note">
                    {project.objective || '暂无项目目标'}
                  </p>
                </Card>
              ))}
              {!projects.length ? (
                <p className="record-note">暂无咨询项目</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'followups' ? (
        <div className="split-grid">
          <section>
            <div className="subsection-heading">
              <h3>会议</h3>
              <Button
                size="small"
                icon={<Plus size={14} />}
                onClick={() => openForm('meeting')}
              >
                新增会议
              </Button>
            </div>
            <Table
              rowKey="id"
              size="small"
              dataSource={meetings}
              pagination={false}
              columns={[
                { title: '日期', dataIndex: 'date', width: 105 },
                {
                  title: '主题',
                  dataIndex: 'title',
                  render: (value: string, item) => (
                    <div>
                      <strong>{value}</strong>
                      <div className="table-secondary">
                        {projectMap.get(item.projectId) ?? '未知项目'}
                      </div>
                    </div>
                  ),
                },
                {
                  title: '操作',
                  width: 70,
                  render: (_, item) => (
                    <Space size={2}>
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit3 size={15} />}
                        aria-label={`编辑会议${item.title}`}
                        onClick={() => {
                          setEditingMeeting(item)
                          setFormKey('meeting')
                        }}
                      />
                      <ConfirmDeleteButton
                        onConfirm={() =>
                          repositories.consultingMeetings.remove(item.id)
                        }
                      />
                    </Space>
                  ),
                },
              ]}
              locale={{ emptyText: '暂无会议' }}
            />
          </section>
          <section>
            <div className="subsection-heading">
              <h3>行动项与跟进</h3>
              <Button
                size="small"
                icon={<Plus size={14} />}
                onClick={() => openForm('action')}
              >
                新增行动项
              </Button>
            </div>
            <Table
              rowKey="id"
              size="small"
              dataSource={actions}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              columns={[
                {
                  title: '行动项',
                  dataIndex: 'title',
                  render: (value: string, item) => (
                    <div>
                      <strong>{value}</strong>
                      <div className="table-secondary">
                        {projectMap.get(item.projectId) ?? '未知项目'}
                      </div>
                    </div>
                  ),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 90,
                  render: (value: string) => (
                    <StatusTag
                      label={actionStatusLabels[value] ?? value}
                      tone={
                        value === 'completed'
                          ? 'success'
                          : value === 'in_progress'
                            ? 'info'
                            : 'warning'
                      }
                    />
                  ),
                },
                {
                  title: '截止 / 跟进',
                  dataIndex: 'dueDate',
                  width: 115,
                  render: (value: string | undefined, item) =>
                    value ?? item.plannedDate ?? '-',
                },
                {
                  title: '操作',
                  width: 70,
                  render: (_, item) => (
                    <Space size={2}>
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit3 size={15} />}
                        aria-label={`编辑行动项${item.title}`}
                        onClick={() => {
                          setEditingAction(item)
                          setFormKey('action')
                        }}
                      />
                      <ConfirmDeleteButton
                        description={
                          item.plannedDate
                            ? '该行动项已关联今日计划，删除后关联行动会一起消失。'
                            : '删除后无法恢复。'
                        }
                        onConfirm={() =>
                          repositories.consultingActions.remove(item.id)
                        }
                      />
                    </Space>
                  ),
                },
              ]}
              locale={{ emptyText: '暂无行动项' }}
            />
          </section>
        </div>
      ) : null}

      {activeTab === 'time' ? (
        <>
          <div className="subsection-heading">
            <h3>工时与费用记录</h3>
            <Button
              size="small"
              icon={<Plus size={14} />}
              onClick={() => openForm('time')}
            >
              记录工时
            </Button>
          </div>
          <Table
            rowKey="id"
            dataSource={times}
            pagination={{ pageSize: 12, hideOnSinglePage: true }}
            columns={[
              { title: '日期', dataIndex: 'date', width: 120 },
              {
                title: '项目',
                dataIndex: 'projectId',
                render: (value: string) => projectMap.get(value) ?? '-',
              },
              {
                title: '时长',
                dataIndex: 'durationMinutes',
                render: (value: number) => `${value} 分钟`,
              },
              {
                title: '费用',
                dataIndex: 'fee',
                render: (value?: number) => (value ? `¥${value}` : '-'),
              },
              { title: '说明', dataIndex: 'note' },
              {
                title: '操作',
                width: 70,
                render: (_, item) => (
                  <Space size={2}>
                    <Button
                      type="text"
                      size="small"
                      icon={<Edit3 size={15} />}
                      aria-label={`编辑工时${item.date}`}
                      onClick={() => {
                        setEditingTime(item)
                        setFormKey('time')
                      }}
                    />
                    <ConfirmDeleteButton
                      onConfirm={() =>
                        repositories.consultingTimeEntries.remove(item.id)
                      }
                    />
                  </Space>
                ),
              },
            ]}
            locale={{ emptyText: '暂无工时记录' }}
          />
        </>
      ) : null}

      <FormDrawer
        open={formKey === 'client'}
        title={editingClient ? '编辑客户' : '新增客户'}
        fields={[
          {
            name: 'name',
            label: '客户名称',
            input: 'text',
            required: true,
          },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            options: [
              { value: 'active', label: '合作中' },
              { value: 'inactive', label: '停用' },
            ],
          },
          { name: 'contact', label: '联系方式', input: 'text' },
          { name: 'notes', label: '备注', input: 'textarea' },
        ]}
        initialValues={editingClient ?? { status: 'active' }}
        onClose={() => setFormKey(undefined)}
        onSubmit={async (values) => {
          const payload = {
            name: String(values.name),
            status: values.status as 'active' | 'inactive',
            contact: values.contact ? String(values.contact) : undefined,
            notes: values.notes ? String(values.notes) : undefined,
          }
          if (editingClient) {
            await repositories.consultingClients.update(
              editingClient.id,
              payload,
            )
          } else {
            await repositories.consultingClients.create(payload)
          }
          setFormKey(undefined)
          message.success('客户已保存')
        }}
      />

      <FormDrawer
        open={formKey === 'project'}
        title={editingProject ? '编辑咨询项目' : '新增咨询项目'}
        fields={[
          {
            name: 'clientId',
            label: '客户',
            input: 'select',
            required: true,
            options: clients.map((client) => ({
              value: client.id,
              label: client.name,
            })),
          },
          { name: 'name', label: '项目名称', input: 'text', required: true },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            span: 12,
            options: [
              { value: 'planning', label: '规划' },
              { value: 'active', label: '进行中' },
              { value: 'paused', label: '暂停' },
              { value: 'completed', label: '已完成' },
            ],
          },
          {
            name: 'startDate',
            label: '开始日期',
            input: 'date',
            span: 12,
          },
          { name: 'endDate', label: '结束日期', input: 'date', span: 12 },
          { name: 'objective', label: '项目目标', input: 'textarea' },
        ]}
        initialValues={editingProject ?? { status: 'active' }}
        onClose={() => setFormKey(undefined)}
        onSubmit={async (values) => {
          const payload = {
            clientId: String(values.clientId),
            name: String(values.name),
            objective: values.objective
              ? String(values.objective)
              : undefined,
            status: values.status as
              | 'planning'
              | 'active'
              | 'paused'
              | 'completed',
            startDate: values.startDate
              ? String(values.startDate)
              : undefined,
            endDate: values.endDate ? String(values.endDate) : undefined,
          }
          if (editingProject) {
            await repositories.consultingProjects.update(
              editingProject.id,
              payload,
            )
          } else {
            await repositories.consultingProjects.create(payload)
          }
          setFormKey(undefined)
          message.success('咨询项目已保存')
        }}
      />

      <FormDrawer
        open={formKey === 'meeting'}
        title={editingMeeting ? '编辑会议' : '新增会议'}
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
          {
            name: 'date',
            label: '日期',
            input: 'date',
            required: true,
            span: 12,
          },
          {
            name: 'title',
            label: '会议主题',
            input: 'text',
            required: true,
          },
          { name: 'participants', label: '参与说明', input: 'text' },
          { name: 'notes', label: '会议记录', input: 'textarea' },
        ]}
        initialValues={editingMeeting ?? {}}
        onClose={() => setFormKey(undefined)}
        onSubmit={async (values) => {
          const payload = {
            projectId: String(values.projectId),
            date: String(values.date),
            title: String(values.title),
            participants: values.participants
              ? String(values.participants)
              : undefined,
            notes: values.notes ? String(values.notes) : undefined,
          }
          if (editingMeeting) {
            await repositories.consultingMeetings.update(
              editingMeeting.id,
              payload,
            )
          } else {
            await repositories.consultingMeetings.create(payload)
          }
          setFormKey(undefined)
          message.success('会议已保存')
        }}
      />

      <FormDrawer
        open={formKey === 'action'}
        title={editingAction ? '编辑行动项' : '新增行动项'}
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
          {
            name: 'meetingId',
            label: '关联会议',
            input: 'select',
            options: meetings.map((meeting) => ({
              value: meeting.id,
              label: `${meeting.date} ${meeting.title}`,
            })),
          },
          { name: 'title', label: '行动项', input: 'text', required: true },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            span: 12,
            options: Object.entries(actionStatusLabels).map(
              ([value, label]) => ({ value, label }),
            ),
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
          { name: 'ownerNote', label: '负责人说明', input: 'text' },
          { name: 'result', label: '跟进结果', input: 'textarea' },
        ]}
        initialValues={editingAction ?? { status: 'pending' }}
        onClose={() => setFormKey(undefined)}
        onSubmit={async (values) => {
          const payload = {
            projectId: String(values.projectId),
            meetingId: values.meetingId
              ? String(values.meetingId)
              : undefined,
            title: String(values.title),
            status: values.status as ActionStatus,
            dueDate: values.dueDate ? String(values.dueDate) : undefined,
            plannedDate: values.plannedDate
              ? String(values.plannedDate)
              : undefined,
            ownerNote: values.ownerNote
              ? String(values.ownerNote)
              : undefined,
            result: values.result ? String(values.result) : undefined,
            completedAt:
              values.status === 'completed'
                ? new Date().toISOString()
                : undefined,
          }
          if (editingAction) {
            await repositories.consultingActions.update(
              editingAction.id,
              payload,
            )
          } else {
            await repositories.consultingActions.create(payload)
          }
          setFormKey(undefined)
          message.success('行动项已保存')
        }}
      />

      <FormDrawer
        open={formKey === 'time'}
        title={editingTime ? '编辑工时与费用' : '记录工时与费用'}
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
            min: 1,
            required: true,
            span: 12,
          },
          {
            name: 'fee',
            label: '费用',
            input: 'number',
            min: 0,
            step: 0.01,
            span: 12,
          },
          { name: 'note', label: '说明', input: 'textarea' },
        ]}
        initialValues={{
          ...(editingTime ?? {}),
          date: editingTime?.date ?? todayString(),
        }}
        onClose={() => setFormKey(undefined)}
        onSubmit={async (values) => {
          const payload = {
            projectId: String(values.projectId),
            date: String(values.date),
            durationMinutes: Number(values.durationMinutes),
            fee: values.fee === undefined ? undefined : Number(values.fee),
            note: values.note ? String(values.note) : undefined,
          }
          if (editingTime) {
            await repositories.consultingTimeEntries.update(
              editingTime.id,
              payload,
            )
          } else {
            await repositories.consultingTimeEntries.create(payload)
          }
          setFormKey(undefined)
          message.success('工时记录已保存')
        }}
      />
    </section>
  )
}
