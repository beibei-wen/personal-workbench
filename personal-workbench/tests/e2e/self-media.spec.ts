import { expect, test } from '@playwright/test'

test('self media content moves through a stage and stores performance data', async ({
  page,
}) => {
  const title = `E2E 自媒体 ${Date.now()}`

  await page.goto('/#/self-media')
  await page.getByRole('button', { name: '新增内容' }).click()
  await page.getByLabel('标题或选题').fill(title)
  await page.getByRole('textbox', { name: /平台/ }).fill('个人网站')
  await page.getByRole('textbox', { name: /内容类型/ }).fill('技术文章')
  await page.getByRole('button', { name: /保\s*存/ }).click()

  await expect(page.getByText(title)).toBeVisible()

  await page.getByLabel(`${title}阶段`).click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText('写作', { exact: true })
    .click()
  const writingColumn = page
    .locator('.kanban-column')
    .filter({ has: page.getByText('写作', { exact: true }) })
  await expect(
    writingColumn.locator('.content-card', { hasText: title }),
  ).toBeVisible()

  await page.getByRole('button', { name: `${title}数据记录` }).click()
  await page.getByLabel('阅读或播放').fill('120')
  await page.getByRole('button', { name: /添\s*加/ }).click()
  await expect(page.getByText('阅读 120')).toBeVisible()

  await page.reload()
  await expect(page.getByText(title)).toBeVisible()
})
