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
import { Edit3, Link2, Plus } from 'lucide-react'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { StatusTag } from '../../components/StatusTag'
import { db, repositories } from '../../db/database'
import type {
  DataDesignDeliverable,
  DataDesignProject,
  DataDesignType,
  Priority,
} from '../../domain/types'

const projectStatusLabels: Record<string, string> = {
  planning: '规划',
  active: '进行中',
  blocked: '阻塞',
  completed: '已完成',
}

export function DataDesignPage() {
  const { message } = App.useApp()
  const [activeTab, setActiveTab] = useState('projects')
  const [projectOpen, setProjectOpen] = useState(false)
  const [deliverableOpen, setDeliverableOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<DataDesignProject>()
  const [editingDeliverable, setEditingDeliverable] =
    useState<DataDesignDeliverable>()
  const [typeFilter, setTypeFilter] = useState<DataDesignType>()

  const data = useLiveQuery(
    async () => {
      const projects = await db.dataDesignProjects.toArray()
      const deliverables = await db.dataDesignDeliverables.toArray()
      return {
        projects: projects.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
        deliverables: deliverables.sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
      }
    },
    [],
  )

  const projects = (data?.projects ?? []).filter(
    (project) => !typeFilter || project.type === typeFilter,
  )
  const deliverables = data?.deliverables ?? []
  const projectMap = new Map(
    (data?.projects ?? []).map((project) => [project.id, project.name]),
  )

  return (
    <section className="page">
      <PageHeader
        title="数据与设计"
        description="管理数据或设计项目的目标、来源、交付物、版本和下一步。"
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
                setEditingDeliverable(undefined)
                setDeliverableOpen(true)
              }}
            >
              新增交付物
            </Button>
          </>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'projects', label: `项目 ${projects.length}` },
          { key: 'deliverables', label: `交付物 ${deliverables.length}` },
        ]}
      />

      {activeTab === 'projects' ? (
        <>
          <div className="filter-row">
            <Space.Compact>
              <Button
                type={!typeFilter ? 'primary' : 'default'}
                onClick={() => setTypeFilter(undefined)}
              >
                全部
              </Button>
              <Button
                type={typeFilter === 'data' ? 'primary' : 'default'}
                onClick={() => setTypeFilter('data')}
              >
                数据项目
              </Button>
              <Button
                type={typeFilter === 'design' ? 'primary' : 'default'}
                onClick={() => setTypeFilter('design')}
              >
                设计项目
              </Button>
            </Space.Compact>
          </div>
          <div className="project-grid">
            {projects.map((project) => {
              const projectDeliverables = deliverables.filter(
                (item) => item.projectId === project.id,
              )
              const completed = projectDeliverables.filter(
                (item) => item.status === 'delivered',
              ).length
              const progress = projectDeliverables.length
                ? Math.round((completed / projectDeliverables.length) * 100)
                : project.status === 'completed'
                  ? 100
                  : 0
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
                        aria-label={`编辑数据设计项目${project.name}`}
                        onClick={() => {
                          setEditingProject(project)
                          setProjectOpen(true)
                        }}
                      />
                      <ConfirmDeleteButton
                        title="删除项目及交付物？"
                        description={
                          project.plannedDate
                            ? '该项目已关联今日计划，删除后关联行动会一起消失。'
                            : '项目及其交付物删除后无法恢复。'
                        }
                        onConfirm={async () => {
                          await db.transaction(
                            'rw',
                            db.dataDesignProjects,
                            db.dataDesignDeliverables,
                            async () => {
                              await db.dataDesignDeliverables
                                .where('projectId')
                                .equals(project.id)
                                .delete()
                              await db.dataDesignProjects.delete(project.id)
                            },
                          )
                        }}
                      />
                    </Space>
                  }
                >
                  <Space wrap>
                    <Tag color={project.type === 'data' ? 'blue' : 'purple'}>
                      {project.type === 'data' ? '数据' : '设计'}
                    </Tag>
                    <StatusTag
                      label={
                        projectStatusLabels[project.status] ?? project.status
                      }
                      tone={
                        project.status === 'completed'
                          ? 'success'
                          : project.status === 'blocked'
                            ? 'danger'
                            : project.status === 'active'
                              ? 'info'
                              : 'neutral'
                      }
                    />
                  </Space>
                  <p className="record-note">
                    {project.objective || '暂无项目目标'}
                  </p>
                  <Progress percent={progress} size="small" />
                  <div className="project-counts">
                    <span>交付物 {projectDeliverables.length}</span>
                    <span>
                      截止 {project.dueDate ?? '未设置'}
                    </span>
                  </div>
                  {project.sourceLinks?.length ? (
                    <div className="record-note">
                      <Link2 size={13} /> {project.sourceLinks.join('，')}
                    </div>
                  ) : null}
                  {project.nextAction ? (
                    <p className="record-note">
                      下一步：{project.nextAction}
                    </p>
                  ) : null}
                </Card>
              )
            })}
          </div>
        </>
      ) : null}

      {activeTab === 'deliverables' ? (
        <Table
          rowKey="id"
          dataSource={deliverables}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          columns={[
            {
              title: '交付物',
              dataIndex: 'name',
              render: (value: string, item) => (
                <div>
                  <strong>{value}</strong>
                  <div className="table-secondary">
                    {projectMap.get(item.projectId) ?? '未知项目'}
                  </div>
                </div>
              ),
            },
            { title: '版本', dataIndex: 'version', width: 100 },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (value: string) => (
                <StatusTag
                  label={
                    value === 'delivered'
                      ? '已交付'
                      : value === 'review'
                        ? '待审核'
                        : '草稿'
                  }
                  tone={
                    value === 'delivered'
                      ? 'success'
                      : value === 'review'
                        ? 'warning'
                        : 'neutral'
                  }
                />
              ),
            },
            { title: '链接', dataIndex: 'link', ellipsis: true },
            {
              title: '操作',
              width: 100,
              render: (_, item) => (
                <Space size={2}>
                  <Button
                    type="text"
                    size="small"
                    icon={<Edit3 size={15} />}
                    aria-label={`编辑交付物${item.name}`}
                    onClick={() => {
                      setEditingDeliverable(item)
                      setDeliverableOpen(true)
                    }}
                  />
                  <ConfirmDeleteButton
                    onConfirm={() =>
                      repositories.dataDesignDeliverables.remove(item.id)
                    }
                  />
                </Space>
              ),
            },
          ]}
          locale={{ emptyText: '暂无交付物' }}
        />
      ) : null}

      <FormDrawer
        open={projectOpen}
        title={editingProject ? '编辑数据或设计项目' : '新增数据或设计项目'}
        fields={[
          {
            name: 'name',
            label: '项目名称',
            input: 'text',
            required: true,
          },
          {
            name: 'type',
            label: '项目类型',
            input: 'select',
            required: true,
            span: 12,
            options: [
              { value: 'data', label: '数据项目' },
              { value: 'design', label: '设计项目' },
            ],
          },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            span: 12,
            options: Object.entries(projectStatusLabels).map(
              ([value, label]) => ({ value, label }),
            ),
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
          { name: 'objective', label: '项目目标', input: 'textarea' },
          {
            name: 'sourceLinks',
            label: '来源或参考链接',
            input: 'textarea',
            placeholder: '每行一个链接或来源',
          },
          { name: 'nextAction', label: '下一步行动', input: 'textarea' },
          { name: 'notes', label: '备注', input: 'textarea' },
        ]}
        initialValues={
          editingProject
            ? {
                ...editingProject,
                sourceLinks: editingProject.sourceLinks?.join('\n'),
              }
            : {
                type: 'data',
                status: 'planning',
                priority: 'medium',
              }
        }
        onClose={() => setProjectOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            name: String(values.name),
            type: values.type as DataDesignType,
            status: values.status as
              | 'planning'
              | 'active'
              | 'blocked'
              | 'completed',
            priority: values.priority as Priority,
            dueDate: values.dueDate ? String(values.dueDate) : undefined,
            plannedDate: values.plannedDate
              ? String(values.plannedDate)
              : undefined,
            objective: values.objective
              ? String(values.objective)
              : undefined,
            sourceLinks: values.sourceLinks
              ? String(values.sourceLinks)
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],
            nextAction: values.nextAction
              ? String(values.nextAction)
              : undefined,
            notes: values.notes ? String(values.notes) : undefined,
            completedAt:
              values.status === 'completed'
                ? new Date().toISOString()
                : undefined,
          }
          if (editingProject) {
            await repositories.dataDesignProjects.update(
              editingProject.id,
              payload,
            )
          } else {
            await repositories.dataDesignProjects.create(payload)
          }
          setProjectOpen(false)
          message.success('项目已保存')
        }}
      />

      <FormDrawer
        open={deliverableOpen}
        title={editingDeliverable ? '编辑交付物' : '新增交付物'}
        fields={[
          {
            name: 'projectId',
            label: '所属项目',
            input: 'select',
            required: true,
            options: (data?.projects ?? []).map((project) => ({
              value: project.id,
              label: project.name,
            })),
          },
          { name: 'name', label: '交付物名称', input: 'text', required: true },
          {
            name: 'status',
            label: '交付状态',
            input: 'select',
            required: true,
            span: 12,
            options: [
              { value: 'draft', label: '草稿' },
              { value: 'review', label: '待审核' },
              { value: 'delivered', label: '已交付' },
            ],
          },
          {
            name: 'version',
            label: '版本',
            input: 'text',
            required: true,
            span: 12,
          },
          { name: 'link', label: '文件或资源链接', input: 'text' },
          { name: 'notes', label: '备注', input: 'textarea' },
        ]}
        initialValues={
          editingDeliverable ?? {
            status: 'draft',
            version: 'v1',
          }
        }
        onClose={() => setDeliverableOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            projectId: String(values.projectId),
            name: String(values.name),
            status: values.status as 'draft' | 'review' | 'delivered',
            version: String(values.version),
            link: values.link ? String(values.link) : undefined,
            notes: values.notes ? String(values.notes) : undefined,
          }
          if (editingDeliverable) {
            await repositories.dataDesignDeliverables.update(
              editingDeliverable.id,
              payload,
            )
          } else {
            await repositories.dataDesignDeliverables.create(payload)
          }
          setDeliverableOpen(false)
          message.success('交付物已保存')
        }}
      />
    </section>
  )
}
