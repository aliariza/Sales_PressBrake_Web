import { Machine } from "../models/Machine.js";
import { Option } from "../models/Option.js";
import { Tooling } from "../models/Tooling.js";

export async function buildRecommendations({ thicknessMm, bendLengthMm }) {
  const machines = await Machine.find({
    maxThicknessMm: { $gte: thicknessMm },
    workingLengthMm: { $gte: bendLengthMm }
  })
    .sort({ maxThicknessMm: 1, workingLengthMm: 1, basePriceUSD: 1 })
    .lean();

  const targetVdie = thicknessMm * 8;
  const toolingCandidates = await Tooling.find().lean();
  const toolings = toolingCandidates
    .map((tooling) => ({
      tooling,
      reason: `Closest to target V-die ≈ ${targetVdie} mm`,
      diff: Math.abs(tooling.vDieMm - targetVdie)
    }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5)
    .map(({ diff, ...rest }) => rest);

  const options = await Option.find().sort({ code: 1 }).lean();

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
