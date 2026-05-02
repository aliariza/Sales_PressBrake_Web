import {
  createMaterial as createMaterialInDb,
  deleteMaterial as deleteMaterialFromDb,
  getAllMaterials,
  getMaterialById as getMaterialByIdFromDb,
  updateMaterial as updateMaterialInDb
} from "../repositories/materialRepository.js";

function parseUuid(id) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    const error = new Error("Geçersiz malzeme kimliği");
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

function parseBoundedNumber(value, fieldName, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) {
    const error = new Error(`${fieldName} ${min} ile ${max} arasında olmalıdır`);
    error.statusCode = 400;
    throw error;
  }

  return number;
}

async function findByIdOrThrow(id) {
  const parsedId = parseUuid(id);

  const material = await getMaterialByIdFromDb(parsedId);

  if (!material) {
    const error = new Error("Malzeme bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return material;
}

function normalizeMaterialPayload(payload) {
  const name = payload.name?.trim();

  if (!name) {
    const error = new Error("Ad zorunludur");
    error.statusCode = 400;
    throw error;
  }

  const tensileStrengthMPa = parsePositiveNumber(
    payload.tensileStrengthMPa,
    "Çekme dayanımı"
  );

  const yieldStrengthMPa = parsePositiveNumber(
    payload.yieldStrengthMPa,
    "Akma dayanımı"
  );

  const kFactorDefault = parseBoundedNumber(
    payload.kFactorDefault,
    "K faktörü",
    0,
    1
  );

  const youngsModulusMPa = parsePositiveNumber(
    payload.youngsModulusMPa,
    "Young modülü"
  );

  const recommendedVdieFactor = parsePositiveNumber(
    payload.recommendedVdieFactor,
    "Önerilen V-kalıp faktörü"
  );

  const minThicknessMm = parsePositiveNumber(
    payload.minThicknessMm,
    "Minimum kalınlık"
  );

  const maxThicknessMm = parsePositiveNumber(
    payload.maxThicknessMm,
    "Maksimum kalınlık"
  );

  if (maxThicknessMm < minThicknessMm) {
    const error = new Error(
      "Maksimum kalınlık minimum kalınlığa eşit veya daha büyük olmalıdır"
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    legacyNo: payload.legacyNo?.toString().trim() || "",
    name,
    tensileStrengthMPa,
    yieldStrengthMPa,
    kFactorDefault,
    youngsModulusMPa,
    recommendedVdieFactor,
    minThicknessMm,
    maxThicknessMm
  };
}

export async function listMaterials() {
  return getAllMaterials();
}

export async function getMaterialById(id) {
  return findByIdOrThrow(id);
}

export async function createMaterial(payload) {
  const normalized = normalizeMaterialPayload(payload);
  return createMaterialInDb(normalized);
}

export async function updateMaterial(id, payload) {
  const parsedId = parseUuid(id);
  await findByIdOrThrow(parsedId);

  const normalized = normalizeMaterialPayload(payload);
  return updateMaterialInDb(parsedId, normalized);
}

export async function deleteMaterial(id) {
  const parsedId = parseUuid(id);
  await findByIdOrThrow(parsedId);

  await deleteMaterialFromDb(parsedId);

  return { success: true };
}