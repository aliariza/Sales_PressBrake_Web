import { pool } from "./postgres.js";

async function patchQuotesTable() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    );
  `);

  await pool.query(`
    ALTER TABLE quotes
      ADD COLUMN IF NOT EXISTS legacy_no TEXT,
      ADD COLUMN IF NOT EXISTS quote_code TEXT,
      ADD COLUMN IF NOT EXISTS customer JSONB,
      ADD COLUMN IF NOT EXISTS owner_user_id UUID,
      ADD COLUMN IF NOT EXISTS owner_username TEXT,
      ADD COLUMN IF NOT EXISTS material_id UUID,
      ADD COLUMN IF NOT EXISTS material_name_snapshot TEXT,
      ADD COLUMN IF NOT EXISTS thickness_mm NUMERIC,
      ADD COLUMN IF NOT EXISTS bend_length_mm NUMERIC,
      ADD COLUMN IF NOT EXISTS machine_id UUID,
      ADD COLUMN IF NOT EXISTS machine_model_snapshot TEXT,
      ADD COLUMN IF NOT EXISTS tooling_id UUID,
      ADD COLUMN IF NOT EXISTS tooling_name_snapshot TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS machine_price_usd NUMERIC,
      ADD COLUMN IF NOT EXISTS options_total_usd NUMERIC,
      ADD COLUMN IF NOT EXISTS grand_total_usd NUMERIC,
      ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS created_at_legacy TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_quote_code_unique
    ON quotes (quote_code)
    WHERE quote_code IS NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_quotes_created_at
    ON quotes (created_at);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_quotes_owner_user_id
    ON quotes (owner_user_id);
  `);

  await pool.query(`
    UPDATE quotes
    SET owner_username = COALESCE(NULLIF(owner_username, ''), 'legacy-import')
    WHERE owner_username IS NULL OR owner_username = '';
  `);

  console.log("quotes table patched successfully");
  await pool.end();
}

patchQuotesTable().catch((error) => {
  console.error("Error patching quotes table:", error);
  process.exit(1);
});
