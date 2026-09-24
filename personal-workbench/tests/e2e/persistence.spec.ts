import { chromium, expect, test } from '@playwright/test'
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

test('data survives a complete browser process restart', async () => {
  const profileDirectory = await mkdtemp(
    path.join(os.tmpdir(), 'personal-workbench-profile-'),
  )
  const note = `浏览器重启持久化 ${Date.now()}`
  const url = 'http://127.0.0.1:5173'

  const firstContext = await chromium.launchPersistentContext(
    profileDirectory,
    {
      channel: 'chrome',
      headless: true,
    },
  )
  const firstPage = firstContext.pages()[0] ?? (await firstContext.newPage())
  await firstPage.goto(url)
  await firstPage.getByRole('button', { name: '快速备忘' }).click()
  await firstPage.getByLabel('快速备忘内容').fill(note)
  await firstPage
    .getByRole('button', { name: /保\s*存\s*备\s*忘/ })
    .click()
  await expect(
    firstPage.locator('.quick-note-text', { hasText: note }),
  ).toBeVisible()
  await firstContext.close()

  const secondContext = await chromium.launchPersistentContext(
    profileDirectory,
    {
      channel: 'chrome',
      headless: true,
    },
  )
  const secondPage =
    secondContext.pages()[0] ?? (await secondContext.newPage())
  await secondPage.goto(url)
  await expect(
    secondPage.locator('.quick-note-text', { hasText: note }),
  ).toBeVisible()
  await secondContext.close()
})
