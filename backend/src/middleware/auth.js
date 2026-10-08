import jwt from "jsonwebtoken";
import { AppError } from "../utils/http.js";
export function auth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next(new AppError("Silakan login terlebih dahulu", 401));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return next(new AppError("Sesi tidak valid atau sudah berakhir", 401));
  }
}
export const allow =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : next(new AppError("Akses ditolak", 403));
export function tenantId(req, { allowSuper = true } = {}) {
  if (req.user.role === "tenant_admin") {
    if (!req.user.tenant_id)
      throw new AppError("Akun tidak terhubung ke tenant", 403);
    return Number(req.user.tenant_id);
  }
  if (allowSuper && req.user.role === "super_admin") {
    const id = Number(
      req.params.tenantId || req.query.tenant_id || req.body.tenant_id,
    );
    if (!id) throw new AppError("tenant_id wajib", 400);
    return id;
  }
  throw new AppError("Akses tenant ditolak", 403);
}
