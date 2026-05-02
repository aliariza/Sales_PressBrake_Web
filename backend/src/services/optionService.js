import {
  createOption as createOptionInDb,
  deleteOption as deleteOptionFromDb,
  getAllOptions,
  getOptionByCode,
  getOptionById as getOptionByIdFromDb,
  updateOption as updateOptionInDb
} from "../repositories/optionRepository.js";

function parseUuid(id) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    const error = new Error("Geçersiz opsiyon kimliği");
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

async function findByIdOrThrow(id) {
  const parsedId = parseUuid(id);

  const option = await getOptionByIdFromDb(parsedId);

  if (!option) {
    const error = new Error("Opsiyon bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return option;
}

async function ensureCodeAvailable(code, excludedId = null) {
  const existing = await getOptionByCode(code);

  if (existing && existing.id !== excludedId) {
    const error = new Error("Bu kod başka bir opsiyon tarafından kullanılıyor");
    error.statusCode = 409;
    throw error;
  }
}

function normalizeOptionPayload(payload) {
  const code = payload.code?.trim();
  const name = payload.name?.trim();

  if (!code) {
    const error = new Error("Kod zorunludur");
    error.statusCode = 400;
    throw error;
  }

  if (!name) {
    const error = new Error("Ad zorunludur");
    error.statusCode = 400;
    throw error;
  }

  return {
    legacyNo: payload.legacyNo?.toString().trim() || "",
    code,
    name,
    priceUsd: parsePositiveNumber(payload.priceUsd, "Fiyat")
  };
}

export async function listOptions() {
  return getAllOptions();
}

export async function getOptionById(id) {
  return findByIdOrThrow(id);
}

export async function createOption(payload) {
  const normalized = normalizeOptionPayload(payload);

  await ensureCodeAvailable(normalized.code);

  return createOptionInDb(normalized);
}

export async function updateOption(id, payload) {
  const parsedId = parseUuid(id);
  await findByIdOrThrow(parsedId);

  const normalized = normalizeOptionPayload(payload);

  await ensureCodeAvailable(normalized.code, parsedId);

  return updateOptionInDb(parsedId, normalized);
}

export async function deleteOption(id) {
  const parsedId = parseUuid(id);
  await findByIdOrThrow(parsedId);

  await deleteOptionFromDb(parsedId);

  return { success: true };
}