import { expect, test, type Page } from '@playwright/test'

async function addTodayItem(page: Page, title: string) {
  await page.goto('/#/today')
  await page.getByRole('button', { name: '新增独立事项' }).click()
  await page.getByRole('textbox', { name: /事项/ }).fill(title)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(title)).toBeVisible()
}

test('exports and restores a complete local backup', async ({ page }) => {
  const suffix = Date.now()
  const firstTitle = `备份前事项 ${suffix}`
  const secondTitle = `备份后事项 ${suffix}`

  await addTodayItem(page, firstTitle)
  await page.goto('/#/backup')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出备份' }).click()
  const download = await downloadPromise
  const backupPath = await download.path()
  expect(backupPath).not.toBeNull()

  await addTodayItem(page, secondTitle)
  await page.goto('/#/backup')
  await page
    .getByLabel('选择备份文件')
    .setInputFiles(backupPath!)

  await expect(
    page.getByRole('dialog', { name: '恢复备份摘要' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /取\s*消/ }).click()
  await page.goto('/#/today')
  await expect(page.getByText(secondTitle)).toBeVisible()

  await page.goto('/#/backup')
  await page
    .getByLabel('选择备份文件')
    .setInputFiles(backupPath!)
  await expect(
    page.getByRole('dialog', { name: '恢复备份摘要' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /恢复并替换/ }).click()
  await expect(page.locator('.ant-modal-confirm-title')).toHaveText(
    '确认恢复并替换当前数据？',
  )
  await page.getByRole('button', { name: /确认恢复/ }).click()

  await page.goto('/#/today')
  await expect(page.getByText(firstTitle)).toBeVisible()
  await expect(page.getByText(secondTitle)).toHaveCount(0)
})

test('rejects an invalid backup without changing current data', async ({
  page,
}) => {
  const title = `无效备份保护 ${Date.now()}`
  await addTodayItem(page, title)
  await page.goto('/#/backup')

  await page.getByLabel('选择备份文件').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  })

  await expect(page.getByText('备份文件不是有效的 JSON')).toBeVisible()
  await page.goto('/#/today')
  await expect(page.getByText(title)).toBeVisible()
})
