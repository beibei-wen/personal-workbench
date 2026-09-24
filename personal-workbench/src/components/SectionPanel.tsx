import type { ReactNode } from 'react'
import { Typography } from 'antd'

type SectionPanelProps = {
  title: string
  extra?: ReactNode
  children: ReactNode
}

export function SectionPanel({ title, extra, children }: SectionPanelProps) {
  return (
    <section className="section-panel">
      <header className="section-panel__header">
        <Typography.Title level={4}>{title}</Typography.Title>
        {extra ? <div>{extra}</div> : null}
      </header>
      <div className="section-panel__body">{children}</div>
    </section>
  )
}
