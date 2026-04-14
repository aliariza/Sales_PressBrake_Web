import mongoose from "mongoose";

import { Material } from "../models/Material.js";

function toMaterialDto(material) {
  return {
    id: material._id.toString(),
    legacyNo: material.legacyNo || "",
    name: material.name,
    tensileStrengthMPa: material.tensileStrengthMPa,
    yieldStrengthMPa: material.yieldStrengthMPa,
    kFactorDefault: material.kFactorDefault,
    youngsModulusMPa: material.youngsModulusMPa,
    recommendedVdieFactor: material.recommendedVdieFactor,
    minThicknessMm: material.minThicknessMm,
    maxThicknessMm: material.maxThicknessMm,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Geçersiz malzeme kimliği");
    error.statusCode = 400;
    throw error;
  }

  const material = await Material.findById(id);
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

  const tensileStrengthMPa = parsePositiveNumber(payload.tensileStrengthMPa, "Çekme dayanımı");
  const yieldStrengthMPa = parsePositiveNumber(payload.yieldStrengthMPa, "Akma dayanımı");
  const kFactorDefault = parseBoundedNumber(payload.kFactorDefault, "K faktörü", 0, 1);
  const youngsModulusMPa = parsePositiveNumber(payload.youngsModulusMPa, "Young modülü");
  const recommendedVdieFactor = parsePositiveNumber(payload.recommendedVdieFactor, "Önerilen V-kalıp faktörü");
  const minThicknessMm = parsePositiveNumber(payload.minThicknessMm, "Minimum kalınlık");
  const maxThicknessMm = parsePositiveNumber(payload.maxThicknessMm, "Maksimum kalınlık");

  if (maxThicknessMm < minThicknessMm) {
    const error = new Error("Maksimum kalınlık minimum kalınlığa eşit veya daha büyük olmalıdır");
    error.statusCode = 400;
    throw error;
  }

  return {
    legacyNo: payload.legacyNo?.trim() || "",
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
  const materials = await Material.find().sort({ createdAt: 1 });
  return materials.map(toMaterialDto);
}

export async function getMaterialById(id) {
  const material = await findByIdOrThrow(id);
  return toMaterialDto(material);
}

export async function createMaterial(payload) {
  const normalized = normalizeMaterialPayload(payload);
  const material = await Material.create(normalized);
  return toMaterialDto(material);
}

export async function updateMaterial(id, payload) {
  const material = await findByIdOrThrow(id);
  const normalized = normalizeMaterialPayload(payload);

  Object.assign(material, normalized);
  await material.save();

  return toMaterialDto(material);
}

export async function deleteMaterial(id) {
  const material = await findByIdOrThrow(id);
  await material.deleteOne();
  return { success: true };
}
