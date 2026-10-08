"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, rupiah } from "@/lib/api";

export default function Receipt() {
  const { id } = useParams();

  const [o, setO] = useState(null);
  const [qr, setQr] = useState(null);
  const [err, setErr] = useState("");

  // ==========================================
  // LOAD DATA STRUK
  // ==========================================
  async function loadOrder() {
    try {
      const x = await api(`/orders/${id}`);

      setO(x.data);
      setErr("");

      return x.data;
    } catch (e) {
      setErr(e.message);
      return null;
    }
  }

  // ==========================================
  // LOAD PERTAMA KALI
  // ==========================================
  useEffect(() => {
    if (!id) return;

    async function initialLoad() {
      try {
        const data = await loadOrder();

        if (data && data.payment_method === "qris") {
          const q = await api(`/payments/${id}/qr`);
          setQr(q.data_url);
        }
      } catch (e) {
        setErr(e.message);
      }
    }

    initialLoad();
  }, [id]);

  // ==========================================
  // AUTO REFRESH STATUS SETIAP 2 DETIK
  // ==========================================
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const x = await api(`/orders/${id}`);

        setO((current) => {
          // Update hanya jika datanya berubah
          if (
            !current ||
            current.payment_status !== x.data.payment_status ||
            current.status !== x.data.status ||
            current.total !== x.data.total ||
            current.returned_at !== x.data.returned_at
          ) {
            return x.data;
          }

          return current;
        });
      } catch (e) {
        console.error("Gagal memperbarui status:", e);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [id]);

  // ==========================================
  // LOADING
  // ==========================================
  if (!o) {
    return <main className="p-8">{err || "Memuat struk..."}</main>;
  }

  return (
    <main className="mx-auto max-w-xl p-5">
      <div className="card p-7 print:border-0 print:shadow-none">
        <div className="text-center">
          <h1 className="text-2xl font-black">{o.tenant_name}</h1>

          <p className="text-sm text-slate-500">{o.address}</p>

          <p className="mt-4 font-mono">{o.order_code}</p>
        </div>

        <div className="my-6 border-y py-3">
          {o.items.map((i) => (
            <div key={i.id} className="flex justify-between py-1">
              <span>
                {i.product_name} ({i.transaction_type === "penyewaan" ? "Sewa" : "Jual"}) × {i.quantity}
                {i.rental_days ? ` × ${i.rental_days} hari` : ""}
              </span>

              <span>{rupiah(i.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-black">
          <span>Total</span>

          <span>{rupiah(o.total)}</span>
        </div>

        <p className="mt-2 text-sm">
          Pembayaran: {o.payment_method} — {o.payment_status}
        </p>

        {o.due_date && (
          <p className="mt-1 text-sm">
            Batas kembali: {String(o.due_date).slice(0, 10)}
          </p>
        )}

        {qr && (
          <div className="mt-6 text-center">
            <img src={qr} alt="QR pembayaran" className="mx-auto w-64" />

            <p className="mt-2 text-xs text-slate-500">
              QR ini simulasi, bukan QRIS pembayaran resmi. Konfirmasi pembayaran dilakukan admin toko.
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-2 print:hidden">
          <button onClick={() => window.print()} className="btn-primary flex-1">
            Cetak struk
          </button>

          <Link href="/dashboard/pos" className="btn-soft flex-1">
            Kembali
          </Link>
        </div>
      </div>
    </main>
  );
}
