import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser
} from "../services/userService.js";

export async function listUsersController(_req, res) {
  const items = await listUsers();
  res.json({ items });
}

export async function getUserByIdController(req, res) {
  const item = await getUserById(req.params.id);
  res.json({ item });
}

export async function createUserController(req, res) {
  const item = await createUser(req.body);
  res.status(201).json({ item });
}

export async function updateUserController(req, res) {
  const item = await updateUser(req.params.id, req.body);
  res.json({ item });
}

export async function deleteUserController(req, res) {
  const result = await deleteUser(req.params.id);
  res.json(result);
}
