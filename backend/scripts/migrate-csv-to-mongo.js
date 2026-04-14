import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectToDatabase } from "../src/config/db.js";
import { Machine } from "../src/models/Machine.js";
import { Material } from "../src/models/Material.js";
import { Option } from "../src/models/Option.js";
import { Quote } from "../src/models/Quote.js";
import { Tooling } from "../src/models/Tooling.js";
import { User } from "../src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const resourcesDir = process.env.MIGRATION_SOURCE_DIR
  ? path.resolve(process.env.MIGRATION_SOURCE_DIR)
  : path.join(projectRoot, "resources");
const shouldDropCollections = process.argv.includes("--drop");

function parseCsvLine(line) {
  return line.split(",").map((part) => part.trim());
}

function parseQuoteLine(line) {
  return line.split("||").map((part) => part.trim());
}

function parseNumber(value, fallback = 0) {
  const number = Number(String(value ?? "").trim());
  return Number.isFinite(number) ? number : fallback;
}

function decodeLegacyOptionPart(value) {
  try {
    return decodeURIComponent(String(value ?? "").trim());
  } catch {
    return String(value ?? "").trim();
  }
}

async function readLines(filename) {
  const content = await fs.readFile(path.join(resourcesDir, filename), "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter(Boolean);
}

function parseLegacyOptions(optionsData) {
  const trimmed = String(optionsData || "").trim();
  if (!trimmed) {
    return [];
  }

  return trimmed
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [code = "", name = "", priceUsd = "0"] = entry.split("|");
      return {
        code: decodeLegacyOptionPart(code),
        name: decodeLegacyOptionPart(name),
        priceUsd: parseNumber(priceUsd)
      };
    });
}

async function resetCollections() {
  if (!shouldDropCollections) {
    return;
  }

  await Promise.all([
    User.deleteMany({}),
    Material.deleteMany({}),
    Machine.deleteMany({}),
    Tooling.deleteMany({}),
    Option.deleteMany({}),
    Quote.deleteMany({})
  ]);
}

