import { expect, test } from '@playwright/test'

test('quick note becomes a persistent completed today item', async ({
  page,
}) => {
  const note = `E2E 快速备忘 ${Date.now()}`

  await page.goto('/')
  await page.getByRole('button', { name: '快速备忘' }).click()
  await page.getByLabel('快速备忘内容').fill(note)
  await page.getByRole('button', { name: /保\s*存\s*备\s*忘/ }).click()

  await expect(page.locator('.quick-note-text', { hasText: note })).toBeVisible()
  await page.getByRole('button', { name: '整理到模块' }).click()
  await page.getByRole('button', { name: /转\s*换/ }).click()

  await page.getByRole('menuitem', { name: '今日计划' }).click()
  const checkbox = page.getByRole('checkbox', { name: note })
  await expect(checkbox).toBeVisible()
  await checkbox.click()
  await expect(checkbox).toBeChecked()

  await page.reload()
  await expect(page.getByRole('checkbox', { name: note })).toBeChecked()
})
