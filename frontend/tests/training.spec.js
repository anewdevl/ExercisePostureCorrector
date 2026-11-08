import { test, expect } from '@playwright/test'

test('posture landing, real history, and denied camera state', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError') }
  })
  await page.goto('http://127.0.0.1:5175/train')
  await expect(page.getByRole('button', { name: 'Start session' })).toBeEnabled()
  await page.screenshot({ path: 'test-results/posture-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Start session' }).click()
  await expect(page.getByRole('alert')).toContainText('Camera permission was denied')
  await page.getByRole('button', { name: 'History', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your first session is ahead of you.' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Train', exact: true }).click()
  await page.screenshot({ path: 'test-results/posture-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  expect(errors).toEqual([])
})

test('camera session processes synthetic frames and releases tracks on stop', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 640; canvas.height = 480
      const context = canvas.getContext('2d')
      context.fillStyle = '#777'; context.fillRect(0, 0, 640, 480)
      const stream = canvas.captureStream(10)
      window.testCameraStream = stream
      window.testCameraCanvas = canvas
      return stream
    }
  })
  await page.goto('http://127.0.0.1:5175/train')
  await page.getByRole('button', { name: 'Start session' }).click()
  await expect(page.getByText('Move your whole body into view')).toBeVisible({ timeout: 20000 })
  await expect(page.getByRole('button', { name: 'History', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Stop & save' }).click()
  await expect(page.getByRole('status')).toContainText('No tracked movement was recorded.')
  expect(await page.evaluate(() => window.testCameraStream.getTracks().every(track => track.readyState === 'ended'))).toBeTruthy()
  await expect(page.getByRole('button', { name: 'Start session' })).toBeEnabled()
})
