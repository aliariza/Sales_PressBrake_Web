import {
  createTooling,
  deleteTooling,
  getToolingById,
  listToolings,
  updateTooling
} from "../services/toolingService.js";

export async function listToolingsController(_req, res) {
  const items = await listToolings();
  res.json({ items });
}

export async function getToolingByIdController(req, res) {
  const item = await getToolingById(req.params.id);
  res.json({ item });
}

export async function createToolingController(req, res) {
  const item = await createTooling(req.body);
  res.status(201).json({ item });
}

export async function updateToolingController(req, res) {
  const item = await updateTooling(req.params.id, req.body);
  res.json({ item });
}

export async function deleteToolingController(req, res) {
  const result = await deleteTooling(req.params.id);
  res.json(result);
}
