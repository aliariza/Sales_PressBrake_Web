import bcrypt from "bcryptjs";

import {
  countAdmins,
  createUser as createUserInDb,
  deleteUser as deleteUserFromDb,
  getAllUsers,
  getUserById as getUserByIdFromDb,
  getUserByUsername,
  toPublicUser,
  updateUser as updateUserInDb
} from "../repositories/userRepository.js";

function parseUuid(id) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    const error = new Error("Geçersiz kullanıcı kimliği");
    error.statusCode = 400;
    throw error;
  }

  return id;
}

async function findByIdOrThrow(id) {
  const parsedId = parseUuid(id);

  const user = await getUserByIdFromDb(parsedId);

  if (!user) {
    const error = new Error("Kullanıcı bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function ensureUsernameAvailable(username, excludedId = null) {
  const existing = await getUserByUsername(username);

  if (existing && existing.id !== excludedId) {
    const error = new Error("Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor");
    error.statusCode = 409;
    throw error;
  }
}

async function ensureLastAdminNotRemoved(targetUserId, nextRole = null, deleting = false) {
  const targetUser = await findByIdOrThrow(targetUserId);

  if (targetUser.role !== "admin") {
    return targetUser;
  }

  const adminCount = await countAdmins();
  const demoting = nextRole && nextRole !== "admin";

  if (adminCount === 1 && (deleting || demoting)) {
    const error = new Error("Son kalan yönetici silinemez veya yetkisi düşürülemez");
    error.statusCode = 400;
    throw error;
  }

  return targetUser;
}

export async function listUsers() {
  const users = await getAllUsers();
  return users.map(toPublicUser);
}

export async function getUserById(id) {
  const user = await findByIdOrThrow(id);
  return toPublicUser(user);
}

export async function createUser(payload) {
  const username = payload.username?.trim();
  const password = payload.password || "";
  const role = payload.role?.trim();
  const comments = payload.comments?.trim() || "";
  const legacyNo = payload.legacyNo?.toString().trim() || "";

  if (!username) {
    const error = new Error("Kullanıcı adı zorunludur");
    error.statusCode = 400;
    throw error;
  }

  if (!password) {
    const error = new Error("Şifre zorunludur");
    error.statusCode = 400;
    throw error;
  }

  if (!["admin", "user"].includes(role)) {
    const error = new Error("Rol yönetici veya kullanıcı olmalıdır");
    error.statusCode = 400;
    throw error;
  }

  await ensureUsernameAvailable(username);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await createUserInDb({
    legacyNo,
    username,
    passwordHash,
    role,
    comments
  });

  return toPublicUser(user);
}

export async function updateUser(id, payload) {
  const parsedId = parseUuid(id);
  const existingUser = await findByIdOrThrow(parsedId);

  const username = payload.username?.trim();
  const role = payload.role?.trim();
  const comments = payload.comments?.trim() || "";
  const password = payload.password || "";
  const legacyNo = payload.legacyNo?.toString().trim() || existingUser.legacyNo || "";

  if (!username) {
    const error = new Error("Kullanıcı adı zorunludur");
    error.statusCode = 400;
    throw error;
  }

  if (!["admin", "user"].includes(role)) {
    const error = new Error("Rol yönetici veya kullanıcı olmalıdır");
    error.statusCode = 400;
    throw error;
  }

  await ensureUsernameAvailable(username, parsedId);
  await ensureLastAdminNotRemoved(parsedId, role, false);

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const updatedUser = await updateUserInDb(parsedId, {
    legacyNo,
    username,
    passwordHash,
    role,
    comments
  });

  return toPublicUser(updatedUser);
}

export async function deleteUser(id) {
  const parsedId = parseUuid(id);

  await ensureLastAdminNotRemoved(parsedId, null, true);
  await deleteUserFromDb(parsedId);

  return { success: true };
}