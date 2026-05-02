import { getAllMachines } from "../repositories/machineRepository.js";
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

export async function buildRecommendations({ thicknessMm, bendLengthMm }) {
  const parsedThicknessMm = parsePositiveNumber(thicknessMm, "Kalınlık");
  const parsedBendLengthMm = parsePositiveNumber(bendLengthMm, "Bükme boyu");

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

  const targetVdie = parsedThicknessMm * 8;

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
    machines: machines.map((machine) => ({
      machine,
      reason:
        `Suitable because max thickness (${machine.maxThicknessMm} mm) ` +
        `and working length (${machine.workingLengthMm} mm) meet the requirement.`
    })),
    toolings,
    options
  };
}