async function migrateUsers() {
  const lines = await readLines("users.csv");

  for (const line of lines) {
    const parts = parseCsvLine(line);

    let legacyNo = "";
    let username = "";
    let password = "";
    let role = "user";
    let comments = "";

    if (parts.length >= 5) {
      const [noValue, usernameValue, passwordValue, roleValue, ...commentParts] = parts;
      legacyNo = noValue;
      username = usernameValue;
      password = passwordValue;
      role = roleValue;
      comments = commentParts.join(",");
    } else if (parts.length >= 3) {
      const [usernameValue, passwordValue, roleValue, ...commentParts] = parts;
      username = usernameValue;
      password = passwordValue;
      role = roleValue;
      comments = commentParts.join(",");
    } else {
      continue;
    }

    if (!username || !password || !role) {
      continue;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { username },
      {
        legacyNo,
        username,
        passwordHash,
        role,
        comments
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function migrateMaterials() {
  const lines = await readLines("materials.csv");

  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (parts.length < 9) {
      continue;
    }

    const [legacyNo, name, rm, re, kFactor, youngs, vdieFactor, minT, maxT] = parts;

    await Material.findOneAndUpdate(
      { legacyNo },
      {
        legacyNo,
        name,
        tensileStrengthMPa: parseNumber(rm),
        yieldStrengthMPa: parseNumber(re),
        kFactorDefault: parseNumber(kFactor),
        youngsModulusMPa: parseNumber(youngs),
        recommendedVdieFactor: parseNumber(vdieFactor),
        minThicknessMm: parseNumber(minT),
        maxThicknessMm: parseNumber(maxT)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function migrateMachines() {
  const lines = await readLines("machines.csv");

  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (parts.length < 6) {
      continue;
    }

    const [legacyNo, model, tonnage, length, thickness, price] = parts;

    await Machine.findOneAndUpdate(
      { legacyNo },
      {
        legacyNo,
        model,
        maxTonnageTonf: parseNumber(tonnage),
        workingLengthMm: parseNumber(length),
        maxThicknessMm: parseNumber(thickness),
        basePriceUSD: parseNumber(price)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function migrateToolings() {
  const lines = await readLines("tooling.csv");

  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (parts.length < 5) {
      continue;
    }

    const [legacyNo, name, vDie, punchRadius, dieRadius] = parts;

    await Tooling.findOneAndUpdate(
      { legacyNo },
      {
        legacyNo,
        name,
        vDieMm: parseNumber(vDie),
        punchRadiusMm: parseNumber(punchRadius),
        dieRadiusMm: parseNumber(dieRadius)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function migrateOptions() {
  const lines = await readLines("options.csv");

  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (parts.length < 4) {
      continue;
    }

    const [legacyNo, code, name, priceUsd] = parts;

    await Option.findOneAndUpdate(
      { code },
      {
        legacyNo,
        code,
        name,
        priceUsd: parseNumber(priceUsd)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function migrateQuotes() {
  const lines = await readLines("quotes.csv").catch(() => []);

  for (const line of lines) {
    const parts = parseQuoteLine(line);
    if (parts.length < 19) {
      continue;
    }

    const [
      legacyNo,
      quoteCode,
      customerName,
      customerAttention,
      customerAddress,
      customerTel,
      customerEmail,
      customerTaxOffice,
      materialName,
      thicknessMm,
      bendLengthMm,
      machineModel,
      toolingName,
      optionsData,
      machinePriceUsd,
      optionsTotalUsd,
      grandTotalUsd,
      notes,
      createdAt
    ] = parts;

    const material = materialName
      ? await Material.findOne({ name: materialName }).select("_id").lean()
      : null;
    const machine = machineModel
      ? await Machine.findOne({ model: machineModel }).select("_id").lean()
      : null;
    const tooling = toolingName
      ? await Tooling.findOne({ name: toolingName }).select("_id").lean()
      : null;

    const parsedOptions = parseLegacyOptions(optionsData);
    const selectedOptions = [];

    for (const item of parsedOptions) {
      const optionDoc = item.code
        ? await Option.findOne({ code: item.code }).select("_id").lean()
        : null;

      selectedOptions.push({
        optionId: optionDoc?._id ?? null,
        code: item.code,
        name: item.name,
        priceUsd: item.priceUsd
      });
    }

    await Quote.findOneAndUpdate(
      { quoteCode },
      {
        legacyNo,
        quoteCode,
        customer: {
          name: customerName,
          attention: customerAttention,
          address: customerAddress,
          tel: customerTel,
          email: customerEmail,
          taxOffice: customerTaxOffice
        },
        materialId: material?._id ?? null,
        materialNameSnapshot: materialName,
        thicknessMm: parseNumber(thicknessMm),
        bendLengthMm: parseNumber(bendLengthMm),
        machineId: machine?._id ?? null,
        machineModelSnapshot: machineModel,
        toolingId: tooling?._id ?? null,
        toolingNameSnapshot: toolingName,
        selectedOptions,
        machinePriceUsd: parseNumber(machinePriceUsd),
        optionsTotalUsd: parseNumber(optionsTotalUsd),
        grandTotalUsd: parseNumber(grandTotalUsd),
        notes,
        createdAtLegacy: createdAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function printSummary() {
  const [users, materials, machines, toolings, options, quotes] = await Promise.all([
    User.countDocuments(),
    Material.countDocuments(),
    Machine.countDocuments(),
    Tooling.countDocuments(),
    Option.countDocuments(),
    Quote.countDocuments()
  ]);

  console.log("Migration complete");
  console.log(`Users: ${users}`);
  console.log(`Materials: ${materials}`);
  console.log(`Machines: ${machines}`);
  console.log(`Toolings: ${toolings}`);
  console.log(`Options: ${options}`);
  console.log(`Quotes: ${quotes}`);
}

async function run() {
  console.log(`Using migration source: ${resourcesDir}`);
  console.log(`Drop existing collections: ${shouldDropCollections ? "yes" : "no"}`);

  await connectToDatabase();
  await resetCollections();

  await migrateUsers();
  await migrateMaterials();
  await migrateMachines();
  await migrateToolings();
  await migrateOptions();
  await migrateQuotes();

  await printSummary();
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
