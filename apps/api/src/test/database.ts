import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://soporteqr:soporteqr_dev_password@localhost:5432/soporteqr?schema=integration_test';

export async function prepareTestDatabase(): Promise<void> {
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  const currentDirectory = dirname(fileURLToPath(import.meta.url));
  const apiRoot = resolve(currentDirectory, '../..');
  const repositoryRoot = resolve(apiRoot, '../..');
  const prismaCli = resolve(repositoryRoot, 'node_modules/prisma/build/index.js');
  const schemaPath = resolve(apiRoot, 'prisma/schema.prisma');

  execFileSync(
    process.execPath,
    [prismaCli, 'db', 'push', '--schema', schemaPath, '--skip-generate'],
    { env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }, stdio: 'inherit' },
  );

  const { seedDatabase } = await import('../../prisma/seed.js');
  await seedDatabase();
}

export default prepareTestDatabase;
