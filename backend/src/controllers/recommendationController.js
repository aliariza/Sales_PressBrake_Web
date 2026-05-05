import { buildRecommendations } from "../services/recommendationService.js";

export async function recommendController(req, res) {
  const { materialId, materialName, thicknessMm, bendLengthMm } = req.body;

  const result = await buildRecommendations({
    materialId,
    materialName,
    thicknessMm: Number(thicknessMm),
    bendLengthMm: Number(bendLengthMm)
  });

  res.json(result);
}
