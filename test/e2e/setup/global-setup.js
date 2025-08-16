import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { GenericContainer } from 'testcontainers';

// One Postgres container for THIS service
export default async () => {
  console.log('🚀 Starting PostgreSQL container for e2e (businesses-service)...');

  const container = await new GenericContainer('postgres:15-alpine')
    .withEnvironment({
      POSTGRES_USER: 'testuser',
      POSTGRES_PASSWORD: 'testpass',
      POSTGRES_DB: 'test_businesses_db',
    })
    .withExposedPorts(5432)
    .start();

  const mappedPort = container.getMappedPort(5432);
  console.log(`📦 businesses-service: db port ${mappedPort}`);

  // Read template, inject port, write backend/.env
  const tplPath = resolve(process.cwd(), '.env.test.runtime');
  const outPath = resolve(process.cwd(), '.env');
  const tpl = readFileSync(tplPath, 'utf8');
  const finalEnv = tpl.replace('${TEST_DB_PORT}', String(mappedPort));
  writeFileSync(outPath, finalEnv, 'utf8');

  global.__TEST_CONTAINERS__ = { 'businesses-service': container };
  console.log('✅ Wrote backend/.env and started DB.');
};
