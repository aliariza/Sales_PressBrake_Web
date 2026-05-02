import { pool } from "../db/postgres.js";

function readMongoNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  if (typeof value === "object") {
    const mongoNumber =
      value.$numberInt ??
      value.$numberLong ??
      value.$numberDouble ??
      value.$numberDecimal;

    if (mongoNumber !== undefined) {
      const number = Number(mongoNumber);
      return Number.isFinite(number) ? number : null;
    }
  }

  return null;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = readMongoNumber(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}

function mapMachineRow(row) {
  const raw = row.raw_data ?? {};

  return {
    id: row.id,
    legacyNo: row.legacy_no == null ? "" : String(row.legacy_no),
    model: row.model,
    name: row.name || raw.name || row.model,

    maxTonnageTonf: firstNumber(
      row.press_force_ton,
      raw.maxTonnageTonf,
      raw.tonnage
    ),

    workingLengthMm: firstNumber(
      row.bending_length_mm,
      raw.workingLengthMm,
      raw.workingLength
    ),

    maxThicknessMm: firstNumber(
      row.max_thickness_mm,
      raw.maxThicknessMm,
      raw.maxThickness
    ),

    basePriceUSD: firstNumber(
      row.price_usd,
      raw.basePriceUSD,
      raw.basePriceUsd
    ),

    rawData: raw,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getAllMachines() {
  const result = await pool.query(`
    SELECT
      id,
      legacy_no,
      model,
      name,
      press_force_ton,
      bending_length_mm,
      max_thickness_mm,
      price_usd,
      raw_data,
      created_at,
      updated_at
    FROM machines
    ORDER BY created_at ASC
  `);

  return result.rows.map(mapMachineRow);
}

export async function getMachineById(id) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      model,
      name,
      press_force_ton,
      bending_length_mm,
      max_thickness_mm,
      price_usd,
      raw_data,
      created_at,
      updated_at
    FROM machines
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapMachineRow(result.rows[0]);
}

export async function createMachine(machineData) {
  const {
    legacyNo,
    model,
    maxTonnageTonf,
    workingLengthMm,
    maxThicknessMm,
    basePriceUSD
  } = machineData;

  const result = await pool.query(
    `
    INSERT INTO machines (
      legacy_no,
      model,
      name,
      press_force_ton,
      bending_length_mm,
      max_thickness_mm,
      price_usd,
      raw_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      legacy_no,
      model,
      name,
      press_force_ton,
      bending_length_mm,
      max_thickness_mm,
      price_usd,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo ? Number(legacyNo) : null,
      model,
      model,
      maxTonnageTonf,
      workingLengthMm,
      maxThicknessMm,
      basePriceUSD,
      {
        maxThicknessMm
      }
    ]
  );

  return mapMachineRow(result.rows[0]);
}

export async function updateMachine(id, machineData) {
  const {
    legacyNo,
    model,
    maxTonnageTonf,
    workingLengthMm,
    maxThicknessMm,
    basePriceUSD
  } = machineData;

  const result = await pool.query(
    `
    UPDATE machines
    SET
      legacy_no = $1,
      model = $2,
      name = $3,
      press_force_ton = $4,
      bending_length_mm = $5,
      max_thickness_mm = $6,
      price_usd = $7,
      raw_data = $8,
      updated_at = NOW()
    WHERE id = $9
    RETURNING
      id,
      legacy_no,
      model,
      name,
      press_force_ton,
      bending_length_mm,
      max_thickness_mm,
      price_usd,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo ? Number(legacyNo) : null,
      model,
      model,
      maxTonnageTonf,
      workingLengthMm,
      maxThicknessMm,
      basePriceUSD,
      {
        maxThicknessMm
      },
      id
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapMachineRow(result.rows[0]);
}

export async function deleteMachine(id) {
  const result = await pool.query(
    `
    DELETE FROM machines
    WHERE id = $1
    RETURNING
      id,
      legacy_no,
      model,
      name,
      press_force_ton,
      bending_length_mm,
      max_thickness_mm,
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

  return mapMachineRow(result.rows[0]);
}