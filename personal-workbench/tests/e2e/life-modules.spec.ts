import { expect, test } from '@playwright/test'

test('fitness module records plans, sessions, exercises and body metrics', async ({
  page,
}) => {
  const suffix = Date.now()
  const planTitle = `E2E 下肢 ${suffix}`
  const sessionTitle = `E2E 训练 ${suffix}`

  await page.goto('/#/fitness')
  await page.getByRole('button', { name: '新增训练计划' }).click()
  await page.getByLabel('训练主题').fill(planTitle)
  await page.getByLabel('动作清单').fill('深蹲|4|8|60\n硬拉|3|5|80')
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(planTitle)).toBeVisible()
  await expect(page.getByText(/深蹲 4x8 60kg/)).toBeVisible()

  await page.getByRole('button', { name: '记录训练' }).click()
  await page.getByLabel('训练主题').fill(sessionTitle)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await page.getByRole('tab', { name: /训练记录/ }).click()
  await expect(page.getByText(sessionTitle)).toBeVisible()

  await page.getByRole('button', { name: `记录${sessionTitle}动作` }).click()
  await page.getByLabel('动作名称').fill('深蹲')
  await page.getByLabel('组数').fill('4')
  await page.getByLabel('次数').fill('8')
  await page.getByLabel('重量').fill('60')
  await page.getByRole('button', { name: /添\s*加/ }).click()
  await expect(page.getByText('4 组')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.ant-drawer-open')).toHaveCount(0)

  await page.getByRole('tab', { name: /身体指标/ }).click()
  await page.getByRole('button', { name: '新增指标' }).click()
  await page
    .getByRole('dialog', { name: '新增身体指标' })
    .locator('input#weight')
    .fill('72.5')
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(/72\.5/)).toBeVisible()
})

test('diet module records meals, water and shopping', async ({ page }) => {
  const suffix = Date.now()
  const meal = `E2E 早餐 ${suffix}`
  const shoppingItem = `E2E 鸡胸肉 ${suffix}`

  await page.goto('/#/diet')
  await page.getByRole('button', { name: '安排饮食' }).click()
  await page.getByLabel('计划饮食').fill(meal)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(meal)).toBeVisible()

  await page.getByRole('button', { name: '+250 ml' }).click()
  await expect(page.getByText('250', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '清除今日饮水' }).click()
  await page
    .locator('.ant-popconfirm:visible')
    .getByRole('button', { name: /删\s*除/ })
    .click()
  await expect(page.getByText('已记录 0 次饮水')).toBeVisible()

  await page.getByRole('button', { name: '新增食材' }).click()
  await page.getByLabel('食材').fill(shoppingItem)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(shoppingItem)).toBeVisible()
})

test('games module stores current state and play session', async ({ page }) => {
  const suffix = Date.now()
  const gameName = `E2E 游戏 ${suffix}`
  const progress = `E2E 进展 ${suffix}`

  await page.goto('/#/games')
  await page.getByRole('button', { name: '新增游戏' }).click()
  await page.getByLabel('游戏名称').fill(gameName)
  await page.getByLabel('平台').fill('PC')
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(gameName)).toBeVisible()

  await page.getByRole('button', { name: `${gameName}游玩记录` }).click()
  await page.getByRole('button', { name: '记录游玩' }).click()
  await page.getByLabel('时长（分钟）').fill('90')
  await page.getByLabel('本次进展').fill(progress)
  await page.getByRole('button', { name: /保\s*存/ }).click()
  await expect(page.getByText(progress)).toBeVisible()

  await page.reload()
  await expect(page.getByText(gameName)).toBeVisible()
})
