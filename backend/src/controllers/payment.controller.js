import QRCode from "qrcode";
import { pool } from "../config/db.js";
import { AppError } from "../utils/http.js";
export async function qr(req, res) {
  const [[p]] = await pool.query(
    "SELECT p.*,o.user_id FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.order_id=?",
    [req.params.orderId],
  );
  if (!p) throw new AppError("Pembayaran tidak ditemukan", 404);
  if (req.user.role === "customer" && Number(p.user_id) !== Number(req.user.id))
    throw new AppError("Akses ditolak", 403);
  if (!p.qris_payload)
    throw new AppError("Pesanan tidak menggunakan QRIS", 400);
  const dataUrl = await QRCode.toDataURL(p.qris_payload, {
    width: 320,
    margin: 2,
  });
  res.json({
    data_url: dataUrl,
    payload: p.qris_payload,
    amount: p.amount,
    status: p.status,
  });
}
