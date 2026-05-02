import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { getUserByUsername } from "../repositories/userRepository.js";

export async function login(username, password) {
  const user = await getUserByUsername(username);

  if (!user) {
    throw new Error("Kullanıcı adı veya şifre hatalı");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new Error("Kullanıcı adı veya şifre hatalı");
  }

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      comments: user.comments
    }
  };
}