import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function login(username, password) {
  const user = await User.findOne({ username }).lean();

  if (!user) {
    throw new Error("Kullanıcı adı veya şifre hatalı");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Kullanıcı adı veya şifre hatalı");
  }

  const token = jwt.sign(
    { sub: user._id.toString(), username: user.username, role: user.role },
    env.jwtSecret,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      comments: user.comments
    }
  };
}
