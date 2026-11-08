import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: { channel: 'msedge', headless: true, viewport: { width: 1440, height: 1000 } },
  reporter: 'list',
})
