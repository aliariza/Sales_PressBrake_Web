import { pool } from "./postgres.js";

function readMongoNumber(value) {
  if (value === null || value === undefined) return null;

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
    if (number !== null) return number;
  }

  return null;
}

async function fixMachineColumns() {
  const result = await pool.query(`
    SELECT
      id,
      model,
      raw_data
    FROM machines
  `);

  let updatedCount = 0;

  for (const row of result.rows) {
    const raw = row.raw_data ?? {};

    const pressForceTon = firstNumber(
      raw.maxTonnageTonf,
      raw.tonnage
    );

    const bendingLengthMm = firstNumber(
      raw.workingLengthMm,
      raw.workingLength
    );

    const priceUsd = firstNumber(
      raw.basePriceUSD,
      raw.basePriceUsd
    );

    await pool.query(
      `
      UPDATE machines
      SET
        press_force_ton = $1,
        bending_length_mm = $2,
        price_usd = $3,
        updated_at = NOW()
      WHERE id = $4
      `,
      [pressForceTon, bendingLengthMm, priceUsd, row.id]
    );

    updatedCount += 1;

    console.log(
      `Updated ${row.model}: force=${pressForceTon}, length=${bendingLengthMm}, price=${priceUsd}`
    );
  }

  console.log(`Done. Updated ${updatedCount} machines.`);
  await pool.end();
}

fixMachineColumns().catch((error) => {
  console.error("Error fixing machine columns:", error);
  process.exit(1);
});