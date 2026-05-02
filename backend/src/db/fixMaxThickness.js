import { pool } from "./postgres.js";

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

async function fixMaxThickness() {
  const result = await pool.query(`
    SELECT id, model, raw_data
    FROM machines
  `);

  let updatedCount = 0;

  for (const row of result.rows) {
    const raw = row.raw_data || {};

    const maxThicknessMm =
      readMongoNumber(raw.maxThicknessMm) ??
      readMongoNumber(raw.maxThickness);

    await pool.query(
      `
      UPDATE machines
      SET
        max_thickness_mm = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [maxThicknessMm, row.id]
    );

    updatedCount += 1;

    console.log(
      `Updated ${row.model}: max_thickness_mm=${maxThicknessMm}`
    );
  }

  console.log(`Done. Updated ${updatedCount} machines.`);
  await pool.end();
}

fixMaxThickness().catch((error) => {
  console.error("Error fixing max_thickness_mm:", error);
  process.exit(1);
});