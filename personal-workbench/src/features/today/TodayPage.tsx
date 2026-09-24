import { useState } from 'react'
import {
  App,
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Select,
  Space,
  Tooltip,
} from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import dayjs from 'dayjs'
import {
  CalendarClock,
  ExternalLink,
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { SectionPanel } from '../../components/SectionPanel'
import { StatusTag } from '../../components/StatusTag'
import { ListRow, SimpleList } from '../../components/SimpleList'
import { repositories } from '../../db/database'
import type { ActionStatus, Priority } from '../../domain/types'
import {
  createStandaloneTask,
  listOverduePlanItems,
  listPlanItems,
  reschedulePlanItem,
  setPlanItemStatus,
  type PlanItem,
} from '../../services/planner'

const sourceLabels: Record<PlanItem['sourceModule'], string> = {
  standalone: '独立事项',
  'self-media': '自媒体',
  development: '开发工作',
  consulting: '咨询工作',
  fitness: '健身计划',
  diet: '饮食计划',
  games: '游戏娱乐',
  'data-design': '数据与设计',
  learning: '学习计划',
}

function PlanItemRow({
  item,
  onStatusChange,
  onReschedule,
}: {
  item: PlanItem
  onStatusChange: (item: PlanItem, status: ActionStatus) => void
  onReschedule: (item: PlanItem, date: string) => void
}) {
  const navigate = useNavigate()

  return (
    <ListRow
      actions={
        <>
        <Dropdown
          menu={{
            items: [
              {
                key: 'tomorrow',
                label: '延期到明天',
                icon: <CalendarClock size={15} />,
                onClick: () =>
                  onReschedule(
                    item,
                    dayjs(item.plannedDate).add(1, 'day').format('YYYY-MM-DD'),
                  ),
              },
              ...(item.sourceModule !== 'standalone'
                ? [
                    {
                      key: 'source',
                      label: '打开来源模块',
                      icon: <ExternalLink size={15} />,
                      onClick: () => navigate(item.route),
                    },
                  ]
                : []),
            ],
          }}
        >
          <Button
            type="text"
            size="small"
            aria-label={`${item.title}更多操作`}
            icon={<MoreHorizontal size={16} />}
          />
        </Dropdown>
        {item.sourceModule === 'standalone' ? (
          <ConfirmDeleteButton
                onConfirm={() =>
                  repositories.standaloneTasks.remove(item.sourceId)
                }
          />
        ) : null}
        </>
      }
    >
      <Checkbox
        checked={item.status === 'completed'}
        onChange={(event) =>
          onStatusChange(
            item,
            event.target.checked ? 'completed' : 'pending',
          )
        }
      >
        <span
          className={
            item.status === 'completed'
              ? 'plan-title plan-title--completed'
              : 'plan-title'
          }
        >
          {item.title}
        </span>
      </Checkbox>
      <div className="plan-row-meta">
        <StatusTag label={sourceLabels[item.sourceModule]} />
        <StatusTag
          label={item.priority === 'high' ? '高优先' : item.priority}
          tone={
            item.priority === 'high'
              ? 'danger'
              : item.priority === 'medium'
                ? 'warning'
                : 'neutral'
          }
        />
        {item.startTime ? <span>{item.startTime}</span> : null}
      </div>
    </ListRow>
  )
}

export function TodayPage() {
  const { message } = App.useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | ActionStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const today = dayjs().format('YYYY-MM-DD')
  const items = useLiveQuery(() => listPlanItems(today), [today])
  const overdue = useLiveQuery(() => listOverduePlanItems(today), [today])

  const visibleItems = items?.filter(
    (item) =>
      (statusFilter === 'all' || item.status === statusFilter) &&
      (sourceFilter === 'all' || item.sourceModule === sourceFilter),
  )

  const handleStatus = async (item: PlanItem, status: ActionStatus) => {
    await setPlanItemStatus(item, status)
    message.success(status === 'completed' ? '已完成' : '已重新打开')
  }

  const handleReschedule = async (item: PlanItem, date: string) => {
    await reschedulePlanItem(item, date)
    message.success(`已安排到 ${date}`)
  }

  return (
    <section className="page">
      <PageHeader
        title="今日计划"
        description={`${today}，统一安排今天的行动。`}
        actions={
          <Button
            type="primary"
            icon={<Plus size={17} />}
            onClick={() => setDrawerOpen(true)}
          >
            新增独立事项
          </Button>
        }
      />

      <div className="filter-row">
        <Select
          value={statusFilter}
          aria-label="状态筛选"
          style={{ width: 150 }}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'pending', label: '待处理' },
            { value: 'in_progress', label: '进行中' },
            { value: 'completed', label: '已完成' },
          ]}
        />
        <Select
          value={sourceFilter}
          aria-label="来源筛选"
          style={{ width: 170 }}
          onChange={setSourceFilter}
          options={[
            { value: 'all', label: '全部来源' },
            ...Object.entries(sourceLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      {overdue?.length ? (
        <SectionPanel title={`逾期事项 ${overdue.length}`}>
          <SimpleList
            items={overdue}
            renderItem={(item) => (
              <PlanItemRow
                key={item.id}
                item={item}
                onStatusChange={(value, status) =>
                  void handleStatus(value, status)
                }
                onReschedule={(value, date) =>
                  void handleReschedule(value, date)
                }
              />
            )}
          />
        </SectionPanel>
      ) : null}

      <SectionPanel
        title="今天"
        extra={
          <Space>
            <Tooltip title="可修改当前筛选状态">
              <DatePicker value={dayjs(today)} disabled />
            </Tooltip>
          </Space>
        }
      >
        <SimpleList
          items={visibleItems ?? []}
          emptyText="今天暂无符合条件的行动"
          renderItem={(item) => (
            <PlanItemRow
              key={item.id}
              item={item}
              onStatusChange={(value, status) =>
                void handleStatus(value, status)
              }
              onReschedule={(value, date) =>
                void handleReschedule(value, date)
              }
            />
          )}
        />
      </SectionPanel>

      <FormDrawer
        open={drawerOpen}
        title="新增今日独立事项"
        fields={[
          { name: 'title', label: '事项', input: 'text', required: true },
          {
            name: 'plannedDate',
            label: '计划日期',
            input: 'date',
            required: true,
            span: 12,
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
            name: 'startTime',
            label: '开始时间',
            input: 'time',
            span: 12,
          },
          {
            name: 'endTime',
            label: '结束时间',
            input: 'time',
            span: 12,
          },
          { name: 'notes', label: '说明', input: 'textarea' },
        ]}
        initialValues={{
          plannedDate: today,
          priority: 'medium',
        }}
        onClose={() => setDrawerOpen(false)}
        onSubmit={async (values) => {
          await createStandaloneTask({
            title: String(values.title),
            notes: values.notes ? String(values.notes) : undefined,
            plannedDate: String(values.plannedDate),
            startTime: values.startTime
              ? String(values.startTime)
              : undefined,
            endTime: values.endTime ? String(values.endTime) : undefined,
            priority: values.priority as Priority,
          })
          setDrawerOpen(false)
          message.success('今日事项已添加')
        }}
      />
    </section>
  )
}
