import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../config/db.js";
import { AppError } from "../utils/http.js";
const cookie = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.COOKIE_SECURE === "true",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};
export async function login(req, res) {
  const d = z
    .object({ email: z.string().email(), password: z.string().min(6) })
    .parse(req.body);
  const [[u]] = await pool.query(
    "SELECT id,tenant_id,name,email,password_hash,role,is_active,must_confirm FROM users WHERE email=?",
    [d.email],
  );
  if (u?.role === 'tenant_admin' && !u.is_active) {
    throw new AppError('Akun toko belum disetujui atau pengajuan ditolak',403);
  }
  if (
    !u ||
    !u.is_active ||
    !(await bcrypt.compare(d.password, u.password_hash))
  )
    throw new AppError("Email atau password salah", 401);
  const token = jwt.sign(
    { id: u.id, tenant_id: u.tenant_id, role: u.role, name: u.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
  );
  res
    .cookie("token", token, cookie)
    .json({
      user: {
        id: u.id,
        tenant_id: u.tenant_id,
        name: u.name,
        email: u.email,
        role: u.role,
        must_confirm: !!u.must_confirm,
      },
    });
}
export async function register(req, res) {
  const d = z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    })
    .parse(req.body);
  const [e] = await pool.query("SELECT id FROM users WHERE email=?", [d.email]);
  if (e.length) throw new AppError("Email sudah digunakan", 409);
  const hash = await bcrypt.hash(d.password, 12);
  const [r] = await pool.query(
    "INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'customer')",
    [d.name, d.email, hash],
  );
  res.status(201).json({ message: "Registrasi berhasil", id: r.insertId });
}
export async function me(req, res) {
  const [[u]] = await pool.query(
    "SELECT id,tenant_id,name,email,role,must_confirm FROM users WHERE id=?",
    [req.user.id],
  );
  res.json({ user: u });
}
export async function confirm(req, res) {
  await pool.query("UPDATE users SET must_confirm=0 WHERE id=?", [req.user.id]);
  res.json({ message: "Akun dikonfirmasi" });
}
export function logout(req, res) {
  res.clearCookie("token", { path: "/" }).json({ message: "Logout berhasil" });
}
