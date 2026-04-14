import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Kimlik doğrulama gerekli" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Geçersiz oturum anahtarı" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Yönetici yetkisi gerekli" });
  }

  return next();
}
