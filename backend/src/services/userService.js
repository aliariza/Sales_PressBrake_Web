import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { User } from "../models/User.js";

function toUserDto(user) {
  return {
    id: user._id.toString(),
    legacyNo: user.legacyNo || "",
    username: user.username,
    role: user.role,
    comments: user.comments || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function findByIdOrThrow(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Geçersiz kullanıcı kimliği");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(id);
  if (!user) {
    const error = new Error("Kullanıcı bulunamadı");
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function ensureUsernameAvailable(username, excludedId = null) {
  const existing = await User.findOne({ username });
  if (existing && existing._id.toString() !== excludedId) {
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

  const adminCount = await User.countDocuments({ role: "admin" });
  const demoting = nextRole && nextRole !== "admin";

  if (adminCount === 1 && (deleting || demoting)) {
    const error = new Error("Son kalan yönetici silinemez veya yetkisi düşürülemez");
    error.statusCode = 400;
    throw error;
  }

  return targetUser;
}

export async function listUsers() {
  const users = await User.find().sort({ createdAt: 1 });
  return users.map(toUserDto);
}

export async function getUserById(id) {
  const user = await findByIdOrThrow(id);
  return toUserDto(user);
}

export async function createUser(payload) {
  const username = payload.username?.trim();
  const password = payload.password || "";
  const role = payload.role?.trim();
  const comments = payload.comments?.trim() || "";
  const legacyNo = payload.legacyNo?.trim() || "";

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

  const user = await User.create({
    legacyNo,
    username,
    passwordHash,
    role,
    comments
  });

  return toUserDto(user);
}

export async function updateUser(id, payload) {
  const user = await findByIdOrThrow(id);

  const username = payload.username?.trim();
  const role = payload.role?.trim();
  const comments = payload.comments?.trim() || "";
  const password = payload.password || "";

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

  await ensureUsernameAvailable(username, user._id.toString());
  await ensureLastAdminNotRemoved(user._id.toString(), role, false);

  user.username = username;
  user.role = role;
  user.comments = comments;

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();

  return toUserDto(user);
}

export async function deleteUser(id) {
  const user = await ensureLastAdminNotRemoved(id, null, true);
  await user.deleteOne();
  return { success: true };
}
