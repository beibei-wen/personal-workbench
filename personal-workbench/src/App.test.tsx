import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './App'

describe('application navigation', () => {
  it('renders the dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '首页总览' }),
    ).toBeInTheDocument()
  })

  it('renders all confirmed top-level navigation entries', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    for (const label of [
      '今日计划',
      '自媒体',
      '开发工作',
      '咨询工作',
      '健身计划',
      '饮食计划',
      '游戏娱乐',
      '数据与设计',
      '学习计划',
    ]) {
      expect(
        screen.getByRole('menuitem', { name: label }),
      ).toBeInTheDocument()
    }
  })
})
