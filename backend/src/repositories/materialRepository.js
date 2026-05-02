import { pool } from "../db/postgres.js";

function toNumberOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapMaterialRow(row) {
  return {
    id: row.id,
    legacyNo: row.legacy_no == null ? "" : String(row.legacy_no),
    name: row.name,
    tensileStrengthMPa: toNumberOrNull(row.tensile_strength_mpa),
    yieldStrengthMPa: toNumberOrNull(row.yield_strength_mpa),
    kFactorDefault: toNumberOrNull(row.k_factor_default),
    youngsModulusMPa: toNumberOrNull(row.youngs_modulus_mpa),
    recommendedVdieFactor: toNumberOrNull(row.recommended_vdie_factor),
    minThicknessMm: toNumberOrNull(row.min_thickness_mm),
    maxThicknessMm: toNumberOrNull(row.max_thickness_mm),
    rawData: row.raw_data ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getAllMaterials() {
  const result = await pool.query(`
    SELECT
      id,
      legacy_no,
      name,
      tensile_strength_mpa,
      yield_strength_mpa,
      k_factor_default,
      youngs_modulus_mpa,
      recommended_vdie_factor,
      min_thickness_mm,
      max_thickness_mm,
      raw_data,
      created_at,
      updated_at
    FROM materials
    ORDER BY created_at ASC
  `);

  return result.rows.map(mapMaterialRow);
}

export async function getMaterialById(id) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      name,
      tensile_strength_mpa,
      yield_strength_mpa,
      k_factor_default,
      youngs_modulus_mpa,
      recommended_vdie_factor,
      min_thickness_mm,
      max_thickness_mm,
      raw_data,
      created_at,
      updated_at
    FROM materials
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapMaterialRow(result.rows[0]);
}

export async function createMaterial(materialData) {
  const {
    legacyNo,
    name,
    tensileStrengthMPa,
    yieldStrengthMPa,
    kFactorDefault,
    youngsModulusMPa,
    recommendedVdieFactor,
    minThicknessMm,
    maxThicknessMm
  } = materialData;

  const result = await pool.query(
    `
    INSERT INTO materials (
      legacy_no,
      name,
      tensile_strength_mpa,
      yield_strength_mpa,
      k_factor_default,
      youngs_modulus_mpa,
      recommended_vdie_factor,
      min_thickness_mm,
      max_thickness_mm,
      raw_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      id,
      legacy_no,
      name,
      tensile_strength_mpa,
      yield_strength_mpa,
      k_factor_default,
      youngs_modulus_mpa,
      recommended_vdie_factor,
      min_thickness_mm,
      max_thickness_mm,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      name,
      tensileStrengthMPa,
      yieldStrengthMPa,
      kFactorDefault,
      youngsModulusMPa,
      recommendedVdieFactor,
      minThicknessMm,
      maxThicknessMm,
      {
        legacyNo,
        name,
        tensileStrengthMPa,
        yieldStrengthMPa,
        kFactorDefault,
        youngsModulusMPa,
        recommendedVdieFactor,
        minThicknessMm,
        maxThicknessMm
      }
    ]
  );

  return mapMaterialRow(result.rows[0]);
}

export async function updateMaterial(id, materialData) {
  const {
    legacyNo,
    name,
    tensileStrengthMPa,
    yieldStrengthMPa,
    kFactorDefault,
    youngsModulusMPa,
    recommendedVdieFactor,
    minThicknessMm,
    maxThicknessMm
  } = materialData;

  const result = await pool.query(
    `
    UPDATE materials
    SET
      legacy_no = $1,
      name = $2,
      tensile_strength_mpa = $3,
      yield_strength_mpa = $4,
      k_factor_default = $5,
      youngs_modulus_mpa = $6,
      recommended_vdie_factor = $7,
      min_thickness_mm = $8,
      max_thickness_mm = $9,
      raw_data = $10,
      updated_at = NOW()
    WHERE id = $11
    RETURNING
      id,
      legacy_no,
      name,
      tensile_strength_mpa,
      yield_strength_mpa,
      k_factor_default,
      youngs_modulus_mpa,
      recommended_vdie_factor,
      min_thickness_mm,
      max_thickness_mm,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      name,
      tensileStrengthMPa,
      yieldStrengthMPa,
      kFactorDefault,
      youngsModulusMPa,
      recommendedVdieFactor,
      minThicknessMm,
      maxThicknessMm,
      {
        legacyNo,
        name,
        tensileStrengthMPa,
        yieldStrengthMPa,
        kFactorDefault,
        youngsModulusMPa,
        recommendedVdieFactor,
        minThicknessMm,
        maxThicknessMm
      },
      id
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapMaterialRow(result.rows[0]);
}

export async function deleteMaterial(id) {
  const result = await pool.query(
    `
    DELETE FROM materials
    WHERE id = $1
    RETURNING
      id,
      legacy_no,
      name,
      tensile_strength_mpa,
      yield_strength_mpa,
      k_factor_default,
      youngs_modulus_mpa,
      recommended_vdie_factor,
      min_thickness_mm,
      max_thickness_mm,
      raw_data,
      created_at,
      updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapMaterialRow(result.rows[0]);
}