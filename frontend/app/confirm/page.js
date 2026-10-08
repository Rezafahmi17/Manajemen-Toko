"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
export default function Confirm() {
  const r = useRouter();
  async function go() {
    await api("/auth/confirm", { method: "POST" });
    r.push("/dashboard");
    r.refresh();
  }
  return (
    <main className="grid min-h-screen place-items-center p-4 bg-[#fcfbf7]">
      <div className="card max-w-lg p-8 text-center">
        <h1 className="text-2xl font-black text-[#0d0d0f]">Konfirmasi akun baru</h1>
        <p className="my-4 text-[#2b1b1b]">
          Akun admin toko Anda berhasil dibuat oleh Super Admin. Konfirmasikan
          akun ini sebelum masuk dashboard.
        </p>
        <button onClick={go} className="btn-primary">
          Konfirmasi & lanjut
        </button>
      </div>
    </main>
  );
}
