import { Button, Empty } from 'antd'

type EmptyStateProps = {
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="empty-panel">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={description}
      >
        {actionLabel && onAction ? (
          <Button type="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Empty>
    </div>
  )
}
