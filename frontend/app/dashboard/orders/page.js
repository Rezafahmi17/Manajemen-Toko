"use client";

import { useCallback, useEffect, useState } from "react";
import { api, rupiah } from "@/lib/api";

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // =========================
  // LOAD PESANAN
  // =========================
  const load = useCallback(async () => {
    try {
      setLoading(true);

      const x = await api("/orders/tenant");

      setRows(x.data || []);
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // =========================
  // TANDAI PEMBAYARAN LUNAS
  // =========================
  async function paid(id) {
    const yakin = window.confirm("Tandai pesanan ini sebagai sudah lunas?");

    if (!yakin) return;

    try {
      setErr("");
      setProcessingId(id);

      await api(`/orders/${id}/paid`, {
        method: "PATCH",
      });

      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setProcessingId(null);
    }
  }

  // =========================
  // PENGEMBALIAN BARANG SEWA
  // =========================
  async function ret(id) {
    const yakin = window.confirm("Catat pengembalian barang sewa ini?");

    if (!yakin) return;

    try {
      setErr("");
      setProcessingId(id);

      const x = await api(`/orders/${id}/return`, {
        method: "PATCH",
      });

      await load();

      alert(`Pengembalian berhasil dicatat.\nDenda: ${rupiah(x.fine || 0)}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-3xl font-black text-[#0d0d0f]">Pesanan</h1>

        <p className="mt-1 text-[#2b1b1b]">
          Konfirmasi pembayaran tunai/QRIS dan pengembalian barang sewa.
        </p>
      </div>

      {/* ERROR */}
      {err && (
        <div className="mb-4 rounded-xl border border-[#7f1d1d] bg-[#450a0a] p-3 text-sm text-[#fca5a5]">
          {err}
        </div>
      )}

      {/* TABLE */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Customer</th>
              <th>Tipe</th>
              <th>Total</th>
              <th>Pembayaran</th>
              <th>Status Sewa</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-[#2b1b1b]">
                  Memuat pesanan...
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((o) => {
                const sudahDikembalikan =
                  o.type === "penyewaan" &&
                  (o.rental_status === "returned" ||
                    o.status === "completed" ||
                    o.returned_at);

                return (
                  <tr key={o.id}>
                    {/* KODE */}
                    <td>
                      <span className="font-semibold text-[#0d0d0f]">{o.order_code}</span>
                    </td>

                    {/* CUSTOMER */}
                    <td>{o.customer_name || "-"}</td>

                    {/* TIPE */}
                    <td>
                      {o.type === "penyewaan" ? "Penyewaan" : "Penjualan"}
                    </td>

                    {/* TOTAL */}
                    <td><span className="text-[#2b1b1b] font-bold">{rupiah(o.total)}</span></td>

                    {/* STATUS PEMBAYARAN */}
                    <td>
                      {o.payment_status === "paid" ? (
                        <span className="inline-flex rounded-full bg-[#ffffff] border border-[#2b1b1b] px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-[#2b1b1b]">
                          Lunas
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#1a1200] border border-[#422006] px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-[#fbbf24]">
                          Belum Lunas
                        </span>
                      )}
                    </td>

                    {/* STATUS SEWA */}
                    <td>
                      {o.type !== "penyewaan" ? (
                        <span className="text-[#2b1b1b]">-</span>
                      ) : sudahDikembalikan ? (
                        <div>
                          <span className="inline-flex rounded-full bg-[#ffffff] border border-[#2b1b1b] px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-[#2b1b1b]">
                            ✓ Dikembalikan
                          </span>

                          {o.fine_amount > 0 && (
                            <p className="mt-1 text-xs text-[#ef4444]">
                              Denda {rupiah(o.fine_amount)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#fcfbf7] border border-[#1e3a8a] px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-[#60a5fa]">
                          Sedang Disewa
                        </span>
                      )}
                    </td>

                    {/* AKSI */}
                    <td>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* TANDAI LUNAS */}
                        {o.payment_status !== "paid" && (
                          <button
                            type="button"
                            disabled={processingId === o.id}
                            onClick={() => paid(o.id)}
                            className="font-medium text-[#2b1b1b] hover:text-[#0d0d0f] transition disabled:opacity-50"
                          >
                            {processingId === o.id
                              ? "Memproses..."
                              : "Tandai Lunas"}
                          </button>
                        )}

                        {/* KEMBALIKAN */}
                        {o.type === "penyewaan" && !sudahDikembalikan && (
                          <button
                            type="button"
                            disabled={processingId === o.id}
                            onClick={() => ret(o.id)}
                            className="font-medium text-[#60a5fa] hover:text-[#0d0d0f] transition disabled:opacity-50"
                          >
                            {processingId === o.id
                              ? "Memproses..."
                              : "Kembalikan"}
                          </button>
                        )}

                        {/* SUDAH DIKEMBALIKAN */}
                        {o.type === "penyewaan" && sudahDikembalikan && (
                          <span className="text-sm font-semibold text-[#2b1b1b]">
                            Selesai
                          </span>
                        )}

                        {/* PENJUALAN SUDAH LUNAS */}
                        {o.type === "penjualan" &&
                          o.payment_status === "paid" && (
                            <span className="text-sm font-semibold text-[#2b1b1b]">
                              Selesai
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-[#2b1b1b]">
                  Belum ada pesanan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
