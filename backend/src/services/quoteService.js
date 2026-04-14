import mongoose from "mongoose";

import { Machine } from "../models/Machine.js";
import { Material } from "../models/Material.js";
import { Option } from "../models/Option.js";
import { Quote } from "../models/Quote.js";
import { Tooling } from "../models/Tooling.js";

function toQuoteDto(quote) {
  return {
    id: quote._id.toString(),
    legacyNo: quote.legacyNo || "",
    quoteCode: quote.quoteCode,
    customer: quote.customer,
    materialId: quote.materialId,
    materialNameSnapshot: quote.materialNameSnapshot,
    thicknessMm: quote.thicknessMm,
    bendLengthMm: quote.bendLengthMm,
    machineId: quote.machineId,
    machineModelSnapshot: quote.machineModelSnapshot,
    toolingId: quote.toolingId,
    toolingNameSnapshot: quote.toolingNameSnapshot,
    selectedOptions: quote.selectedOptions || [],
    machinePriceUsd: quote.machinePriceUsd,
    optionsTotalUsd: quote.optionsTotalUsd,
    grandTotalUsd: quote.grandTotalUsd,
    notes: quote.notes || "",
    createdAtLegacy: quote.createdAtLegacy || "",
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt
  };
}

function parsePositiveNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    const error = new Error(`${fieldName} 0'dan büyük bir sayı olmalıdır`);
    error.statusCode = 400;
    throw error;
  }
  return number;
}

function parseNonNegativeNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${fieldName} 0 veya daha büyük bir sayı olmalıdır`);
    error.statusCode = 400;
    throw error;
  }
  return number;
}

async function findByIdOrThrow(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Geçersiz teklif kimliği");
    error.statusCode = 400;
    throw error;
  }

  const quote = await Quote.findById(id);
  if (!quote) {
    const error = new Error("Teklif bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return quote;
}

async function generateQuoteCode() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const prefix = `Q-${datePart}-`;

  const todayQuotes = await Quote.countDocuments({
    quoteCode: { $regex: `^${prefix}` }
  });

  return `${prefix}${todayQuotes + 1}`;
}

async function resolveMaterial(materialId, materialNameSnapshot) {
  if (materialId && mongoose.Types.ObjectId.isValid(materialId)) {
    const material = await Material.findById(materialId).lean();
    if (material) {
      return {
        materialId: material._id,
        materialNameSnapshot: material.name
      };
    }
  }

  if (materialNameSnapshot?.trim()) {
    const material = await Material.findOne({ name: materialNameSnapshot.trim() }).lean();
    return {
      materialId: material?._id ?? null,
      materialNameSnapshot: material?.name ?? materialNameSnapshot.trim()
    };
  }

  const error = new Error("Malzeme zorunludur");
  error.statusCode = 400;
  throw error;
}

async function resolveMachine(machineId, machineModelSnapshot, machinePriceUsdRaw) {
  if (machineId && mongoose.Types.ObjectId.isValid(machineId)) {
    const machine = await Machine.findById(machineId).lean();
    if (machine) {
      return {
        machineId: machine._id,
        machineModelSnapshot: machine.model,
        machinePriceUsd: machine.basePriceUSD
      };
    }
  }

  if (machineModelSnapshot?.trim()) {
    const machine = await Machine.findOne({ model: machineModelSnapshot.trim() }).lean();
    if (machine) {
      return {
        machineId: machine._id,
        machineModelSnapshot: machine.model,
        machinePriceUsd: machine.basePriceUSD
      };
    }
  }

  return {
    machineId: null,
    machineModelSnapshot: machineModelSnapshot?.trim() || "",
    machinePriceUsd: parseNonNegativeNumber(machinePriceUsdRaw, "Makine fiyatı")
  };
}

async function resolveTooling(toolingId, toolingNameSnapshot) {
  if (toolingId && mongoose.Types.ObjectId.isValid(toolingId)) {
    const tooling = await Tooling.findById(toolingId).lean();
    if (tooling) {
      return {
        toolingId: tooling._id,
        toolingNameSnapshot: tooling.name
      };
    }
  }

  if (toolingNameSnapshot?.trim()) {
    const tooling = await Tooling.findOne({ name: toolingNameSnapshot.trim() }).lean();
    return {
      toolingId: tooling?._id ?? null,
      toolingNameSnapshot: tooling?.name ?? toolingNameSnapshot.trim()
    };
  }

  return {
    toolingId: null,
    toolingNameSnapshot: ""
  };
}

async function resolveSelectedOptions(selectedOptions) {
  const normalized = [];
  let optionsTotalUsd = 0;

  for (const entry of selectedOptions || []) {
    const code = entry.code?.trim() || "";
    const name = entry.name?.trim() || "";

    let optionDoc = null;
    if (entry.optionId && mongoose.Types.ObjectId.isValid(entry.optionId)) {
      optionDoc = await Option.findById(entry.optionId).lean();
    } else if (code) {
      optionDoc = await Option.findOne({ code }).lean();
    }

    const resolvedCode = optionDoc?.code ?? code;
    const resolvedName = optionDoc?.name ?? name;
    const priceUsd = optionDoc?.priceUsd ?? parseNonNegativeNumber(entry.priceUsd || 0, "Opsiyon fiyatı");

    if (!resolvedCode || !resolvedName) {
      const error = new Error("Her seçili opsiyon bir kod ve ad içermelidir");
      error.statusCode = 400;
      throw error;
    }

    optionsTotalUsd += priceUsd;
    normalized.push({
      optionId: optionDoc?._id ?? null,
      code: resolvedCode,
      name: resolvedName,
      priceUsd
    });
  }

  return { selectedOptions: normalized, optionsTotalUsd };
}

function normalizeCustomer(customer) {
  const name = customer?.name?.trim();
  const address = customer?.address?.trim();
  const tel = customer?.tel?.trim();
  const taxOffice = customer?.taxOffice?.trim();

  if (!name || !address || !tel || !taxOffice) {
    const error = new Error("Müşteri adı, adres, telefon ve vergi dairesi zorunludur");
    error.statusCode = 400;
    throw error;
  }

  return {
    name,
    attention: customer?.attention?.trim() || "",
    address,
    tel,
    email: customer?.email?.trim() || "",
    taxOffice
  };
}

export async function listQuotes() {
  const quotes = await Quote.find().sort({ createdAt: -1 });
  return quotes.map(toQuoteDto);
}

export async function getQuoteById(id) {
  const quote = await findByIdOrThrow(id);
  return toQuoteDto(quote);
}

export async function createQuote(payload) {
  const customer = normalizeCustomer(payload.customer);
  const thicknessMm = parsePositiveNumber(payload.thicknessMm, "Kalınlık");
  const bendLengthMm = parsePositiveNumber(payload.bendLengthMm, "Büküm boyu");

  const material = await resolveMaterial(payload.materialId, payload.materialNameSnapshot);
  const machine = await resolveMachine(
    payload.machineId,
    payload.machineModelSnapshot,
    payload.machinePriceUsd
  );
  const tooling = await resolveTooling(payload.toolingId, payload.toolingNameSnapshot);
  const options = await resolveSelectedOptions(payload.selectedOptions);

  const machinePriceUsd = parseNonNegativeNumber(machine.machinePriceUsd, "Makine fiyatı");
  const grandTotalUsd = machinePriceUsd + options.optionsTotalUsd;

  const quote = await Quote.create({
    legacyNo: payload.legacyNo?.trim() || "",
    quoteCode: payload.quoteCode?.trim() || (await generateQuoteCode()),
    customer,
    materialId: material.materialId,
    materialNameSnapshot: material.materialNameSnapshot,
    thicknessMm,
    bendLengthMm,
    machineId: machine.machineId,
    machineModelSnapshot: machine.machineModelSnapshot,
    toolingId: tooling.toolingId,
    toolingNameSnapshot: tooling.toolingNameSnapshot,
    selectedOptions: options.selectedOptions,
    machinePriceUsd,
    optionsTotalUsd: options.optionsTotalUsd,
    grandTotalUsd,
    notes: payload.notes?.trim() || "",
    createdAtLegacy: payload.createdAtLegacy?.trim() || new Date().toISOString()
  });

  return toQuoteDto(quote);
}

export async function deleteQuote(id) {
  const quote = await findByIdOrThrow(id);
  await quote.deleteOne();
  return { success: true };
}
