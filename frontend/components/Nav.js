"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { LogOut, LayoutDashboard, Store, ShoppingBag } from "lucide-react";
export default function Nav() {
  const router = useRouter();
  async function out() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }
  return (
    <>

      <header className="sticky top-0 z-40 border-b border-[#2b1b1b] bg-[#e7e4e0]/95 backdrop-blur">
        <div className="shop-shell flex h-[74px] items-center justify-between gap-4">
          <Link
            href="/stores"
            className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#0d0d0f]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#000000] text-[#ffffff]">
              <ShoppingBag size={20} />
            </span>
            TokoHub
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link className="btn-soft !px-3 sm:!px-4" href="/stores">
              <Store size={17} />
              <span className="hidden sm:inline">Etalase</span>
            </Link>
            <Link className="btn-soft !px-3 sm:!px-4" href="/dashboard">
              <LayoutDashboard size={17} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button className="btn-soft !px-3 sm:!px-4" onClick={out}>
              <LogOut size={17} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </nav>
        </div>
      </header>
    </>
  );
}
