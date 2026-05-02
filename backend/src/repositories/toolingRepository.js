import { pool } from "../db/postgres.js";

function toNumberOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapToolingRow(row) {
  return {
    id: row.id,
    legacyNo: row.legacy_no == null ? "" : String(row.legacy_no),
    name: row.name,
    vDieMm: toNumberOrNull(row.v_die_mm),
    punchRadiusMm: toNumberOrNull(row.punch_radius_mm),
    dieRadiusMm: toNumberOrNull(row.die_radius_mm),
    rawData: row.raw_data ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getAllToolings() {
  const result = await pool.query(`
    SELECT
      id,
      legacy_no,
      name,
      v_die_mm,
      punch_radius_mm,
      die_radius_mm,
      raw_data,
      created_at,
      updated_at
    FROM toolings
    ORDER BY created_at ASC
  `);

  return result.rows.map(mapToolingRow);
}

export async function getToolingById(id) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      name,
      v_die_mm,
      punch_radius_mm,
      die_radius_mm,
      raw_data,
      created_at,
      updated_at
    FROM toolings
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapToolingRow(result.rows[0]);
}

export async function createTooling(toolingData) {
  const { legacyNo, name, vDieMm, punchRadiusMm, dieRadiusMm } = toolingData;

  const result = await pool.query(
    `
    INSERT INTO toolings (
      legacy_no,
      name,
      v_die_mm,
      punch_radius_mm,
      die_radius_mm,
      raw_data
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      legacy_no,
      name,
      v_die_mm,
      punch_radius_mm,
      die_radius_mm,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      name,
      vDieMm,
      punchRadiusMm,
      dieRadiusMm,
      {
        legacyNo,
        name,
        vDieMm,
        punchRadiusMm,
        dieRadiusMm
      }
    ]
  );

  return mapToolingRow(result.rows[0]);
}

export async function updateTooling(id, toolingData) {
  const { legacyNo, name, vDieMm, punchRadiusMm, dieRadiusMm } = toolingData;

  const result = await pool.query(
    `
    UPDATE toolings
    SET
      legacy_no = $1,
      name = $2,
      v_die_mm = $3,
      punch_radius_mm = $4,
      die_radius_mm = $5,
      raw_data = $6,
      updated_at = NOW()
    WHERE id = $7
    RETURNING
      id,
      legacy_no,
      name,
      v_die_mm,
      punch_radius_mm,
      die_radius_mm,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      name,
      vDieMm,
      punchRadiusMm,
      dieRadiusMm,
      {
        legacyNo,
        name,
        vDieMm,
        punchRadiusMm,
        dieRadiusMm
      },
      id
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapToolingRow(result.rows[0]);
}

export async function deleteTooling(id) {
  const result = await pool.query(
    `
    DELETE FROM toolings
    WHERE id = $1
    RETURNING
      id,
      legacy_no,
      name,
      v_die_mm,
      punch_radius_mm,
      die_radius_mm,
      raw_data,
      created_at,
      updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapToolingRow(result.rows[0]);
}