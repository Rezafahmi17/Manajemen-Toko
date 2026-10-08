"use client";
import { useEffect, useState } from "react";
import { api, rupiah } from "@/lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
export default function Dashboard() {
  const [me, setMe] = useState(null),
    [s, setS] = useState(null);
  useEffect(() => {
    api("/auth/me")
      .then((m) => {
        setMe(m.user);
        return api(
          m.user.role === "super_admin" ? "/admin/stats" : "/finance/summary",
        );
      })
      .then(setS)
      .catch(() => {});
  }, []);
  if (!s) return <p>Memuat dashboard...</p>;
  const superA = me?.role === "super_admin";
  const data = s.monthly || [];
  return (
    <>
      <h1 className="text-3xl font-black text-[#0d0d0f]">Dashboard</h1>
      <p className="mb-6 text-[#2b1b1b]">Ringkasan aktivitas terbaru.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {(superA
          ? [
              ["Tenant", s.tenants],
              ["Pesanan", s.orders],
              ["Omzet", rupiah(s.revenue)],
            ]
          : [
              ["Pemasukan", rupiah(s.income)],
              ["Pengeluaran", rupiah(s.expense)],
              ["Saldo", rupiah(Number(s.income) - Number(s.expense))],
            ]
        ).map((x) => (
          <div className="card p-5" key={x[0]}>
            <p className="text-sm text-[#2b1b1b]">{x[0]}</p>
            <p className="mt-2 text-2xl font-black text-[#0d0d0f]">{x[1]}</p>
          </div>
        ))}
      </div>
      <div className="card mt-5 p-5">
        <h2 className="mb-4 font-bold text-[#0d0d0f]">Grafik bulanan</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="label" stroke="#2b1b1b" />
              <YAxis stroke="#2b1b1b" />
              <Tooltip cursor={{fill: '#ffffff'}} contentStyle={{backgroundColor: '#ffffff', borderColor: '#2b1b1b', color: '#fff'}} />
              <Bar
                dataKey={superA ? "total" : "income"}
                fill="#2b1b1b"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
