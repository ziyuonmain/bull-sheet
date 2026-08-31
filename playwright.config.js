import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  webServer: {
    command: 'node dev_server.js 8088',
    url: 'http://127.0.0.1:8088',
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  },
  use: {
    baseURL: 'http://127.0.0.1:8088',
    headless: true,
    launchOptions: {
      args: ['--mute-audio', '--no-sandbox', '--disable-setuid-sandbox']
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ]
});
