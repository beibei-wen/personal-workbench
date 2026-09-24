import { expect, test } from '@playwright/test'

test('data and design module keeps projects and deliverables', async ({
  page,
}) => {
  const suffix = Date.now()
  const projectName = `E2E 数据项目 ${suffix}`
  const deliverableName = `E2E 图表交付 ${suffix}`

  await page.goto('/#/data-design')
  await page.getByRole('button', { name: '新增项目' }).click()
  await page.getByLabel('项目名称').fill(projectName)
  await page.getByLabel('项目目标').fill('分析月度趋势')
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(projectName)).toBeVisible()

  await page.getByRole('button', { name: '新增交付物' }).click()
  await page.getByLabel('所属项目').click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(projectName, { exact: true })
    .click()
  await page.getByLabel('交付物名称').fill(deliverableName)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await page.getByRole('tab', { name: /交付物/ }).click()
  await expect(page.getByText(deliverableName)).toBeVisible()
})

test('learning module updates progress and stores notes', async ({ page }) => {
  const suffix = Date.now()
  const itemTitle = `E2E 学习内容 ${suffix}`
  const sessionNote = `E2E 学习记录 ${suffix}`
  const noteContent = `E2E 学习笔记 ${suffix}`

  await page.goto('/#/learning')
  await page.getByRole('button', { name: '新增学习内容' }).click()
  await page.getByLabel('标题').fill(itemTitle)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(itemTitle)).toBeVisible()

  await page.getByRole('button', { name: '记录学习' }).first().click()
  await page.getByRole('combobox', { name: /学习内容/ }).click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(itemTitle, { exact: true })
    .click()
  await page.getByLabel('时长（分钟）').fill('60')
  const progressInputs = page.getByRole('spinbutton', {
    name: /当前进度/,
  })
  await progressInputs.fill('35')
  await page.getByLabel('学习记录').fill(sessionNote)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await page.getByRole('tab', { name: /学习记录/ }).click()
  await expect(page.getByText(sessionNote)).toBeVisible()

  await page.getByRole('tab', { name: /笔记与复习/ }).click()
  await page.getByRole('button', { name: '新增笔记' }).click()
  await page.getByRole('combobox', { name: /学习内容/ }).click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(itemTitle, { exact: true })
    .click()
  await page.getByLabel('笔记内容').fill(noteContent)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(noteContent)).toBeVisible()
})
