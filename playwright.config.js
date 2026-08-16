import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  webServer: {
    command: 'node dev_server.js 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 10000
  },
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    launchOptions: {
      args: ['--mute-audio']
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ]
});
