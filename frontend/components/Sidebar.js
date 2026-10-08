"use client";

import Link from "next/link";

import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Wallet,
  CircleUserRound,
  Store,
  ShoppingCart,
} from "lucide-react";

export default function Sidebar({ role, newOrders = 0 }) {
  const tenant = [
    ["/dashboard/pos", "Kasir / POS", ShoppingCart],
    ["/dashboard", "Dashboard", LayoutDashboard],
    ["/dashboard/products", "Barang", Package],
    ["/dashboard/orders", "Pesanan", ReceiptText],
    ["/dashboard/finance", "Keuangan", Wallet],
  ];

  const superItems = [
    ["/dashboard", "Dashboard", LayoutDashboard],

    ["/dashboard/tenants", "Tenant", Store],
  ];

  const items = role === "super_admin" ? superItems : tenant;

  return (
    <aside className="card h-fit p-3 md:sticky md:top-20">
      {/* USER */}

      <div className="mb-3 flex items-center gap-2 px-2 py-2 font-bold">
        <CircleUserRound size={20} />

        {role === "super_admin" ? "Super Admin" : "Admin Toko"}
      </div>

      {/* MENU */}

      <div className="flex gap-2 overflow-x-auto md:flex-col">
        {items.map(([href, label, Icon]) => {
          const isOrder = href === "/dashboard/orders";

          return (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2 transition hover:bg-[#072720] hover:text-[#36f4a4]"
            >
              {/* KIRI */}

              <div className="flex items-center gap-2">
                <Icon size={18} />

                <span>{label}</span>
              </div>

              {/* BADGE NOTIFIKASI */}

              {isOrder && newOrders > 0 && (
                <span className="ml-3 flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {newOrders > 99 ? "99+" : newOrders}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
