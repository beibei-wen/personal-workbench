import { expect, test } from '@playwright/test'

test('development module tracks a blocked task and work log', async ({
  page,
}) => {
  const suffix = Date.now()
  const projectName = `E2E 项目 ${suffix}`
  const taskTitle = `E2E 阻塞任务 ${suffix}`

  await page.goto('/#/development')
  await page.getByRole('button', { name: '新增项目' }).click()
  await page.getByLabel('项目名称').fill(projectName)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await page.getByRole('tab', { name: /项目/ }).click()
  await expect(page.getByText(projectName)).toBeVisible()

  await page.getByRole('tab', { name: /任务与缺陷/ }).click()
  await page.getByRole('button', { name: '新增任务或缺陷' }).click()
  await page.getByLabel('所属项目').click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(projectName, { exact: true })
    .click()
  await page.getByLabel('标题').fill(taskTitle)
  await page.getByRole('combobox', { name: /状态/ }).last().click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText('阻塞', { exact: true })
    .click()
  await page
    .locator('#plannedDate')
    .fill(new Date().toISOString().slice(0, 10))
  await page.keyboard.press('Enter')
  await page.getByLabel('阻塞原因').fill('等待接口权限')
  await page.getByRole('button', { name: /保\s*存/ }).click()

  await expect(page.getByText(taskTitle)).toBeVisible()
  await expect(page.getByText('等待接口权限')).toBeVisible()

  await page.getByRole('button', { name: `记录${taskTitle}工作` }).click()
  await page.getByLabel('时长（分钟）').fill('45')
  await page.getByLabel('工作说明').fill('定位权限问题')
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await page.getByRole('tab', { name: /工作记录/ }).click()
  await expect(page.getByText('定位权限问题')).toBeVisible()

  await page.reload()
  await expect(page.getByText(taskTitle)).toBeVisible()

  const taskRow = page.getByRole('row').filter({ hasText: taskTitle })
  await taskRow.getByRole('button', { name: '删除' }).click()
  await expect(page.getByText(/已关联今日计划/)).toBeVisible()
  await page.getByRole('button', { name: /取\s*消/ }).click()
})

test('consulting module keeps clients, projects and follow-up actions', async ({
  page,
}) => {
  const suffix = Date.now()
  const clientName = `E2E 客户 ${suffix}`
  const projectName = `E2E 咨询项目 ${suffix}`
  const actionTitle = `E2E 客户跟进 ${suffix}`

  await page.goto('/#/consulting')
  await page.getByRole('button', { name: /新增记录/ }).click()
  await page.getByRole('menuitem', { name: '新增客户' }).click()
  await page.getByLabel('客户名称').fill(clientName)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(clientName)).toBeVisible()

  await page.getByRole('button', { name: /新增记录/ }).click()
  await page.getByRole('menuitem', { name: '新增咨询项目' }).click()
  await page.getByRole('combobox', { name: /客户/ }).click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(clientName, { exact: true })
    .click()
  await page.getByLabel('项目名称').fill(projectName)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(projectName)).toBeVisible()

  await page.getByRole('button', { name: /新增记录/ }).click()
  await page.getByRole('menuitem', { name: '新增行动项' }).click()
  await page.getByLabel('所属项目').click()
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(projectName, { exact: true })
    .click()
  await page
    .getByRole('textbox', { name: /行动项/ })
    .fill(actionTitle)
  await page.getByRole('button', { name: /保\s*存/ }).click()

  await page.getByRole('tab', { name: /会议与跟进/ }).click()
  await expect(page.getByText(actionTitle)).toBeVisible()
})
