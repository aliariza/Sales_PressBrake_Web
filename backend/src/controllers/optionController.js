import {
  createOption,
  deleteOption,
  getOptionById,
  listOptions,
  updateOption
} from "../services/optionService.js";

export async function listOptionsController(_req, res) {
  const items = await listOptions();
  res.json({ items });
}

export async function getOptionByIdController(req, res) {
  const item = await getOptionById(req.params.id);
  res.json({ item });
}

export async function createOptionController(req, res) {
  const item = await createOption(req.body);
  res.status(201).json({ item });
}

export async function updateOptionController(req, res) {
  const item = await updateOption(req.params.id, req.body);
  res.json({ item });
}

export async function deleteOptionController(req, res) {
  const result = await deleteOption(req.params.id);
  res.json(result);
}
