import { neon } from '@neondatabase/serverless';

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_POSTGRES_URL;

export const isDatabaseConfigured = Boolean(databaseUrl);

export const sql = isDatabaseConfigured ? neon(databaseUrl) : null;

export const getDatabaseConfigStatus = () => ({
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
  hasStoragePostgresUrl: Boolean(process.env.STORAGE_POSTGRES_URL),
  activeEnvName: process.env.DATABASE_URL
    ? 'DATABASE_URL'
    : process.env.POSTGRES_URL
      ? 'POSTGRES_URL'
      : process.env.STORAGE_POSTGRES_URL
        ? 'STORAGE_POSTGRES_URL'
        : null
});

export const ensureAppStateTable = async () => {
  if (!sql) {
    throw new Error('Database URL belum dikonfigurasi.');
  }

  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

export const getAppState = async () => {
  await ensureAppStateTable();

  const rows = await sql`
    SELECT payload, updated_at
    FROM app_state
    WHERE id = 'main'
    LIMIT 1
  `;

  return rows[0] || null;
};

export const saveAppState = async (payload) => {
  await ensureAppStateTable();

  const rows = await sql`
    INSERT INTO app_state (id, payload, updated_at)
    VALUES ('main', ${JSON.stringify(payload)}::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = NOW()
    RETURNING updated_at
  `;

  return rows[0] || null;
};

export const patchAppState = async (mutatePayload, fallbackPayload = null) => {
  const currentRecord = await getAppState();
  const basePayload = currentRecord?.payload || fallbackPayload;

  if (!basePayload) {
    throw new Error('Data dasar aplikasi belum tersedia untuk dipatch.');
  }

  const nextPayload = mutatePayload(structuredClone(basePayload));
  return saveAppState(nextPayload);
};

export const testDatabaseConnection = async () => {
  if (!sql) {
    throw new Error('Database URL belum dikonfigurasi.');
  }

  const rows = await sql`SELECT NOW() AS now`;
  return rows[0] || null;
};
