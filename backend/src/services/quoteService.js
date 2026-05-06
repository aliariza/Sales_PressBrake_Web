import {
  countQuotesByCodePrefix,
  createQuote as createQuoteInDb,
  deleteQuote as deleteQuoteFromDb,
  getAllQuotes,
  getQuoteById as getQuoteByIdFromDb,
  getQuotesByOwner,
  hasQuoteCode
} from "../repositories/quoteRepository.js";
import { updateQuote as updateQuoteInDb } from "../repositories/quoteRepository.js";

import {
  getAllMachines,
  getMachineById as getMachineByIdFromDb
} from "../repositories/machineRepository.js";

import {
  getAllMaterials,
  getMaterialById as getMaterialByIdFromDb
} from "../repositories/materialRepository.js";

import {
  getAllOptions,
  getOptionByCode,
  getOptionById as getOptionByIdFromDb
} from "../repositories/optionRepository.js";

import {
  getAllToolings,
  getToolingById as getToolingByIdFromDb
} from "../repositories/toolingRepository.js";

function isUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

function parseUuid(id) {
  if (!isUuid(id)) {
    const error = new Error("Geçersiz teklif kimliği");
    error.statusCode = 400;
    throw error;
  }

  return id;
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
  const parsedId = parseUuid(id);

  const quote = await getQuoteByIdFromDb(parsedId);

  if (!quote) {
    const error = new Error("Teklif bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return quote;
}

function assertCanAccessQuote(quote, user) {
  if (user?.role === "admin") {
    return quote;
  }

  const userIdMatches = user?.sub && quote.ownerUserId === user.sub;
  const usernameMatches =
    !quote.ownerUserId && user?.username && quote.ownerUsername === user.username;

  if (!userIdMatches && !usernameMatches) {
    const error = new Error("Bu teklife erişim izniniz yok");
    error.statusCode = 403;
    throw error;
  }

  return quote;
}

async function generateQuoteCode() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const prefix = `Q-${datePart}-`;
  let nextSequence = (await countQuotesByCodePrefix(prefix)) + 1;

  while (true) {
    const candidate = `${prefix}${nextSequence}`;

    if (!(await hasQuoteCode(candidate))) {
      return candidate;
    }

    nextSequence += 1;
  }
}

function isUniqueViolation(error) {
  return error?.code === "23505";
}

async function resolveMaterial(materialId, materialNameSnapshot) {
  if (materialId && isUuid(materialId)) {
    const material = await getMaterialByIdFromDb(materialId);

    if (material) {
      return {
        materialId: material.id,
        materialNameSnapshot: material.name
      };
    }
  }

  if (materialNameSnapshot?.trim()) {
    const allMaterials = await getAllMaterials();
    const material = allMaterials.find(
      (item) =>
        item.name.toLowerCase() === materialNameSnapshot.trim().toLowerCase()
    );

    return {
      materialId: material?.id ?? null,
      materialNameSnapshot: material?.name ?? materialNameSnapshot.trim()
    };
  }

  const error = new Error("Malzeme zorunludur");
  error.statusCode = 400;
  throw error;
}

async function resolveMachine(machineId, machineModelSnapshot, machinePriceUsdRaw) {
  if (machineId && isUuid(machineId)) {
    const machine = await getMachineByIdFromDb(machineId);

    if (machine) {
      return {
        machineId: machine.id,
        machineModelSnapshot: machine.model,
        machinePriceUsd: machine.basePriceUSD
      };
    }
  }

  if (machineModelSnapshot?.trim()) {
    const allMachines = await getAllMachines();
    const machine = allMachines.find(
      (item) =>
        item.model.toLowerCase() === machineModelSnapshot.trim().toLowerCase()
    );

    if (machine) {
      return {
        machineId: machine.id,
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
  if (toolingId && isUuid(toolingId)) {
    const tooling = await getToolingByIdFromDb(toolingId);

    if (tooling) {
      return {
        toolingId: tooling.id,
        toolingNameSnapshot: tooling.name
      };
    }
  }

  if (toolingNameSnapshot?.trim()) {
    const allToolings = await getAllToolings();
    const tooling = allToolings.find(
      (item) =>
        item.name.toLowerCase() === toolingNameSnapshot.trim().toLowerCase()
    );

    return {
      toolingId: tooling?.id ?? null,
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

    if (entry.optionId && isUuid(entry.optionId)) {
      optionDoc = await getOptionByIdFromDb(entry.optionId);
    } else if (code) {
      optionDoc = await getOptionByCode(code);
    }

    const resolvedCode = optionDoc?.code ?? code;
    const resolvedName = optionDoc?.name ?? name;
    const priceUsd =
      optionDoc?.priceUsd ??
      parseNonNegativeNumber(entry.priceUsd || 0, "Opsiyon fiyatı");

    if (!resolvedCode || !resolvedName) {
      const error = new Error("Her seçili opsiyon bir kod ve ad içermelidir");
      error.statusCode = 400;
      throw error;
    }

    optionsTotalUsd += priceUsd;

    normalized.push({
      optionId: optionDoc?.id ?? null,
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
    const error = new Error(
      "Müşteri adı, adres, telefon ve vergi dairesi zorunludur"
    );
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

async function buildQuoteData(payload, user, existingQuote = null) {
  const customer = normalizeCustomer(payload.customer);
  const thicknessMm = parsePositiveNumber(payload.thicknessMm, "Kalınlık");
  const bendLengthMm = parsePositiveNumber(payload.bendLengthMm, "Büküm boyu");

  const material = await resolveMaterial(
    payload.materialId,
    payload.materialNameSnapshot
  );

  const machine = await resolveMachine(
    payload.machineId,
    payload.machineModelSnapshot,
    payload.machinePriceUsd
  );

  const tooling = await resolveTooling(
    payload.toolingId,
    payload.toolingNameSnapshot
  );

  const options = await resolveSelectedOptions(payload.selectedOptions);
  const machinePriceUsd = parseNonNegativeNumber(
    machine.machinePriceUsd,
    "Makine fiyatı"
  );
  const ownerUserId = user?.sub && isUuid(user.sub) ? user.sub : existingQuote?.ownerUserId ?? null;

  return {
    legacyNo: payload.legacyNo?.toString().trim() || existingQuote?.legacyNo || "",
    customer,
    ownerUserId,
    ownerUsername: user.username,
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
    grandTotalUsd: machinePriceUsd + options.optionsTotalUsd,
    notes: payload.notes?.trim() || "",
    otherTerms: payload.otherTerms?.trim() || "",
    createdAtLegacy: payload.createdAtLegacy?.trim() || existingQuote?.createdAtLegacy || new Date().toISOString()
  };
}

export async function listQuotes(user) {
  if (user?.role === "admin") {
    return getAllQuotes();
  }

  if (!user?.username) {
    const error = new Error("Kullanıcı bilgisi bulunamadı");
    error.statusCode = 401;
    throw error;
  }

  if (user?.sub && isUuid(user.sub)) {
    return getQuotesByOwner(user.sub, user.username);
  }

  return getQuotesByOwner(null, user.username);
}

export async function getQuoteById(id, user) {
  const quote = await findByIdOrThrow(id);
  return assertCanAccessQuote(quote, user);
}

export async function createQuote(payload, user) {
  if (!user?.username) {
    const error = new Error("Kullanıcı bilgisi bulunamadı");
    error.statusCode = 401;
    throw error;
  }

  const baseQuote = await buildQuoteData(payload, user);
  const manualQuoteCode = payload.quoteCode?.trim() || "";

  if (manualQuoteCode) {
    return createQuoteInDb({
      ...baseQuote,
      quoteCode: manualQuoteCode
    });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await createQuoteInDb({
        ...baseQuote,
        quoteCode: await generateQuoteCode()
      });
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 4) {
        throw error;
      }
    }
  }
}

export async function updateQuote(id, payload, user) {
  if (!user?.username) {
    const error = new Error("Kullanıcı bilgisi bulunamadı");
    error.statusCode = 401;
    throw error;
  }

  const existingQuote = await getQuoteById(id, user);
  const quoteData = await buildQuoteData(payload, user, existingQuote);
  const updatedQuote = await updateQuoteInDb(id, {
    ...quoteData,
    quoteCode: existingQuote.quoteCode
  });

  if (!updatedQuote) {
    const error = new Error("Teklif güncellenemedi");
    error.statusCode = 404;
    throw error;
  }

  return updatedQuote;
}

export async function deleteQuote(id) {
  const parsedId = parseUuid(id);
  await findByIdOrThrow(parsedId);

  await deleteQuoteFromDb(parsedId);

  return { success: true };
}
