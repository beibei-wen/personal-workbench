import { App as AntApp } from 'antd'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { QuickNotesPanel } from './QuickNotesPanel'
import { DATABASE_NAME, clearAllData, db } from '../../db/database'

describe('quick notes panel', () => {
  beforeEach(async () => {
    await db.open()
    await clearAllData()
  })

  afterEach(async () => {
    db.close()
    await indexedDB.deleteDatabase(DATABASE_NAME)
  })

  it('adds a note and makes it available for later processing', async () => {
    render(
      <AntApp>
        <QuickNotesPanel />
      </AntApp>,
    )

    const input = screen.getByLabelText('快速备忘')
    await userEvent.type(input, '给客户发送会议纪要')
    await waitFor(() =>
      expect(input).toHaveValue('给客户发送会议纪要'),
    )
    await userEvent.click(
      screen.getByRole('button', { name: /记\s*录/ }),
    )

    await waitFor(() =>
      expect(screen.getByText('给客户发送会议纪要')).toBeVisible(),
    )
    expect(screen.getByText('未整理 1 条')).toBeVisible()
  })
})
