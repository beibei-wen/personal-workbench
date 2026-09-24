import { Button, Popconfirm } from 'antd'
import { Trash2 } from 'lucide-react'

type ConfirmDeleteButtonProps = {
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  ariaLabel?: string
}

export function ConfirmDeleteButton({
  onConfirm,
  title = '确认删除？',
  description = '删除后无法恢复。',
  ariaLabel = '删除',
}: ConfirmDeleteButtonProps) {
  return (
    <Popconfirm
      title={title}
      description={description}
      okText="删除"
      cancelText="取消"
      okButtonProps={{ danger: true }}
      onConfirm={onConfirm}
    >
      <Button
        danger
        type="text"
        size="small"
        icon={<Trash2 size={15} />}
        aria-label={ariaLabel}
      />
    </Popconfirm>
  )
}
