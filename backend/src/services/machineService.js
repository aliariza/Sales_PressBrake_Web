import mongoose from "mongoose";

import { Machine } from "../models/Machine.js";

function toMachineDto(machine) {
  return {
    id: machine._id.toString(),
    legacyNo: machine.legacyNo || "",
    model: machine.model,
    maxTonnageTonf: machine.maxTonnageTonf,
    workingLengthMm: machine.workingLengthMm,
    maxThicknessMm: machine.maxThicknessMm,
    basePriceUSD: machine.basePriceUSD,
    createdAt: machine.createdAt,
    updatedAt: machine.updatedAt
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

async function findByIdOrThrow(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Geçersiz makine kimliği");
    error.statusCode = 400;
    throw error;
  }

  const machine = await Machine.findById(id);
  if (!machine) {
    const error = new Error("Makine bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return machine;
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

export async function listMachines() {
  const machines = await Machine.find().sort({ createdAt: 1 });
  return machines.map(toMachineDto);
}

export async function getMachineById(id) {
  const machine = await findByIdOrThrow(id);
  return toMachineDto(machine);
}

export async function createMachine(payload) {
  const normalized = normalizeMachinePayload(payload);
  const machine = await Machine.create(normalized);
  return toMachineDto(machine);
}

export async function updateMachine(id, payload) {
  const machine = await findByIdOrThrow(id);
  const normalized = normalizeMachinePayload(payload);

  Object.assign(machine, normalized);
  await machine.save();

  return toMachineDto(machine);
}

export async function deleteMachine(id) {
  const machine = await findByIdOrThrow(id);
  await machine.deleteOne();
  return { success: true };
}
