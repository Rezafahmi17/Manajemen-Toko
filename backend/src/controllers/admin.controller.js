import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../config/db.js";
import { AppError, slugify } from "../utils/http.js";
export async function listTenants(req, res) {
  const [rows] = await pool.query(
    `SELECT t.*, (SELECT COUNT(*) FROM products p WHERE p.tenant_id=t.id) products,
    (SELECT COUNT(*) FROM orders o WHERE o.tenant_id=t.id) orders,
    (SELECT COALESCE(SUM(amount),0) FROM transactions x WHERE x.tenant_id=t.id AND x.type='pemasukan') revenue
    FROM tenants t ORDER BY t.created_at DESC`,
  );
  res.json({ data: rows });
}
export async function createTenant(req, res) {
  const d = z
    .object({
      name: z.string().min(3),
      type: z.enum(["penjualan", "penyewaan", "campuran"]),
      address: z.string().optional(),
      phone: z.string().optional(),
      late_fee_per_day: z.coerce.number().min(0).default(0),
      admin_name: z.string().min(2),
      admin_email: z.string().email(),
      admin_password: z.string().min(8),
    })
    .parse(req.body);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const slug = `${slugify(d.name)}-${Date.now().toString().slice(-5)}`;
    const [t] = await conn.query(
      "INSERT INTO tenants(name,slug,type,address,phone,late_fee_per_day) VALUES(?,?,?,?,?,?)",
      [
        d.name,
        slug,
        d.type,
        d.address || null,
        d.phone || null,
        d.late_fee_per_day,
      ],
    );
    const hash = await bcrypt.hash(d.admin_password, 12);
    await conn.query(
      "INSERT INTO users(tenant_id,name,email,password_hash,role,must_confirm) VALUES(?,?,?,?, 'tenant_admin',1)",
      [t.insertId, d.admin_name, d.admin_email, hash],
    );
    await conn.commit();
    res
      .status(201)
      .json({
        message: "Tenant dan akun admin berhasil dibuat",
        tenant_id: t.insertId,
      });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY")
      throw new AppError("Email admin sudah digunakan", 409);
    throw e;
  } finally {
    conn.release();
  }
}
export async function stats(req, res) {
  const [[a]] = await pool.query(
    "SELECT COUNT(*) tenants FROM tenants WHERE is_active=1",
  );
  const [[b]] = await pool.query(
    "SELECT COUNT(*) orders,COALESCE(SUM(CASE WHEN status IN ('paid','processing','completed') THEN total ELSE 0 END),0) revenue FROM orders",
  );
  const [monthly] = await pool.query(
    "SELECT DATE_FORMAT(created_at,'%Y-%m') label,COUNT(*) orders,COALESCE(SUM(total),0) total FROM orders GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY label DESC LIMIT 12",
  );
  res.json({
    tenants: a.tenants,
    orders: b.orders,
    revenue: b.revenue,
    monthly: monthly.reverse(),
  });
}
