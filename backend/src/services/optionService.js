import mongoose from "mongoose";

import { Option } from "../models/Option.js";

function toOptionDto(option) {
  return {
    id: option._id.toString(),
    legacyNo: option.legacyNo || "",
    code: option.code,
    name: option.name,
    priceUsd: option.priceUsd,
    createdAt: option.createdAt,
    updatedAt: option.updatedAt
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
    const error = new Error("Geçersiz opsiyon kimliği");
    error.statusCode = 400;
    throw error;
  }

  const option = await Option.findById(id);
  if (!option) {
    const error = new Error("Opsiyon bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return option;
}

async function ensureCodeAvailable(code, excludedId = null) {
  const existing = await Option.findOne({ code });
  if (existing && existing._id.toString() !== excludedId) {
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
    legacyNo: payload.legacyNo?.trim() || "",
    code,
    name,
    priceUsd: parsePositiveNumber(payload.priceUsd, "Fiyat")
  };
}

export async function listOptions() {
  const options = await Option.find().sort({ createdAt: 1 });
  return options.map(toOptionDto);
}

export async function getOptionById(id) {
  const option = await findByIdOrThrow(id);
  return toOptionDto(option);
}

export async function createOption(payload) {
  const normalized = normalizeOptionPayload(payload);
  await ensureCodeAvailable(normalized.code);

  const option = await Option.create(normalized);
  return toOptionDto(option);
}

export async function updateOption(id, payload) {
  const option = await findByIdOrThrow(id);
  const normalized = normalizeOptionPayload(payload);

  await ensureCodeAvailable(normalized.code, option._id.toString());

  Object.assign(option, normalized);
  await option.save();

  return toOptionDto(option);
}

export async function deleteOption(id) {
  const option = await findByIdOrThrow(id);
  await option.deleteOne();
  return { success: true };
}
