import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Store,
  ShoppingBag,
  ReceiptText,
} from "lucide-react";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#fcfbf7] text-[#0d0d0f]">
      <header className="border-b border-[#2b1b1b]">
        <div className="shop-shell flex h-20 items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-black text-[#0d0d0f]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#000000] text-[#ffffff]">
              <ShoppingBag />
            </span>
            TokoHub
          </div>
          <div className="flex gap-2">
            <Link className="btn-soft" href="/login">
              Masuk
            </Link>
            <Link className="btn-primary" href="/stores">
              Lihat Toko
            </Link>
          </div>
        </div>
      </header>
      <section className="shop-shell py-8 md:py-12">
        <div className="hero-store grid items-center px-7 py-10 md:grid-cols-[1.05fr_.95fr] md:px-14">
          <div className="relative z-10">
            <span className="badge">Multi-Tenant Commerce Platform</span>
            <h1 className="section-title mt-5 max-w-2xl leading-[1.05]">
              Satu tempat untuk belanja, sewa, dan mengelola toko.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#2b1b1b] md:text-lg">
              TokoHub menyatukan etalase customer, transaksi, stok, pembayaran,
              struk, laporan keuangan dan dashboard tenant dalam pengalaman yang
              sederhana.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="btn-primary" href="/stores">
                Mulai Belanja <ArrowRight size={17} />
              </Link>
              <Link className="btn-outline" href="/daftar-toko">
                Daftarkan Toko
              </Link>
            </div>
          </div>
          <div className="relative z-10 mt-10 grid grid-cols-2 gap-3 md:mt-0">
            <div className="card p-5">
              <Store className="text-[#2b1b1b]" />
              <b className="mt-8 block text-lg text-[#0d0d0f]">Banyak Tenant</b>
              <p className="mt-1 text-sm text-[#2b1b1b]">
                Penjualan dan penyewaan.
              </p>
            </div>
            <div className="card translate-y-5 p-5">
              <BarChart3 className="text-[#2b1b1b]" />
              <b className="mt-8 block text-lg text-[#0d0d0f]">Laporan Real-time</b>
              <p className="mt-1 text-sm text-[#2b1b1b]">
                Pantau bisnis lebih mudah.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="shop-shell pb-12">
        <div className="feature-strip">
          {[
            [Store, "Multi Tenant", "Data toko terpisah"],
            [ShieldCheck, "Aman", "Akses sesuai role"],
            [ReceiptText, "Struk Digital", "Transaksi tercatat"],
            [BarChart3, "Insight", "Grafik & keuangan"],
          ].map(([I, a, b]) => (
            <div key={a}>
              <div className="icon-circle">
                <I className="text-[#2b1b1b]" size={20} />
              </div>
              <span>
                <b className="block text-[#0d0d0f] text-sm">{a}</b>
                <small className="text-[#2b1b1b]">{b}</small>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
