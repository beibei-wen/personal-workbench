import { expect, test } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

test('the built single file persists data when opened directly', async ({
  page,
}) => {
  const fileUrl = pathToFileURL(
    path.resolve(process.cwd(), 'dist', 'index.html'),
  ).toString()
  const note = `file 模式持久化 ${Date.now()}`

  await page.goto(fileUrl)
  await expect(
    page.getByRole('heading', { name: '首页总览' }),
  ).toBeVisible()

  await page.getByRole('button', { name: '快速备忘' }).click()
  await page.getByLabel('快速备忘内容').fill(note)
  await page.getByRole('button', { name: /保\s*存\s*备\s*忘/ }).click()
  await expect(page.locator('.quick-note-text', { hasText: note })).toBeVisible()

  await page.reload()
  await expect(page.locator('.quick-note-text', { hasText: note })).toBeVisible()
})

test('the project entry redirects to the built file when opened directly', async ({
  page,
}) => {
  const entryUrl = pathToFileURL(
    path.resolve(process.cwd(), 'index.html'),
  ).toString()

  await page.goto(entryUrl)
  await expect(
    page.getByRole('heading', { name: '首页总览' }),
  ).toBeVisible()
  expect(page.url()).toContain('/dist/index.html')
})
