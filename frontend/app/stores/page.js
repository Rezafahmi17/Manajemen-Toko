"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { api } from "@/lib/api";
import {
  ArrowRight,
  MapPin,
  Search,
  Store as StoreIcon,
  PackageCheck,
} from "lucide-react";
export default function Stores() {
  const [rows, setRows] = useState(null),
    [err, setErr] = useState(""),
    [q, setQ] = useState("");
  useEffect(() => {
    api("/stores")
      .then((x) => setRows(x.data))
      .catch((e) => setErr(e.message));
  }, []);
  const filtered = (rows || []).filter((t) =>
    t.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <Nav />
      <main>
        <section className="shop-shell py-7">
          <div className="hero-store flex items-center px-7 py-10 md:px-12">
            <div className="relative z-10 max-w-2xl">
              <span className="badge">Marketplace TokoHub</span>
              <h1 className="section-title mt-4">
                Temukan toko untuk kebutuhanmu.
              </h1>
              <p className="mt-4 max-w-xl leading-7 text-[#2b1b1b]">
                Pilih tenant penjualan atau penyewaan, lihat produk yang
                tersedia, masukkan ke keranjang dan checkout dari satu tempat.
              </p>
              <div className="relative mt-7 max-w-xl">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2b1b1b]"
                  size={19}
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="input !rounded-full !py-3.5 !pl-11"
                  placeholder="Cari nama toko..."
                />
              </div>
            </div>
          </div>
        </section>
        <section className="shop-shell pb-12">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="label text-[#2b1b1b]">
                Pilihan tenant
              </p>
              <h2 className="section-title mt-1" style={{fontSize: 'clamp(1.5rem, 3vw, 2.5rem)'}}>Semua Toko</h2>
            </div>
            <span className="text-sm text-[#2b1b1b]">
              {filtered.length} toko
            </span>
          </div>
          {err && <div className="card p-5 text-[#ef4444]">{err}</div>}
          {rows === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((x) => (
                <div
                  key={x}
                  className="h-48 animate-pulse rounded-2xl bg-[#ffffff]"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-raised p-10 text-center">
              <StoreIcon className="mx-auto text-[#2b1b1b]" size={42} />
              <b className="mt-3 block text-[#0d0d0f]">Toko tidak ditemukan</b>
              <p className="mt-1 text-sm text-[#2b1b1b]">
                Coba kata pencarian yang berbeda.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <Link
                  href={`/stores/${t.id}`}
                  key={t.id}
                  className="product-card group p-5"
                >
                  <div className="flex items-start justify-between">
                    <span className="icon-circle text-[#2b1b1b]">
                      <StoreIcon size={21} />
                    </span>
                    <span className="badge">{t.type}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-bold text-[#0d0d0f]">
                    {t.name}
                  </h3>
                  <p className="mt-2 flex min-h-10 gap-2 text-sm text-[#2b1b1b]">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    {t.address || "Alamat belum diisi"}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-[#2b1b1b] pt-4 text-sm font-semibold text-[#2b1b1b]">
                    <span className="flex items-center gap-2">
                      <PackageCheck size={17} />
                      Lihat etalase
                    </span>
                    <ArrowRight
                      size={18}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
