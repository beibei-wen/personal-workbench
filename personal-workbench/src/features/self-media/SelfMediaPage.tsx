import { useState } from 'react'
import {
  App,
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
} from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { BarChart3, Edit3, Plus } from 'lucide-react'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { db, repositories } from '../../db/database'
import { todayString } from '../../lib/date'
import type {
  Priority,
  SelfMediaItem,
  SelfMediaStage,
} from '../../domain/types'
import { ListRow, SimpleList } from '../../components/SimpleList'

const stageLabels: Record<SelfMediaStage, string> = {
  idea: '灵感',
  topic: '选题',
  drafting: '写作',
  ready: '待发布',
  published: '已发布',
  review: '复盘',
}

const stages: SelfMediaStage[] = [
  'idea',
  'topic',
  'drafting',
  'ready',
  'published',
  'review',
]

const itemFields = [
  { name: 'title', label: '标题或选题', input: 'text' as const, required: true },
  {
    name: 'platform',
    label: '平台',
    input: 'text' as const,
    required: true,
  },
  {
    name: 'contentType',
    label: '内容类型',
    input: 'text' as const,
    required: true,
  },
  {
    name: 'stage',
    label: '当前阶段',
    input: 'select' as const,
    required: true,
    span: 12,
    options: stages.map((stage) => ({
      value: stage,
      label: stageLabels[stage],
    })),
  },
  {
    name: 'priority',
    label: '优先级',
    input: 'select' as const,
    required: true,
    span: 12,
    options: [
      { value: 'high', label: '高' },
      { value: 'medium', label: '中' },
      { value: 'low', label: '低' },
    ],
  },
  {
    name: 'plannedPublishDate',
    label: '计划发布日期',
    input: 'date' as const,
    span: 12,
  },
  {
    name: 'publishedAt',
    label: '实际发布日期',
    input: 'date' as const,
    span: 12,
  },
  {
    name: 'plannedActionDate',
    label: '安排到今日',
    input: 'date' as const,
    span: 12,
  },
  {
    name: 'actionStatus',
    label: '行动状态',
    input: 'select' as const,
    span: 12,
    options: [
      { value: 'pending', label: '待处理' },
      { value: 'in_progress', label: '进行中' },
      { value: 'completed', label: '已完成' },
    ],
  },
  {
    name: 'actionTitle',
    label: '今日行动标题',
    input: 'text' as const,
    placeholder: '例如：完成文章初稿',
  },
  { name: 'link', label: '内容链接', input: 'text' as const },
  { name: 'outline', label: '核心观点或提纲', input: 'textarea' as const },
  { name: 'nextAction', label: '下一步行动', input: 'textarea' as const },
  { name: 'reviewNotes', label: '复盘备注', input: 'textarea' as const },
]

function toInitialValues(item?: SelfMediaItem) {
  return item ? { ...item } : {
    stage: 'idea',
    priority: 'medium',
    actionStatus: 'pending',
  }
}

