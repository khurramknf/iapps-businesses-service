export default async () => {
  const containers = global.__TEST_CONTAINERS__ || {};
  console.log('🛑 Stopping PostgreSQL containers...');
  for (const [name, c] of Object.entries(containers)) {
    console.log(`🛑 ${name}`);
    await c.stop();
  }
  console.log('✅ All containers stopped.');
};
