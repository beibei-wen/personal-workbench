import { expect, test } from '@playwright/test'

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`core pages fit a ${viewport.width}x${viewport.height} desktop viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)

    for (const route of [
      '/',
      '/today',
      '/self-media',
      '/development',
      '/consulting',
      '/fitness',
      '/diet',
      '/games',
      '/data-design',
      '/learning',
    ]) {
      await page.goto(`/#${route}`)
      await expect(page.locator('.page')).toBeVisible()
      const dimensions = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
      }))
      expect(dimensions.bodyWidth).toBeLessThanOrEqual(
        dimensions.viewportWidth,
      )
    }

    await page.goto('/')
    await page.waitForTimeout(800)
    await page.screenshot({
      path: `test-results/layout-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    })
  })
}
