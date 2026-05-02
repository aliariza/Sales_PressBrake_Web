import { pool } from "../db/postgres.js";

function toNumberOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapOptionRow(row) {
  return {
    id: row.id,
    legacyNo: row.legacy_no == null ? "" : String(row.legacy_no),
    code: row.code,
    name: row.name,
    priceUsd: toNumberOrNull(row.price_usd),
    rawData: row.raw_data ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getAllOptions() {
  const result = await pool.query(`
    SELECT
      id,
      legacy_no,
      code,
      name,
      price_usd,
      raw_data,
      created_at,
      updated_at
    FROM options
    ORDER BY created_at ASC
  `);

  return result.rows.map(mapOptionRow);
}

export async function getOptionById(id) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      code,
      name,
      price_usd,
      raw_data,
      created_at,
      updated_at
    FROM options
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapOptionRow(result.rows[0]);
}

export async function getOptionByCode(code) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      code,
      name,
      price_usd,
      raw_data,
      created_at,
      updated_at
    FROM options
    WHERE code = $1
    `,
    [code]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapOptionRow(result.rows[0]);
}

export async function createOption(optionData) {
  const { legacyNo, code, name, priceUsd } = optionData;

  const result = await pool.query(
    `
    INSERT INTO options (
      legacy_no,
      code,
      name,
      price_usd,
      raw_data
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      legacy_no,
      code,
      name,
      price_usd,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      code,
      name,
      priceUsd,
      {
        legacyNo,
        code,
        name,
        priceUsd
      }
    ]
  );

  return mapOptionRow(result.rows[0]);
}

export async function updateOption(id, optionData) {
  const { legacyNo, code, name, priceUsd } = optionData;

  const result = await pool.query(
    `
    UPDATE options
    SET
      legacy_no = $1,
      code = $2,
      name = $3,
      price_usd = $4,
      raw_data = $5,
      updated_at = NOW()
    WHERE id = $6
    RETURNING
      id,
      legacy_no,
      code,
      name,
      price_usd,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      code,
      name,
      priceUsd,
      {
        legacyNo,
        code,
        name,
        priceUsd
      },
      id
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapOptionRow(result.rows[0]);
}

export async function deleteOption(id) {
  const result = await pool.query(
    `
    DELETE FROM options
    WHERE id = $1
    RETURNING
      id,
      legacy_no,
      code,
      name,
      price_usd,
      raw_data,
      created_at,
      updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapOptionRow(result.rows[0]);
}