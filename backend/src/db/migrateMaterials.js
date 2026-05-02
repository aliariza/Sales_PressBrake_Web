import mongoose from "mongoose";

import { connectToDatabase } from "../config/db.js";
import { Material } from "../models/Material.js";
import { createMaterial } from "../repositories/materialRepository.js";
import { pool } from "./postgres.js";

async function migrateMaterials() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  console.log("Mongo readyState:", mongoose.connection.readyState);

  const materials = await Material.find({}).lean();

  for (const material of materials) {
    await createMaterial({
      legacyNo: material.legacyNo || "",
      name: material.name,
      tensileStrengthMPa: material.tensileStrengthMPa,
      yieldStrengthMPa: material.yieldStrengthMPa,
      kFactorDefault: material.kFactorDefault,
      youngsModulusMPa: material.youngsModulusMPa,
      recommendedVdieFactor: material.recommendedVdieFactor,
      minThicknessMm: material.minThicknessMm,
      maxThicknessMm: material.maxThicknessMm
    });

    console.log(`Migrated material: ${material.name}`);
  }

  console.log("Materials migrated successfully.");

  await mongoose.disconnect();
  await pool.end();
}

migrateMaterials().catch(async (error) => {
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