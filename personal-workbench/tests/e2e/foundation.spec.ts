import { expect, test } from '@playwright/test'

test('all primary pages open without external network requests', async ({
  page,
}) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) &&
      !url.protocol.startsWith('data')
    ) {
      externalRequests.push(request.url())
    }
  })

  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: '首页总览' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /登录|注册/ }),
  ).toHaveCount(0)

  for (const label of [
    '今日计划',
    '自媒体',
    '开发工作',
    '咨询工作',
    '健身计划',
    '饮食计划',
    '游戏娱乐',
    '数据与设计',
    '学习计划',
  ]) {
    await page.getByRole('menuitem', { name: label }).click()
    await expect(page.getByRole('heading', { name: label })).toBeVisible()
  }

  expect(externalRequests).toEqual([])
})
