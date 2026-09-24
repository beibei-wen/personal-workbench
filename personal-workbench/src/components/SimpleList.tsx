import type { ReactNode } from 'react'

type SimpleListProps<T> = {
  items: T[]
  renderItem: (item: T) => ReactNode
  emptyText?: string
  className?: string
}

export function SimpleList<T>({
  items,
  renderItem,
  emptyText = '暂无记录',
  className,
}: SimpleListProps<T>) {
  if (!items.length) {
    return <div className="simple-list-empty">{emptyText}</div>
  }

  return (
    <div className={className ? `simple-list ${className}` : 'simple-list'}>
      {items.map(renderItem)}
    </div>
  )
}

type ListRowProps = {
  children: ReactNode
  actions?: ReactNode
}

export function ListRow({ children, actions }: ListRowProps) {
  return (
    <div className="simple-list-row">
      <div className="simple-list-row__content">{children}</div>
      {actions ? <div className="simple-list-row__actions">{actions}</div> : null}
    </div>
  )
}
