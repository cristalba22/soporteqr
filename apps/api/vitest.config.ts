import { defineConfig } from 'vitest/config';

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://soporteqr:soporteqr_dev_password@localhost:5432/soporteqr?schema=integration_test';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    globalSetup: './src/test/database.ts',
    hookTimeout: 30_000,
    testTimeout: 20_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      JWT_ACCESS_SECRET: 'test_access_secret_000000000000',
      JWT_REFRESH_SECRET: 'test_refresh_secret_00000000000',
      CORS_ORIGIN: 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5174',
      APP_BASE_URL: 'http://127.0.0.1:5174',
      UPLOAD_DIR: 'uploads-test',
    },
  },
});
