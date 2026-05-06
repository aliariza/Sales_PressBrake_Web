import { getAllMachines } from "../repositories/machineRepository.js";
import {
  getAllMaterials,
  getMaterialById
} from "../repositories/materialRepository.js";
import { getAllOptions } from "../repositories/optionRepository.js";
import { getAllToolings } from "../repositories/toolingRepository.js";

function parsePositiveNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    const error = new Error(`${fieldName} 0'dan büyük bir sayı olmalıdır`);
    error.statusCode = 400;
    throw error;
  }

  return number;
}

function isUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

async function resolveMaterial(materialId, materialName) {
  if (materialId && isUuid(materialId)) {
    const material = await getMaterialById(materialId);

    if (material) {
      return material;
    }
  }

  const normalizedName = materialName?.trim().toLowerCase();

  if (!normalizedName) {
    const error = new Error("Malzeme seçimi zorunludur");
    error.statusCode = 400;
    throw error;
  }

  const materials = await getAllMaterials();
  const material = materials.find(
    (entry) => entry.name.toLowerCase() === normalizedName
  );

  if (!material) {
    const error = new Error("Seçilen malzeme bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return material;
}

export async function buildRecommendations({
  materialId,
  materialName,
  thicknessMm,
  bendLengthMm
}) {
  const parsedThicknessMm = parsePositiveNumber(thicknessMm, "Kalınlık");
  const parsedBendLengthMm = parsePositiveNumber(bendLengthMm, "Bükme boyu");
  const material = await resolveMaterial(materialId, materialName);

  if (
    parsedThicknessMm < material.minThicknessMm ||
    parsedThicknessMm > material.maxThicknessMm
  ) {
    const error = new Error(
      `${material.name} için kalınlık ${material.minThicknessMm} mm ile ${material.maxThicknessMm} mm arasında olmalıdır`
    );
    error.statusCode = 400;
    throw error;
  }

  const allMachines = await getAllMachines();

  const machines = allMachines
    .filter((machine) => {
      return (
        machine.maxThicknessMm >= parsedThicknessMm &&
        machine.workingLengthMm >= parsedBendLengthMm
      );
    })
    .sort((a, b) => {
      return (
        a.maxThicknessMm - b.maxThicknessMm ||
        a.workingLengthMm - b.workingLengthMm ||
        a.basePriceUSD - b.basePriceUSD
      );
    });

  const targetVdie = parsedThicknessMm * material.recommendedVdieFactor;

  const toolingCandidates = await getAllToolings();

  const toolings = toolingCandidates
    .map((tooling) => ({
      tooling,
      reason: `Closest to target V-die ≈ ${targetVdie} mm`,
      diff: Math.abs(tooling.vDieMm - targetVdie)
    }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5)
    .map(({ diff, ...rest }) => rest);

  const options = await getAllOptions();

  return {
    material,
    machines: machines.map((machine) => ({
      machine,
      reason:
        `${material.name} için uygun; maksimum kalınlık (${machine.maxThicknessMm} mm) ` +
        `ve çalışma boyu (${machine.workingLengthMm} mm) gereksinimi karşılıyor.`
    })),
    toolings,
    options
  };
}
