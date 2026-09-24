import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { EmptyState } from './EmptyState'
import { FormDrawer } from './FormDrawer'
import { PageHeader } from './PageHeader'

describe('shared UI components', () => {
  it('renders a page heading and action', async () => {
    const onAction = vi.fn()
    render(
      <PageHeader
        title="测试页面"
        description="页面说明"
        actions={<button onClick={onAction}>新增</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: '测试页面' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: '新增' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('only confirms deletion after explicit confirmation', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmDeleteButton onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole('button', { name: '删除' }))
    expect(onConfirm).not.toHaveBeenCalled()

    const confirmTitle = await screen.findByText('确认删除？')
    const popconfirm = confirmTitle.closest('.ant-popconfirm')
    expect(popconfirm).not.toBeNull()
    await userEvent.click(
      within(popconfirm as HTMLElement).getByRole('button', {
        name: /删\s*除/,
      }),
    )
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('renders a useful empty state with an action', async () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        description="暂无内容"
        actionLabel="立即新增"
        onAction={onAction}
      />,
    )

    expect(screen.getByText('暂无内容')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: '立即新增' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('validates and submits a form drawer', async () => {
    const onSubmit = vi.fn()
    render(
      <FormDrawer
        open
        title="新增记录"
        fields={[
          { name: 'title', label: '标题', input: 'text', required: true },
        ]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    await userEvent.click(
      screen.getByRole('button', { name: /保\s*存/ }),
    )
    expect(await screen.findByText('请填写标题')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText('标题'), '第一条记录')
    await userEvent.click(
      screen.getByRole('button', { name: /保\s*存/ }),
    )
    expect(onSubmit).toHaveBeenCalledWith({ title: '第一条记录' })
  })
})
