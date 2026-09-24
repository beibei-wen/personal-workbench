import { Tag } from 'antd'

export type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

const toneColors: Record<StatusTone, string> = {
  neutral: 'default',
  info: 'processing',
  success: 'success',
  warning: 'warning',
  danger: 'error',
}

type StatusTagProps = {
  label: string
  tone?: StatusTone
}

export function StatusTag({ label, tone = 'neutral' }: StatusTagProps) {
  return <Tag color={toneColors[tone]}>{label}</Tag>
}
