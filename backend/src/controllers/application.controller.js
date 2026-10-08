import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../config/db.js";
import { AppError, slugify } from "../utils/http.js";

const applicationSchema = z.object({
  store_name: z.string().trim().min(3).max(120),
  type: z.enum(['penjualan','penyewaan','campuran']).default('campuran'),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
  admin_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
  late_fee_per_day: z.coerce.number().min(0).default(0),
});

export async function apply(req, res) {
  const d = applicationSchema.parse(req.body);
  const hash = await bcrypt.hash(d.password, 12);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[exists]] = await conn.query('SELECT id FROM users WHERE email=?', [d.email]);
    if (exists) throw new AppError('Email sudah digunakan', 409);
    const slug = `${slugify(d.store_name)}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const [t] = await conn.query(
      `INSERT INTO tenants(name,slug,type,address,phone,late_fee_per_day,approval_status,is_active)
       VALUES(?,?,?,?,?,?,'pending',0)`,
      [d.store_name,slug,d.type,d.address||null,d.phone||null,d.late_fee_per_day]
    );
    await conn.query(
      `INSERT INTO users(tenant_id,name,email,password_hash,role,is_active,must_confirm)
       VALUES(?,?,?,?,'tenant_admin',0,0)`,
      [t.insertId,d.admin_name,d.email,hash]
    );
    await conn.commit();
    res.status(201).json({message:'Pengajuan diterima. Tunggu persetujuan super admin.', application_id:t.insertId});
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') throw new AppError('Email atau nama toko sudah digunakan',409);
    throw e;
  } finally {conn.release();}
}

export async function review(req,res) {
  const id = Number(req.params.id);
  const { decision } = z.object({ decision: z.enum(['approved','rejected']) }).parse(req.body);
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('ID tidak valid',400);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[tenant]] = await conn.query('SELECT id,approval_status FROM tenants WHERE id=? FOR UPDATE',[id]);
    if (!tenant) throw new AppError('Tenant tidak ditemukan',404);
    if (tenant.approval_status !== 'pending') throw new AppError('Pengajuan sudah diproses',409);
    await conn.query('UPDATE tenants SET approval_status=?,is_active=? WHERE id=?',[decision,decision==='approved'?1:0,id]);
    await conn.query("UPDATE users SET is_active=? WHERE tenant_id=? AND role='tenant_admin'",[decision==='approved'?1:0,id]);
    await conn.commit();
    res.json({message:decision==='approved'?'Tenant disetujui':'Pengajuan ditolak'});
  } catch(e) {await conn.rollback(); throw e;} finally {conn.release();}
}
