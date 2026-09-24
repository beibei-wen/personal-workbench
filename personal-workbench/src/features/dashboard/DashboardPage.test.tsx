import { App as AntApp } from 'antd'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { DATABASE_NAME, clearAllData, db, repositories } from '../../db/database'

describe('dashboard module summaries', () => {
  beforeEach(async () => {
    await db.open()
    await clearAllData()
  })

  afterEach(async () => {
    db.close()
    await indexedDB.deleteDatabase(DATABASE_NAME)
  })

  it('shows real records and opens the source module', async () => {
    const project = await repositories.devProjects.create({
      name: '摘要项目',
      status: 'active',
    })
    await repositories.devItems.create({
      projectId: project.id,
      title: '阻塞摘要任务',
      type: 'bug',
      priority: 'high',
      status: 'blocked',
    })

    render(
      <AntApp>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/development" element={<h1>开发工作目标页</h1>} />
          </Routes>
        </MemoryRouter>
      </AntApp>,
    )

    await waitFor(() =>
      expect(screen.getByText('阻塞摘要任务')).toBeVisible(),
    )
    await userEvent.click(
      screen.getByRole('button', { name: '进入开发工作' }),
    )
    expect(
      screen.getByRole('heading', { name: '开发工作目标页' }),
    ).toBeVisible()
  })
})
