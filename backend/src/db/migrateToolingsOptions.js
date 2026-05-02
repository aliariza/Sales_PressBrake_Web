import mongoose from "mongoose";

import { connectToDatabase } from "../config/db.js";
import { Option } from "../models/Option.js";
import { Tooling } from "../models/Tooling.js";
import { createOption } from "../repositories/optionRepository.js";
import { createTooling } from "../repositories/toolingRepository.js";
import { pool } from "./postgres.js";

async function migrateToolingsOptions() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  console.log("Mongo readyState:", mongoose.connection.readyState);

  console.log("Reading toolings from MongoDB...");
  const toolings = await Tooling.find({}).lean();

  for (const tooling of toolings) {
    await createTooling({
      legacyNo: tooling.legacyNo || "",
      name: tooling.name,
      vDieMm: tooling.vDieMm,
      punchRadiusMm: tooling.punchRadiusMm,
      dieRadiusMm: tooling.dieRadiusMm
    });

    console.log(`Migrated tooling: ${tooling.name}`);
  }

  console.log("Reading options from MongoDB...");
  const options = await Option.find({}).lean();

  for (const option of options) {
    await createOption({
      legacyNo: option.legacyNo || "",
      code: option.code,
      name: option.name,
      priceUsd: option.priceUsd
    });

    console.log(`Migrated option: ${option.code} - ${option.name}`);
  }

  console.log("Toolings and options migrated successfully.");

  await mongoose.disconnect();
  await pool.end();
}

migrateToolingsOptions().catch(async (error) => {
  console.error("Migration failed:", error);

  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }

  try {
    await pool.end();
  } catch {
    // ignore
  }

  process.exit(1);
});