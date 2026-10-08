import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as application from "../controllers/application.controller.js";
import * as authC from "../controllers/auth.controller.js";
import * as admin from "../controllers/admin.controller.js";
import * as prod from "../controllers/product.controller.js";
import * as store from "../controllers/store.controller.js";
import * as order from "../controllers/order.controller.js";
import * as fin from "../controllers/finance.controller.js";
import * as pay from "../controllers/payment.controller.js";

import { auth, allow } from "../middleware/auth.js";
import { uploadProduct } from "../middleware/upload.js";
import { asyncHandler } from "../utils/http.js";

const r = Router();

/* =========================================================
   RATE LIMIT LOGIN
========================================================= */

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak percobaan login. Coba lagi nanti.",
  },
});

/* =========================================================
   HEALTH CHECK
========================================================= */

r.get("/health", (req, res) => {
  res.json({
    ok: true,
  });
});

/* =========================================================
   AUTH
========================================================= */

r.post("/auth/login", loginLimit, asyncHandler(authC.login));

r.post("/auth/register", asyncHandler(authC.register));
r.post("/tenant-applications", loginLimit, asyncHandler(application.apply));
r.patch("/admin/tenants/:id/review", auth, allow("super_admin"), asyncHandler(application.review));

r.post("/auth/logout", authC.logout);

r.get("/auth/me", auth, asyncHandler(authC.me));

r.post("/auth/confirm", auth, asyncHandler(authC.confirm));

/* =========================================================
   PUBLIC STORE
========================================================= */

r.get("/stores", asyncHandler(store.tenants));

r.get("/stores/:id", asyncHandler(store.tenant));

r.get("/stores/:tenantId/products", asyncHandler(prod.publicProducts));

/* =========================================================
   SUPER ADMIN
========================================================= */

r.get(
  "/admin/tenants",
  auth,
  allow("super_admin"),
  asyncHandler(admin.listTenants),
);

r.post(
  "/admin/tenants",
  auth,
  allow("super_admin"),
  asyncHandler(admin.createTenant),
);

r.get("/admin/stats", auth, allow("super_admin"), asyncHandler(admin.stats));

/* =========================================================
   PRODUCTS
========================================================= */

// Ambil seluruh produk milik tenant
r.get(
  "/products",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(prod.list),
);

// Tambah produk + upload foto
r.post(
  "/products",
  auth,
  allow("tenant_admin", "super_admin"),

  // Nama field foto dari frontend harus "image"
  uploadProduct.single("image"),

  asyncHandler(prod.create),
);

// Edit produk + bisa mengganti foto
r.put(
  "/products/:id",
  auth,
  allow("tenant_admin", "super_admin"),

  // Foto baru bersifat opsional
  uploadProduct.single("image"),

  asyncHandler(prod.update),
);

// Hapus produk
r.delete(
  "/products/:id",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(prod.remove),
);

/* =========================================================
   ORDERS
========================================================= */

// Customer melakukan checkout
r.post(
  "/orders/checkout",
  auth,
  allow("customer", "tenant_admin"),
  asyncHandler(order.checkout),
);

// Pesanan customer
r.get("/orders/my", auth, allow("customer"), asyncHandler(order.myOrders));

// Pesanan yang masuk ke tenant
r.get(
  "/orders/tenant",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(order.tenantOrders),
);

// Detail pesanan
r.get("/orders/:id", auth, asyncHandler(order.detail));

// Konfirmasi pembayaran
r.patch(
  "/orders/:id/paid",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(order.markPaid),
);

// Pengembalian barang sewa
r.patch(
  "/orders/:id/return",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(order.returnRental),
);

/* =========================================================
   PAYMENT
========================================================= */

r.get("/payments/:orderId/qr", auth, asyncHandler(pay.qr));

/* =========================================================
   FINANCE
========================================================= */

// Daftar transaksi keuangan
r.get(
  "/finance",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(fin.list),
);

// Tambah pemasukan / pengeluaran
r.post(
  "/finance",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(fin.create),
);

// Ringkasan keuangan
r.get(
  "/finance/summary",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(fin.summary),
);

// Export Excel
r.get(
  "/finance/export",
  auth,
  allow("tenant_admin", "super_admin"),
  asyncHandler(fin.excel),
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

export default r;
