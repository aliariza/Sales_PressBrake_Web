import {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  listMaterials,
  updateMaterial
} from "../services/materialService.js";

export async function listMaterialsController(_req, res) {
  const items = await listMaterials();
  res.json({ items });
}

export async function getMaterialByIdController(req, res) {
  const item = await getMaterialById(req.params.id);
  res.json({ item });
}

export async function createMaterialController(req, res) {
  const item = await createMaterial(req.body);
  res.status(201).json({ item });
}

export async function updateMaterialController(req, res) {
  const item = await updateMaterial(req.params.id, req.body);
  res.json({ item });
}

export async function deleteMaterialController(req, res) {
  const result = await deleteMaterial(req.params.id);
  res.json(result);
}
