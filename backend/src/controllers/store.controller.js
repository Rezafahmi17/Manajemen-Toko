import { pool } from "../config/db.js";
export async function tenants(req, res) {
  const [rows] = await pool.query(
    "SELECT id,name,slug,type,address,phone,late_fee_per_day FROM tenants WHERE is_active=1 ORDER BY name",
  );
  res.json({ data: rows });
}
export async function tenant(req, res) {
  const [[row]] = await pool.query(
    "SELECT id,name,slug,type,address,phone,late_fee_per_day FROM tenants WHERE id=? AND is_active=1",
    [req.params.id],
  );
  if (!row) return res.status(404).json({ message: "Toko tidak ditemukan" });
  res.json({ data: row });
}
