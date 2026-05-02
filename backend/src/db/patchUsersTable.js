import { pool } from "./postgres.js";

async function patchUsersTable() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS legacy_no TEXT,
      ADD COLUMN IF NOT EXISTS username TEXT,
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS role TEXT,
      ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  console.log("users table patched");
  await pool.end();
}

patchUsersTable().catch((error) => {
  console.error("Error patching users table:", error);
  process.exit(1);
});