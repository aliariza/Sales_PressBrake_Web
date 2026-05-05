import { pool } from "./postgres.js";

async function createTables() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS machines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      legacy_no TEXT,
      model TEXT NOT NULL,
      name TEXT,
      press_force_ton NUMERIC,
      bending_length_mm NUMERIC,
      max_thickness_mm NUMERIC,
      price_usd NUMERIC,

      raw_data JSONB DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_machines_legacy_no
    ON machines (legacy_no);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS toolings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      legacy_no TEXT,
      name TEXT NOT NULL,
      v_die_mm NUMERIC NOT NULL,
      punch_radius_mm NUMERIC NOT NULL,
      die_radius_mm NUMERIC NOT NULL,

      raw_data JSONB DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_toolings_legacy_no
    ON toolings (legacy_no);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS options (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      legacy_no TEXT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      price_usd NUMERIC NOT NULL,

      raw_data JSONB DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_options_legacy_no
    ON options (legacy_no);
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      legacy_no TEXT,
      name TEXT NOT NULL,
      tensile_strength_mpa NUMERIC NOT NULL,
      yield_strength_mpa NUMERIC NOT NULL,
      k_factor_default NUMERIC NOT NULL,
      youngs_modulus_mpa NUMERIC NOT NULL,
      recommended_vdie_factor NUMERIC NOT NULL,
      min_thickness_mm NUMERIC NOT NULL,
      max_thickness_mm NUMERIC NOT NULL,

      raw_data JSONB DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_materials_legacy_no
    ON materials (legacy_no);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      legacy_no TEXT,
      quote_code TEXT NOT NULL UNIQUE,

      customer JSONB NOT NULL,
      owner_user_id UUID NOT NULL,
      owner_username TEXT NOT NULL,

      material_id UUID,
      material_name_snapshot TEXT NOT NULL,

      thickness_mm NUMERIC NOT NULL,
      bend_length_mm NUMERIC NOT NULL,

      machine_id UUID,
      machine_model_snapshot TEXT NOT NULL,

      tooling_id UUID,
      tooling_name_snapshot TEXT DEFAULT '',

      selected_options JSONB DEFAULT '[]'::jsonb,

      machine_price_usd NUMERIC NOT NULL,
      options_total_usd NUMERIC NOT NULL,
      grand_total_usd NUMERIC NOT NULL,

      notes TEXT DEFAULT '',
      created_at_legacy TEXT DEFAULT '',

      raw_data JSONB DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_quotes_quote_code
    ON quotes (quote_code);
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
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      legacy_no TEXT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      comments TEXT DEFAULT '',

      raw_data JSONB DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_legacy_no
    ON users (legacy_no);
  `);

  console.log("PostgreSQL tables created successfully.");
  await pool.end();
}

createTables().catch((error) => {
  console.error("Error creating PostgreSQL tables:", error);
  process.exit(1);
});
