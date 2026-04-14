import { login } from "../services/authService.js";

export async function loginController(req, res) {
  const result = await login(req.body.username, req.body.password);
  res.json(result);
}

export async function meController(req, res) {
  res.json({ user: req.user });
}
