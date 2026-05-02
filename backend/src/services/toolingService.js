import {
  createTooling as createToolingInDb,
  deleteTooling as deleteToolingFromDb,
  getAllToolings,
  getToolingById as getToolingByIdFromDb,
  updateTooling as updateToolingInDb
} from "../repositories/toolingRepository.js";

function parseUuid(id) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    const error = new Error("Geçersiz takım kimliği");
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

  const tooling = await getToolingByIdFromDb(parsedId);

  if (!tooling) {
    const error = new Error("Takım bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return tooling;
}

function normalizeToolingPayload(payload) {
  const name = payload.name?.trim();

  if (!name) {
    const error = new Error("Ad zorunludur");
    error.statusCode = 400;
    throw error;
  }

  return {
    legacyNo: payload.legacyNo?.toString().trim() || "",
    name,
    vDieMm: parsePositiveNumber(payload.vDieMm, "V-kalıp"),
    punchRadiusMm: parsePositiveNumber(payload.punchRadiusMm, "Punç yarıçapı"),
    dieRadiusMm: parsePositiveNumber(payload.dieRadiusMm, "Kalıp yarıçapı")
  };
}

export async function listToolings() {
  return getAllToolings();
}

export async function getToolingById(id) {
  return findByIdOrThrow(id);
}

export async function createTooling(payload) {
  const normalized = normalizeToolingPayload(payload);
  return createToolingInDb(normalized);
}

export async function updateTooling(id, payload) {
  const parsedId = parseUuid(id);
  await findByIdOrThrow(parsedId);

  const normalized = normalizeToolingPayload(payload);
  return updateToolingInDb(parsedId, normalized);
}

export async function deleteTooling(id) {
  const parsedId = parseUuid(id);
  await findByIdOrThrow(parsedId);

  await deleteToolingFromDb(parsedId);

  return { success: true };
}