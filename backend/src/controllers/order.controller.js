import { z } from "zod";
import { pool } from "../config/db.js";
import { AppError, code } from "../utils/http.js";
import { tenantId } from "../middleware/auth.js";

/* =========================================================
   CHECKOUT
========================================================= */

export async function checkout(req, res) {
  const d = z
    .object({
      tenant_id: z.coerce.number().int().positive(),

      items: z
        .array(
          z.object({
            product_id: z.coerce.number().int().positive(),
            quantity: z.coerce.number().int().positive(),
            rental_days: z.coerce.number().int().positive().optional(),
          }),
        )
        .min(1),

      payment_method: z.enum(["tunai", "qris"]),
      transaction_type: z.enum(["penjualan", "penyewaan"]),
    })
    .parse(req.body);

  if (req.user.role === 'tenant_admin' && Number(req.user.tenant_id) !== d.tenant_id) {
    throw new AppError('Tidak boleh bertransaksi untuk toko lain',403);
  }
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // =========================
    // CEK TENANT
    // =========================
    const [[tenant]] = await conn.query(
      `
      SELECT *
      FROM tenants
      WHERE id = ?
      AND is_active = 1
      AND approval_status = 'approved'
      FOR UPDATE
      `,
      [d.tenant_id],
    );

    if (!tenant) {
      throw new AppError("Toko tidak ditemukan", 404);
    }

    let subtotal = 0;
    const lines = [];

    // =========================
    // CEK PRODUK
    // =========================
    for (const i of d.items) {
      const [[p]] = await conn.query(
        `
        SELECT *
        FROM products
        WHERE id = ?
        AND tenant_id = ?
        AND is_active = 1
        FOR UPDATE
        `,
        [i.product_id, d.tenant_id],
      );

      if (!p) {
        throw new AppError("Produk tidak ditemukan", 404);
      }

      if (lines.some(x => Number(x.p.id) === Number(p.id))) throw new AppError("Produk duplikat dalam keranjang",400);
      if (Number(p.stock) < Number(i.quantity)) {
        throw new AppError(`Stok ${p.name} tidak cukup`, 400);
      }

      if (p.transaction_type !== 'keduanya' && p.transaction_type !== d.transaction_type) {
        throw new AppError(`Produk ${p.name} tidak tersedia untuk ${d.transaction_type}`, 400);
      }
      const days = d.transaction_type === "penyewaan" ? i.rental_days || 1 : null;
      if (days && days > 365) throw new AppError('Durasi maksimal 365 hari',400);

      const unit =
        d.transaction_type === "penyewaan"
          ? Number(p.rental_price_per_day || 0)
          : Number(p.price || 0);

      if (!Number.isFinite(unit) || unit <= 0) throw new AppError(`Harga ${p.name} untuk ${d.transaction_type} belum valid`,400);
            const total = unit * Number(i.quantity) * (days || 1);

      subtotal += total;

      lines.push({
        p,
        i,
        days,
        unit,
        total,
      });
    }

    // =========================
    // BUAT ORDER
    // =========================
    const orderCode = code("ORD");

    const [orderResult] = await conn.query(
      `
      INSERT INTO orders(
        tenant_id,
        user_id,
        order_code,
        type,
        subtotal,
        total
      )
      VALUES(?,?,?,?,?,?)
      `,
      [d.tenant_id, req.user.id, orderCode, d.transaction_type, subtotal, subtotal],
    );

    const orderId = orderResult.insertId;

    // =========================
    // SIMPAN ITEM + KURANGI STOK
    // =========================
    for (const x of lines) {
      await conn.query(
        `
        INSERT INTO order_items(
          tenant_id,
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          rental_days,
          transaction_type,
          line_total
        )
        VALUES(?,?,?,?,?,?,?,?,?)
        `,
        [
          d.tenant_id,
          orderId,
          x.p.id,
          x.p.name,
          x.i.quantity,
          x.unit,
          x.days,
          d.transaction_type,
          x.total,
        ],
      );

      const [stockResult] = await conn.query(
        `
        UPDATE products
        SET stock = stock - ?
        WHERE id = ?
        AND tenant_id = ?
        AND stock >= ?
        `,
        [x.i.quantity, x.p.id, d.tenant_id, x.i.quantity],
      );

      if (!stockResult.affectedRows) {
        throw new AppError(`Stok ${x.p.name} tidak mencukupi`, 400);
      }
    }

    // =========================
    // BUAT DATA RENTAL
    // =========================
    if (d.transaction_type === "penyewaan") {
      const maxDays = Math.max(...lines.map((x) => x.days || 1));

      await conn.query(
        `
        INSERT INTO rentals(
          tenant_id,
          order_id,
          rent_date,
          due_date,
          late_fee_per_day
        )
        VALUES(
          ?,
          ?,
          CURDATE(),
          DATE_ADD(CURDATE(), INTERVAL ? DAY),
          ?
        )
        `,
        [d.tenant_id, orderId, maxDays, Number(tenant.late_fee_per_day || 0)],
      );
    }

    // =========================
    // PAYMENT
    // =========================
    const payload =
      d.payment_method === "qris"
        ? `ORDER:${orderCode}|AMOUNT:${subtotal}|TENANT:${tenant.name}`
        : null;

    await conn.query(
      `
      INSERT INTO payments(
        tenant_id,
        order_id,
        method,
        status,
        amount,
        qris_payload
      )
      VALUES(?,?,?,'pending',?,?)
      `,
      [d.tenant_id, orderId, d.payment_method, subtotal, payload],
    );

    await conn.commit();

    res.status(201).json({
      order_id: orderId,
      order_code: orderCode,
      total: subtotal,
      payment_method: d.payment_method,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/* =========================================================
   PESANAN CUSTOMER
========================================================= */

export async function myOrders(req, res) {
  const [rows] = await pool.query(
    `
    SELECT
      o.*,
      t.name AS tenant_name,
      p.method AS payment_method,
      p.status AS payment_status,
      r.status AS rental_status,
      r.rent_date,
      r.due_date,
      r.returned_at,
      r.late_days,
      r.fine_amount
    FROM orders o

    JOIN tenants t
      ON t.id = o.tenant_id

    LEFT JOIN payments p
      ON p.order_id = o.id
      AND p.tenant_id = o.tenant_id

    LEFT JOIN rentals r
      ON r.order_id = o.id
      AND r.tenant_id = o.tenant_id

    WHERE o.user_id = ?

    ORDER BY o.created_at DESC
    `,
    [req.user.id],
  );

  res.json({
    data: rows,
  });
}

/* =========================================================
   PESANAN ADMIN TENANT
========================================================= */

export async function tenantOrders(req, res) {
  const tid = tenantId(req);

  const [rows] = await pool.query(
    `
    SELECT
      o.*,

      u.name AS customer_name,

      p.method AS payment_method,
      p.status AS payment_status,

      r.id AS rental_id,
      r.status AS rental_status,
      r.rent_date,
      r.due_date,
      r.returned_at,
      r.late_days,
      r.fine_amount

    FROM orders o

    JOIN users u
      ON u.id = o.user_id

    LEFT JOIN payments p
      ON p.order_id = o.id
      AND p.tenant_id = o.tenant_id

    LEFT JOIN rentals r
      ON r.order_id = o.id
      AND r.tenant_id = o.tenant_id

    WHERE o.tenant_id = ?

    ORDER BY o.created_at DESC
    `,
    [tid],
  );

  res.json({
    data: rows,
  });
}

/* =========================================================
   DETAIL PESANAN
========================================================= */

export async function detail(req, res) {
  const [[order]] = await pool.query(
    `
    SELECT
      o.*,

      t.name AS tenant_name,
      t.address,
      t.phone,

      p.method AS payment_method,
      p.status AS payment_status,
      p.qris_payload,

      r.status AS rental_status,
      r.rent_date,
      r.due_date,
      r.returned_at,
      r.late_days,
      r.fine_amount

    FROM orders o

    JOIN tenants t
      ON t.id = o.tenant_id

    LEFT JOIN payments p
      ON p.order_id = o.id
      AND p.tenant_id = o.tenant_id

    LEFT JOIN rentals r
      ON r.order_id = o.id
      AND r.tenant_id = o.tenant_id

    WHERE o.id = ?

    LIMIT 1
    `,
    [req.params.id],
  );

  if (!order) {
    throw new AppError("Pesanan tidak ditemukan", 404);
  }

  // Customer hanya boleh melihat order miliknya
  if (
    req.user.role === "customer" &&
    Number(order.user_id) !== Number(req.user.id)
  ) {
    throw new AppError("Akses ditolak", 403);
  }

  // Admin tenant hanya boleh melihat order tenant miliknya
  if (
    req.user.role === "tenant_admin" &&
    Number(order.tenant_id) !== Number(req.user.tenant_id)
  ) {
    throw new AppError("Akses ditolak", 403);
  }

  const [items] = await pool.query(
    `
    SELECT *
    FROM order_items
    WHERE order_id = ?
    AND tenant_id = ?
    `,
    [order.id, order.tenant_id],
  );

  res.json({
    data: {
      ...order,
      items,
    },
  });
}

/* =========================================================
   KONFIRMASI PEMBAYARAN
========================================================= */

export async function markPaid(req, res) {
  const tid = tenantId(req);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // =========================
    // LOCK ORDER
    // =========================
    const [[order]] = await conn.query(
      `
      SELECT *
      FROM orders
      WHERE id = ?
      AND tenant_id = ?
      FOR UPDATE
      `,
      [req.params.id, tid],
    );

    if (!order) {
      throw new AppError("Pesanan tidak ditemukan", 404);
    }

    // =========================
    // LOCK PAYMENT
    // =========================
    const [[payment]] = await conn.query(
      `
      SELECT *
      FROM payments
      WHERE order_id = ?
      AND tenant_id = ?
      FOR UPDATE
      `,
      [order.id, tid],
    );

    if (!payment) {
      throw new AppError("Data pembayaran tidak ditemukan", 404);
    }

    // =========================
    // CEGAH PEMBAYARAN DOBEL
    // =========================
    if (payment.status !== "pending") {
      throw new AppError("Pesanan ini sudah lunas", 400);
    }

    // =========================
    // UPDATE PAYMENT
    // =========================
    await conn.query(
      `
      UPDATE payments
      SET
        status = 'paid',
        paid_at = NOW()
      WHERE order_id = ?
      AND tenant_id = ?
      `,
      [order.id, tid],
    );

    // =========================
    // UPDATE ORDER
    // =========================
    await conn.query(
      `
      UPDATE orders
      SET status = 'paid'
      WHERE id = ?
      AND tenant_id = ?
      `,
      [order.id, tid],
    );

    // =========================
    // TRANSAKSI PEMASUKAN
    // =========================
    await conn.query(
      `
      INSERT INTO transactions(
        tenant_id,
        order_id,
        type,
        category,
        description,
        amount,
        transaction_date
      )
      VALUES(
        ?,
        ?,
        'pemasukan',
        ?,
        'Pembayaran pesanan',
        ?,
        CURDATE()
      )
      `,
      [tid, order.id, order.type, Number(order.total || 0)],
    );

    // =========================
    // RECEIPT
    // =========================
    await conn.query(
      `
      INSERT IGNORE INTO receipts(
        tenant_id,
        order_id,
        receipt_no
      )
      VALUES(?,?,?)
      `,
      [tid, order.id, code("RCT")],
    );

    await conn.commit();

    res.json({
      message: "Pembayaran berhasil dikonfirmasi",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/* =========================================================
   PENGEMBALIAN BARANG SEWA
========================================================= */

export async function returnRental(req, res) {
  const tid = tenantId(req);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // =========================
    // AMBIL + LOCK DATA RENTAL
    // =========================
    const [[rental]] = await conn.query(
      `
      SELECT
        r.*,
        o.type AS order_type,
        o.status AS order_status,
        o.subtotal,
        o.total

      FROM rentals r

      JOIN orders o
        ON o.id = r.order_id
        AND o.tenant_id = r.tenant_id

      WHERE r.order_id = ?
      AND r.tenant_id = ?

      FOR UPDATE
      `,
      [req.params.id, tid],
    );

    if (!rental) {
      throw new AppError("Data sewa tidak ditemukan", 404);
    }

    // =========================
    // PASTIKAN ORDER PENYEWAAN
    // =========================
    if (rental.order_type !== "penyewaan") {
      throw new AppError("Pesanan ini bukan transaksi penyewaan", 400);
    }

    // =====================================================
    // PENTING:
    // CEGAH PENGEMBALIAN DIPROSES LEBIH DARI SATU KALI
    // =====================================================
    if (rental.order_status !== "paid") throw new AppError("Selesaikan pembayaran sebelum pengembalian",400);
    if (rental.status === "returned" || rental.returned_at) {
      throw new AppError("Barang pada pesanan ini sudah dikembalikan", 400);
    }

    // =========================
    // HITUNG KETERLAMBATAN
    // =========================
    const [[calc]] = await conn.query(
      `
      SELECT
        GREATEST(
          DATEDIFF(CURDATE(), ?),
          0
        ) AS late_days
      `,
      [rental.due_date],
    );

    const lateDays = Number(calc?.late_days || 0);

    const lateFeePerDay = Number(rental.late_fee_per_day || 0);

    const fine = lateDays * lateFeePerDay;

    // =========================
    // UPDATE RENTAL
    // =========================
    const [rentalUpdate] = await conn.query(
      `
      UPDATE rentals

      SET
        returned_at = NOW(),
        late_days = ?,
        fine_amount = ?,
        status = 'returned'

      WHERE id = ?
      AND tenant_id = ?
      AND returned_at IS NULL
      `,
      [lateDays, fine, rental.id, tid],
    );

    /*
      Proteksi tambahan.
      Jika affectedRows = 0 berarti kemungkinan
      rental sudah diproses.
    */
    if (!rentalUpdate.affectedRows) {
      throw new AppError("Pengembalian sudah pernah diproses", 400);
    }

    // =========================
    // UPDATE ORDER
    // =========================
    await conn.query(
      `
      UPDATE orders

      SET
        fine_total = ?,
        total = subtotal + ?,
        status = 'completed'

      WHERE id = ?
      AND tenant_id = ?
      `,
      [fine, fine, rental.order_id, tid],
    );

    // =========================
    // SIMPAN DENDA
    // =========================
    if (fine > 0) {
      await conn.query(
        `
        INSERT INTO transactions(
          tenant_id,
          order_id,
          type,
          category,
          description,
          amount,
          transaction_date
        )

        VALUES(
          ?,
          ?,
          'pemasukan',
          'denda',
          'Denda keterlambatan',
          ?,
          CURDATE()
        )
        `,
        [tid, rental.order_id, fine],
      );
    }

    // =========================
    // AMBIL BARANG YANG DISEWA
    // =========================
    const [items] = await conn.query(
      `
      SELECT
        product_id,
        quantity

      FROM order_items

      WHERE order_id = ?
      AND tenant_id = ?
      `,
      [rental.order_id, tid],
    );

    if (!items.length) {
      throw new AppError("Item pesanan tidak ditemukan", 404);
    }

    // =========================
    // KEMBALIKAN STOK
    // =========================
    for (const item of items) {
      const [stockResult] = await conn.query(
        `
        UPDATE products

        SET stock = stock + ?

        WHERE id = ?
        AND tenant_id = ?
        `,
        [Number(item.quantity), item.product_id, tid],
      );

      if (!stockResult.affectedRows) {
        throw new AppError(`Produk ID ${item.product_id} tidak ditemukan`, 404);
      }
    }

    // =========================
    // COMMIT
    // =========================
    await conn.commit();

    res.json({
      message: "Pengembalian berhasil dicatat",
      status: "returned",
      late_days: lateDays,
      fine,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