function SelfMediaMetricsDrawer({
  item,
  onClose,
}: {
  item?: SelfMediaItem
  onClose: () => void
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const metrics = useLiveQuery(
    () =>
      item
        ? db.selfMediaMetrics
            .where('itemId')
            .equals(item.id)
            .reverse()
            .sortBy('date')
        : [],
    [item?.id],
  )

  const addMetric = async (values: Record<string, unknown>) => {
    if (!item) return
    await repositories.selfMediaMetrics.create({
      itemId: item.id,
      date: String(values.date),
      views: Number(values.views ?? 0),
      likes: Number(values.likes ?? 0),
      comments: Number(values.comments ?? 0),
      shares: Number(values.shares ?? 0),
      note: values.note ? String(values.note) : undefined,
    })
    form.resetFields()
    message.success('数据记录已添加')
  }

  return (
    <Drawer
      title={item ? `数据记录：${item.title}` : '数据记录'}
      open={Boolean(item)}
      size="large"
      onClose={onClose}
    >
      <Form
        form={form}
        layout="inline"
        initialValues={{ date: todayString() }}
        onFinish={addMetric}
        className="metric-form"
      >
        <Form.Item name="date" rules={[{ required: true }]}>
          <Input type="date" aria-label="数据日期" />
        </Form.Item>
        <Form.Item name="views">
          <InputNumber placeholder="阅读/播放" aria-label="阅读或播放" />
        </Form.Item>
        <Form.Item name="likes">
          <InputNumber placeholder="点赞" aria-label="点赞" />
        </Form.Item>
        <Form.Item name="comments">
          <InputNumber placeholder="评论" aria-label="评论" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            添加
          </Button>
        </Form.Item>
      </Form>
      <SimpleList
        items={metrics ?? []}
        emptyText="暂无表现数据"
        renderItem={(metric) => (
          <ListRow
            key={metric.id}
            actions={
              <ConfirmDeleteButton
                onConfirm={() =>
                  repositories.selfMediaMetrics.remove(metric.id)
                }
              />
            }
          >
            <Space wrap>
              <strong>{metric.date}</strong>
              <Tag>阅读 {metric.views ?? 0}</Tag>
              <Tag>点赞 {metric.likes ?? 0}</Tag>
              <Tag>评论 {metric.comments ?? 0}</Tag>
              <Tag>转发 {metric.shares ?? 0}</Tag>
            </Space>
          </ListRow>
        )}
      />
    </Drawer>
  )
}

export function SelfMediaPage() {
  const { message } = App.useApp()
  const [editing, setEditing] = useState<SelfMediaItem>()
  const [formOpen, setFormOpen] = useState(false)
  const [metricItem, setMetricItem] = useState<SelfMediaItem>()
  const [platform, setPlatform] = useState<string>()
  const items = useLiveQuery(
    () => db.selfMediaItems.orderBy('updatedAt').reverse().toArray(),
    [],
  )

  const filteredItems = (items ?? []).filter(
    (item) => !platform || item.platform === platform,
  )
  const platforms = Array.from(
    new Set((items ?? []).map((item) => item.platform)),
  )

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const save = async (values: Record<string, unknown>) => {
    const payload = {
      title: String(values.title),
      platform: String(values.platform),
      contentType: String(values.contentType),
      stage: values.stage as SelfMediaStage,
      priority: values.priority as Priority,
      plannedPublishDate: values.plannedPublishDate
        ? String(values.plannedPublishDate)
        : undefined,
      publishedAt: values.publishedAt
        ? String(values.publishedAt)
        : undefined,
      plannedActionDate: values.plannedActionDate
        ? String(values.plannedActionDate)
        : undefined,
      actionStatus:
        (values.actionStatus as 'pending' | 'in_progress' | 'completed') ??
        'pending',
      actionTitle: values.actionTitle
        ? String(values.actionTitle)
        : undefined,
      link: values.link ? String(values.link) : undefined,
      outline: values.outline ? String(values.outline) : undefined,
      nextAction: values.nextAction ? String(values.nextAction) : undefined,
      reviewNotes: values.reviewNotes
        ? String(values.reviewNotes)
        : undefined,
    }

    if (editing) {
      await repositories.selfMediaItems.update(editing.id, payload)
    } else {
      await repositories.selfMediaItems.create(payload)
    }
    setFormOpen(false)
    message.success(editing ? '内容已更新' : '内容已添加')
  }

  return (
    <section className="page">
      <PageHeader
        title="自媒体"
        description="从灵感、选题、写作到发布和复盘，按内容阶段推进。"
        actions={
          <Button type="primary" icon={<Plus size={17} />} onClick={openCreate}>
            新增内容
          </Button>
        }
      />

      <div className="filter-row">
        <Select
          allowClear
          value={platform}
          placeholder="按平台筛选"
          aria-label="平台筛选"
          style={{ width: 180 }}
          onChange={setPlatform}
          options={platforms.map((value) => ({ value, label: value }))}
        />
      </div>

      {filteredItems.length ? (
        <div className="kanban-board">
          {stages.map((stage) => {
            const stageItems = filteredItems.filter(
              (item) => item.stage === stage,
            )
            return (
              <section className="kanban-column" key={stage}>
                <header>
                  <strong>{stageLabels[stage]}</strong>
                  <span>{stageItems.length}</span>
                </header>
                <div className="kanban-column__items">
                  {stageItems.map((item) => (
                    <Card key={item.id} size="small" className="content-card">
                      <div className="content-card__title">{item.title}</div>
                      <Space size={4} wrap>
                        <Tag>{item.platform}</Tag>
                        <Tag>{item.contentType}</Tag>
                        {item.plannedPublishDate ? (
                          <Tag color="blue">{item.plannedPublishDate}</Tag>
                        ) : null}
                      </Space>
                      {item.nextAction ? (
                        <p className="record-note">{item.nextAction}</p>
                      ) : null}
                      <div className="content-card__actions">
                        <Select
                          size="small"
                          value={item.stage}
                          aria-label={`${item.title}阶段`}
                          onChange={(value) =>
                            void repositories.selfMediaItems.update(item.id, {
                              stage: value,
                            })
                          }
                          options={stages.map((value) => ({
                            value,
                            label: stageLabels[value],
                          }))}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<BarChart3 size={15} />}
                          aria-label={`${item.title}数据记录`}
                          onClick={() => setMetricItem(item)}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<Edit3 size={15} />}
                          aria-label={`编辑${item.title}`}
                          onClick={() => {
                            setEditing(item)
                            setFormOpen(true)
                          }}
                        />
                        <ConfirmDeleteButton
                          description={
                            item.plannedActionDate
                              ? '该内容已关联今日计划，删除后关联行动会一起消失。'
                              : '删除后无法恢复。'
                          }
                          onConfirm={async () => {
                            await db.transaction(
                              'rw',
                              db.selfMediaItems,
                              db.selfMediaMetrics,
                              async () => {
                                await db.selfMediaMetrics
                                  .where('itemId')
                                  .equals(item.id)
                                  .delete()
                                await db.selfMediaItems.delete(item.id)
                              },
                            )
                          }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <Empty description="暂无自媒体内容">
          <Button type="primary" onClick={openCreate}>
            新增第一条内容
          </Button>
        </Empty>
      )}

      <FormDrawer
        open={formOpen}
        title={editing ? '编辑自媒体内容' : '新增自媒体内容'}
        fields={itemFields}
        initialValues={toInitialValues(editing)}
        onClose={() => setFormOpen(false)}
        onSubmit={save}
      />
      <SelfMediaMetricsDrawer
        item={metricItem}
        onClose={() => setMetricItem(undefined)}
      />
    </section>
  )
}
