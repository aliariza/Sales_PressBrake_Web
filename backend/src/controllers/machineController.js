import {
  createMachine,
  deleteMachine,
  getMachineById,
  listMachines,
  updateMachine
} from "../services/machineService.js";

export async function listMachinesController(_req, res) {
  const items = await listMachines();
  res.json({ items });
}

export async function getMachineByIdController(req, res) {
  const item = await getMachineById(req.params.id);
  res.json({ item });
}

export async function createMachineController(req, res) {
  const item = await createMachine(req.body);
  res.status(201).json({ item });
}

export async function updateMachineController(req, res) {
  const item = await updateMachine(req.params.id, req.body);
  res.json({ item });
}

export async function deleteMachineController(req, res) {
  const result = await deleteMachine(req.params.id);
  res.json(result);
}
