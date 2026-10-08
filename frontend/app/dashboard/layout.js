"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";

export default function Layout({ children }) {
  const [u, setU] = useState(null);
  const [newOrders, setNewOrders] = useState(0);

  const router = useRouter();

  // ================================
  // CEK LOGIN
  // ================================
  useEffect(() => {
    api("/auth/me")
      .then((x) => {
        if (x.user.role === "customer") {
          router.replace("/stores");
          return;
        }

        if (x.user.must_confirm) {
          router.replace("/confirm");
          return;
        }

        setU(x.user);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  // ================================
  // CEK PESANAN BARU
  // ================================
  useEffect(() => {
    if (!u) return;

    // Notifikasi pesanan hanya diperlukan
    // untuk admin toko
    if (u.role !== "tenant_admin") return;

    const loadNotification = async () => {
      try {
        const response = await api("/orders/tenant");

        const orders = response.data || [];

        // Untuk tahap ini:
        // pesanan yang belum lunas dianggap
        // membutuhkan perhatian admin.
        const count = orders.filter(
          (order) => order.payment_status !== "paid",
        ).length;

        setNewOrders(count);
      } catch (error) {
        console.error("Gagal mengambil notifikasi pesanan:", error);
      }
    };

    // Langsung cek ketika dashboard dibuka
    loadNotification();

    // Cek ulang setiap 10 detik
    const interval = setInterval(loadNotification, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [u]);

  // ================================
  // LOADING SESSION
  // ================================
  if (!u) {
    return <main className="p-8">Memeriksa sesi...</main>;
  }

  return (
    <>
      <Nav />

      <main className="mx-auto grid max-w-7xl gap-5 p-5 md:grid-cols-[220px_1fr]">
        <Sidebar role={u.role} newOrders={newOrders} />

        <section>{children}</section>
      </main>
    </>
  );
}
