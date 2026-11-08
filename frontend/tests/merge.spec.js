import { test, expect } from '@playwright/test'

test('generate, save, link to supported training, and keep unsupported exercises', async ({ page, request }) => {
  const name = 'Merged flow ' + Date.now()
  let createdId
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  await page.route('**/api/generate_workout', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    workout: days.map((day, index) => ({ day, exercises: index ? [] : [
      { exercise: 'Push ups', sets: 3, repetitions: 10 },
      { exercise: 'Running', sets: 1, repetitions: 20 },
    ] })),
  }) }))
  try {
    await page.goto('http://127.0.0.1:5175/generate')
    await page.getByLabel('Height (cm)').fill('175')
    await page.getByLabel('Weight (kg)').fill('75')
    await page.getByLabel('Age', { exact: true }).fill('30')
    await page.getByLabel('Gender', { exact: true }).selectOption('male')
    await page.getByLabel('Fitness Level').selectOption('beginner')
    await page.getByLabel('Goal', { exact: true }).selectOption('overall-fitness')
    await page.getByRole('button', { name: 'Generate Workout', exact: true }).click()
    await page.getByLabel('Workout name for Monday').fill(name)
    const created = page.waitForResponse(response => response.url().endsWith('/api/create_workout'))
    await page.getByRole('button', { name: 'Save Monday', exact: true }).click()
    createdId = (await (await created).json()).id
    await page.getByRole('link', { name: 'Open your workouts to edit or train →' }).click()
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) })
    await expect(card.getByRole('link', { name: 'Track', exact: true })).toHaveCount(1)
    await expect(card).toContainText('Plan only')
    await card.getByRole('link', { name: 'Track', exact: true }).click()
    await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('Push-ups')
    await expect(page.getByText('From ' + name, { exact: false })).toBeVisible()
    await page.screenshot({ path: 'test-results/merged-training.png', fullPage: true })
    await page.getByRole('link', { name: 'History', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your work, recorded.' })).toBeVisible()
    expect(errors).toEqual([])
  } finally {
    if (createdId) await request.delete('http://127.0.0.1:5175/api/delete_workout/' + createdId, { data: {} })
  }
})

test('provider settings are explicit and never render a secret', async ({ page, request }) => {
  const original = await (await request.get('http://127.0.0.1:5175/api/settings')).json()
  try {
    await page.goto('http://127.0.0.1:5175/settings')
    await expect(page.getByText('GEMINI_API_KEY=your_key_here')).toBeVisible()
    await expect(page.locator('.env-path')).toContainText('flask-server')
    for (const provider of ['openai', 'anthropic', 'deepseek']) {
      await page.getByRole('combobox', { name: 'Provider', exact: true }).selectOption(provider)
      await expect(page.getByText(provider.toUpperCase() + '_API_KEY=your_key_here')).toBeVisible()
      await expect(page.getByRole('link', { name: 'API documentation' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Get an API key' })).toBeVisible()
    }
    await page.getByRole('combobox', { name: 'Provider', exact: true }).selectOption('ollama')
    await page.getByLabel('Ollama model', { exact: true }).fill('a:latest')
    await page.getByRole('button', { name: 'Save provider' }).click()
    await expect(page.getByRole('status')).toContainText('Provider saved')
    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Provider', exact: true })).toHaveValue('ollama')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: 'test-results/merged-settings-mobile.png', fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  } finally {
    await request.put('http://127.0.0.1:5175/api/settings', { data: {
      provider: original.provider, geminiModel: original.geminiModel, ollamaModel: original.ollamaModel,
    } })
  }
})
