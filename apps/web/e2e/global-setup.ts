import { prepareTestDatabase } from '../../api/src/test/database.js';

export default async function globalSetup(): Promise<void> {
  await prepareTestDatabase();
}
