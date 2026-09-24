import type { CSSProperties } from 'react'
import { Button, Card, Skeleton, Typography } from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, CheckCircle2, Clock3 } from 'lucide-react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { SectionPanel } from '../../components/SectionPanel'
import { StatusTag } from '../../components/StatusTag'
import { ListRow, SimpleList } from '../../components/SimpleList'
import { getDashboardSummaries } from '../../services/dashboard'
import { listOverduePlanItems, listPlanItems } from '../../services/planner'
import { QuickNotesPanel } from '../quick-notes/QuickNotesPanel'
import { navigationItems } from '../../app/navigation'

export function DashboardPage() {
  const navigate = useNavigate()
  const today = dayjs().format('YYYY-MM-DD')
  const planItems = useLiveQuery(() => listPlanItems(today), [today])
  const overdue = useLiveQuery(() => listOverduePlanItems(today), [today])
  const summaries = useLiveQuery(() => getDashboardSummaries(today), [today])

  const completed = planItems?.filter((item) => item.status === 'completed')
    .length
  const pending = (planItems?.length ?? 0) - (completed ?? 0)

  return (
    <section className="page">
      <PageHeader
        title="首页总览"
        description={`${dayjs().format('M月D日 dddd')}，先处理真正重要的事。`}
      />

      <div className="dashboard-insight-strip" aria-label="今日概览">
        <div className="insight-chip insight-chip--green">
          <CheckCircle2 size={16} />
          <span>今日已完成</span>
          <strong>{completed ?? 0}</strong>
        </div>
        <div className="insight-chip insight-chip--blue">
          <Clock3 size={16} />
          <span>仍待处理</span>
          <strong>{Math.max(pending, 0)}</strong>
        </div>
        <div className="insight-chip insight-chip--amber">
          <span className="insight-chip__dot" />
          <span>需要注意</span>
          <strong>{overdue?.length ?? 0}</strong>
        </div>
      </div>

      <div className="dashboard-top-grid">
        <SectionPanel
          title="今日计划"
          extra={
            <Button
              type="link"
              onClick={() => navigate('/today')}
              icon={<ArrowRight size={15} />}
            >
              查看全部
            </Button>
          }
        >
          <div className="metric-strip">
            <div>
              <CheckCircle2 size={18} />
              <span>已完成</span>
              <strong>{completed ?? 0}</strong>
            </div>
            <div>
              <Clock3 size={18} />
              <span>待处理</span>
              <strong>{Math.max(pending, 0)}</strong>
            </div>
            <div>
              <span>逾期</span>
              <strong>{overdue?.length ?? 0}</strong>
            </div>
          </div>
          <SimpleList
            items={planItems?.slice(0, 5) ?? []}
            emptyText="今天还没有计划"
            renderItem={(item) => (
              <ListRow
                key={item.id}
                actions={
                  <StatusTag
                    label={
                      item.status === 'completed' ? '完成' : item.priority
                    }
                    tone={
                      item.status === 'completed'
                        ? 'success'
                        : item.priority === 'high'
                          ? 'danger'
                          : 'neutral'
                    }
                  />
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
              </ListRow>
            )}
          />
        </SectionPanel>

        <SectionPanel title="快速备忘">
          <QuickNotesPanel />
        </SectionPanel>
      </div>

      <Typography.Title level={3} className="dashboard-section-title">
        模块摘要
      </Typography.Title>
      {summaries ? (
        <div className="summary-grid">
          {summaries.map((summary) => {
            const navigation = navigationItems.find(
              (item) => item.path === summary.path,
            )
            const Icon = navigation?.icon
            const summaryStyle = {
              '--summary-accent': navigation?.accent ?? '#1f6f5f',
              '--summary-soft': navigation?.accentSoft ?? '#e9f5f0',
            } as CSSProperties

            return (
              <Card
                key={summary.module}
                size="small"
                className="summary-card"
                style={summaryStyle}
                title={
                  <span className="summary-card__title">
                    <span className="summary-card__icon">
                      {Icon ? <Icon size={16} /> : null}
                    </span>
                    <span>{summary.module}</span>
                  </span>
                }
                extra={
                  <Button
                    type="text"
                    size="small"
                    className="summary-card__arrow"
                    aria-label={`进入${summary.module}`}
                    icon={<ArrowRight size={16} />}
                    onClick={() => navigate(summary.path)}
                  />
                }
              >
              {summary.items.length ? (
                <ul className="summary-list">
                  {summary.items.map((item) => (
                    <li key={item.id}>
                      <span>{item.title}</span>
                      {item.meta ? <small>{item.meta}</small> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography.Text type="secondary">暂无重要事项</Typography.Text>
              )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Skeleton active />
      )}

    </section>
  )
}
