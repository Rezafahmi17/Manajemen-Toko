import { z } from "zod";
import { pool } from "../config/db.js";
import { tenantId } from "../middleware/auth.js";
import { AppError } from "../utils/http.js";

const schema = z.object({
  name: z.string().min(2, "Nama barang minimal 2 karakter"),

  description: z.string().optional().default(""),

  sku: z.string().optional().default(""),

  price: z.coerce.number().min(0),

  rental_price_per_day: z.coerce.number().min(0).nullable().optional(),

  stock: z.coerce.number().int().min(0),
  transaction_type: z.enum(['penjualan','penyewaan','keduanya']).default('keduanya'),

  is_active: z
    .union([z.boolean(), z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined) return true;

      return value === true || value === "true" || value === "1" || value === 1;
    }),
});

/* =====================================================
   MEMBUAT URL FOTO
===================================================== */

function getImageUrl(req, filename) {
  if (!filename) return null;

  return `${req.protocol}://${req.get("host")}/uploads/products/${filename}`;
}

/* =====================================================
   PUBLIC PRODUCT
===================================================== */

export async function publicProducts(req, res) {
  const tid = Number(req.params.tenantId);

  if (!Number.isInteger(tid) || tid < 1) {
    throw new AppError("Tenant tidak valid", 400);
  }

  const [rows] = await pool.query(
    `
      SELECT
        id,
        tenant_id,
        name,
        description,
        sku,
        price,
        rental_price_per_day,
        transaction_type,
        stock,
        image_url
      FROM products
      WHERE tenant_id = ?
      AND is_active = 1
      ORDER BY created_at DESC
    `,
    [tid],
  );

  res.json({
    data: rows,
  });
}

/* =====================================================
   LIST PRODUCT ADMIN
===================================================== */

export async function list(req, res) {
  const tid = tenantId(req);

  const [rows] = await pool.query(
    `
      SELECT *
      FROM products
      WHERE tenant_id = ?
      ORDER BY created_at DESC
    `,
    [tid],
  );

  res.json({
    data: rows,
  });
}

/* =====================================================
   CREATE PRODUCT
===================================================== */

export async function create(req, res) {
  const tid = tenantId(req);

  const d = schema.parse(req.body);
  if (d.transaction_type !== 'penyewaan' && d.price <= 0) throw new AppError('Harga jual harus lebih dari 0',400);
  if (d.transaction_type !== 'penjualan' && !(d.rental_price_per_day > 0)) throw new AppError('Harga sewa per hari harus lebih dari 0',400);

  let imageUrl = null;

  if (req.file) {
    imageUrl = getImageUrl(req, req.file.filename);
  }

  const [result] = await pool.query(
    `
      INSERT INTO products (
        tenant_id,
        name,
        description,
        sku,
        price,
        rental_price_per_day,
        transaction_type,
        stock,
        image_url,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      tid,
      d.name,
      d.description || null,
      d.sku || null,
      d.price,
      d.rental_price_per_day ?? null,
      d.transaction_type,
      d.stock,
      imageUrl,
      d.is_active ? 1 : 0,
    ],
  );

  res.status(201).json({
    id: result.insertId,
    image_url: imageUrl,
    message: "Produk berhasil ditambahkan",
  });
}

/* =====================================================
   UPDATE PRODUCT
===================================================== */

export async function update(req, res) {
  const tid = tenantId(req);

  const d = schema.parse(req.body);
  if (d.transaction_type !== 'penyewaan' && d.price <= 0) throw new AppError('Harga jual harus lebih dari 0',400);
  if (d.transaction_type !== 'penjualan' && !(d.rental_price_per_day > 0)) throw new AppError('Harga sewa per hari harus lebih dari 0',400);

  /* Cari produk terlebih dahulu */

  const [existing] = await pool.query(
    `
      SELECT
        id,
        image_url
      FROM products
      WHERE id = ?
      AND tenant_id = ?
      LIMIT 1
    `,
    [req.params.id, tid],
  );

  if (!existing.length) {
    throw new AppError("Produk tidak ditemukan", 404);
  }

  /*
    Secara default gunakan foto lama.
    Kalau admin upload foto baru,
    URL foto akan diganti.
  */

  let imageUrl = existing[0].image_url || null;

  if (req.file) {
    imageUrl = getImageUrl(req, req.file.filename);
  }

  const [result] = await pool.query(
    `
      UPDATE products

      SET
        name = ?,
        description = ?,
        sku = ?,
        price = ?,
        rental_price_per_day = ?,
        transaction_type = ?,
        stock = ?,
        image_url = ?,
        is_active = ?

      WHERE id = ?
      AND tenant_id = ?
    `,
    [
      d.name,
      d.description || null,
      d.sku || null,
      d.price,
      d.rental_price_per_day ?? null,
      d.transaction_type,
      d.stock,
      imageUrl,
      d.is_active ? 1 : 0,
      req.params.id,
      tid,
    ],
  );

  if (!result.affectedRows) {
    throw new AppError("Produk tidak ditemukan", 404);
  }

  res.json({
    image_url: imageUrl,
    message: "Produk berhasil diperbarui",
  });
}

/* =====================================================
   DELETE PRODUCT
===================================================== */

export async function remove(req, res) {
  const tid = tenantId(req);

  const [result] = await pool.query(
    `
      UPDATE products SET is_active=0
      WHERE id = ?
      AND tenant_id = ?
    `,
    [req.params.id, tid],
  );

  if (!result.affectedRows) {
    throw new AppError("Produk tidak ditemukan", 404);
  }

  res.json({
    message: "Produk dinonaktifkan dari katalog (riwayat transaksi tetap tersimpan)",
  });
}
