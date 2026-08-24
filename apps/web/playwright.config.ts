import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://soporteqr:soporteqr_dev_password@localhost:5432/soporteqr?schema=integration_test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  globalSetup: './e2e/global-setup.ts',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev --workspace=apps/api',
      cwd: repositoryRoot,
      url: 'http://127.0.0.1:4100/api/health',
      timeout: 60_000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: testDatabaseUrl,
        JWT_ACCESS_SECRET: 'test_access_secret_at_least_32_characters_long',
        JWT_REFRESH_SECRET: 'test_refresh_secret_at_least_32_characters_long',
        REFRESH_COOKIE_NAME: 'soporteqr_refresh',
        UPLOAD_DIR: 'uploads-test',
        PORT: '4100',
        CORS_ORIGIN: 'http://127.0.0.1:5174',
        APP_BASE_URL: 'http://127.0.0.1:5174',
      },
    },
    {
      command: 'npm run dev --workspace=apps/web -- --host 127.0.0.1 --port 5174',
      cwd: repositoryRoot,
      url: 'http://127.0.0.1:5174/login',
      timeout: 60_000,
      reuseExistingServer: false,
      env: { VITE_API_BASE_URL: 'http://127.0.0.1:4100' },
    },
  ],
});
