import mongoose from "mongoose";

import { Tooling } from "../models/Tooling.js";

function toToolingDto(tooling) {
  return {
    id: tooling._id.toString(),
    legacyNo: tooling.legacyNo || "",
    name: tooling.name,
    vDieMm: tooling.vDieMm,
    punchRadiusMm: tooling.punchRadiusMm,
    dieRadiusMm: tooling.dieRadiusMm,
    createdAt: tooling.createdAt,
    updatedAt: tooling.updatedAt
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
    const error = new Error("Geçersiz takım kimliği");
    error.statusCode = 400;
    throw error;
  }

  const tooling = await Tooling.findById(id);
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
    legacyNo: payload.legacyNo?.trim() || "",
    name,
    vDieMm: parsePositiveNumber(payload.vDieMm, "V-kalıp"),
    punchRadiusMm: parsePositiveNumber(payload.punchRadiusMm, "Punç yarıçapı"),
    dieRadiusMm: parsePositiveNumber(payload.dieRadiusMm, "Kalıp yarıçapı")
  };
}

export async function listToolings() {
  const toolings = await Tooling.find().sort({ createdAt: 1 });
  return toolings.map(toToolingDto);
}

export async function getToolingById(id) {
  const tooling = await findByIdOrThrow(id);
  return toToolingDto(tooling);
}

export async function createTooling(payload) {
  const normalized = normalizeToolingPayload(payload);
  const tooling = await Tooling.create(normalized);
  return toToolingDto(tooling);
}

export async function updateTooling(id, payload) {
  const tooling = await findByIdOrThrow(id);
  const normalized = normalizeToolingPayload(payload);

  Object.assign(tooling, normalized);
  await tooling.save();

  return toToolingDto(tooling);
}

export async function deleteTooling(id) {
  const tooling = await findByIdOrThrow(id);
  await tooling.deleteOne();
  return { success: true };
}
