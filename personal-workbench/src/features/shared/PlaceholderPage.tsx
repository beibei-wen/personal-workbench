import { Empty, Typography } from 'antd'

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="page">
      <div className="page-heading">
        <Typography.Title level={2}>{title}</Typography.Title>
        <Typography.Text type="secondary">
          此页面将在对应开发阶段完成。
        </Typography.Text>
      </div>
      <div className="empty-panel">
        <Empty description="功能正在按开发计划建设" />
      </div>
    </section>
  )
}
