import {
  countQuotesByCodePrefix,
  createQuote as createQuoteInDb,
  deleteQuote as deleteQuoteFromDb,
  getAllQuotes,
  getQuoteById as getQuoteByIdFromDb,
  getQuotesByOwnerUserId,
  hasQuoteCode
} from "../repositories/quoteRepository.js";

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

  if (!user?.sub || quote.ownerUserId !== user.sub) {
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

export async function listQuotes(user) {
  if (user?.role === "admin") {
    return getAllQuotes();
  }

  if (!user?.sub) {
    const error = new Error("Kullanıcı bilgisi bulunamadı");
    error.statusCode = 401;
    throw error;
  }

  return getQuotesByOwnerUserId(user.sub);
}

export async function getQuoteById(id, user) {
  const quote = await findByIdOrThrow(id);
  return assertCanAccessQuote(quote, user);
}

export async function createQuote(payload, user) {
  if (!user?.sub || !user?.username) {
    const error = new Error("Kullanıcı bilgisi bulunamadı");
    error.statusCode = 401;
    throw error;
  }

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

  const grandTotalUsd = machinePriceUsd + options.optionsTotalUsd;
  const manualQuoteCode = payload.quoteCode?.trim() || "";

  const baseQuote = {
    legacyNo: payload.legacyNo?.toString().trim() || "",
    customer,
    ownerUserId: user.sub,
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
    grandTotalUsd,
    notes: payload.notes?.trim() || "",
    createdAtLegacy: payload.createdAtLegacy?.trim() || new Date().toISOString()
  };

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

export async function deleteQuote(id) {
  const parsedId = parseUuid(id);
  await findByIdOrThrow(parsedId);

  await deleteQuoteFromDb(parsedId);

  return { success: true };
}
