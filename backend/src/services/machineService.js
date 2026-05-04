import {
  createMachine as createMachineInDb,
  deleteMachine as deleteMachineFromDb,
  getAllMachines,
  getMachineById as getMachineByIdFromDb,
  updateMachine as updateMachineInDb
} from "../repositories/machineRepository.js";

function parsePositiveNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    const error = new Error(`${fieldName} 0'dan büyük bir sayı olmalıdır`);
    error.statusCode = 400;
    throw error;
  }

  return number;
}

function parseMachineId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    const error = new Error("Geçersiz makine kimliği");
    error.statusCode = 400;
    throw error;
  }

  return parsedId;
}

function normalizeMachinePayload(payload) {
  const model = payload.model?.trim();

  if (!model) {
    const error = new Error("Model zorunludur");
    error.statusCode = 400;
    throw error;
  }

  return {
    legacyNo: payload.legacyNo?.trim() || "",
    model,
    maxTonnageTonf: parsePositiveNumber(payload.maxTonnageTonf, "Maksimum tonaj"),
    workingLengthMm: parsePositiveNumber(payload.workingLengthMm, "Çalışma boyu"),
    maxThicknessMm: parsePositiveNumber(payload.maxThicknessMm, "Maksimum kalınlık"),
    basePriceUSD: parsePositiveNumber(payload.basePriceUSD, "Baz fiyat")
  };
}

async function findByIdOrThrow(id) {
  const parsedId = parseMachineId(id);

  const machine = await getMachineByIdFromDb(parsedId);

  if (!machine) {
    const error = new Error("Makine bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return machine;
}

export async function listMachines() {
  return getAllMachines();
}

export async function getMachineById(id) {
  return findByIdOrThrow(id);
}

export async function createMachine(payload) {
  const normalized = normalizeMachinePayload(payload);
  return createMachineInDb(normalized);
}

export async function updateMachine(id, payload) {
  const parsedId = parseMachineId(id);
  await findByIdOrThrow(parsedId);

  const normalized = normalizeMachinePayload(payload);
  return updateMachineInDb(parsedId, normalized);
}

export async function deleteMachine(id) {
  const parsedId = parseMachineId(id);
  await findByIdOrThrow(parsedId);

  await deleteMachineFromDb(parsedId);

  return { success: true };
}