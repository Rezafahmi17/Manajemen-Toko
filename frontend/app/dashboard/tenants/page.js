"use client";

import { useEffect, useState } from "react";
import { api, rupiah } from "@/lib/api";

export default function Tenants() {
  const empty = {
    name: "",
    type: "campuran",
    address: "",
    phone: "",
    late_fee_per_day: 0,
    admin_name: "",
    admin_email: "",
    admin_password: "",
  };

  const [f, setF] = useState(empty);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const load = () => {
    api("/admin/tenants")
      .then((x) => {
        setRows(x.data);
        setErr("");
      })
      .catch((e) => {
        setErr(e.message);
      });
  };

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();

    try {
      setErr("");

      await api("/admin/tenants", {
        method: "POST",
        body: JSON.stringify(f),
      });

      setF(empty);

      // Refresh daftar tenant setelah berhasil membuat tenant
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function review(id,decision){
    if(!window.confirm(decision==='approved'?'Setujui toko ini?':'Tolak pengajuan ini?'))return;
    try{await api(`/admin/tenants/${id}/review`,{method:'PATCH',body:JSON.stringify({decision})});load();}
    catch(e){setErr(e.message);}
  }
  return (
    <>
      <h1 className="text-3xl font-black text-[#0d0d0f]">Kelola Tenant</h1>

      <form onSubmit={save} className="card my-5 grid gap-3 p-5 md:grid-cols-2">
        {err && <p className="md:col-span-2 text-[#fca5a5]">{err}</p>}

        <input
          className="input"
          placeholder="Nama toko"
          value={f.name}
          onChange={(e) =>
            setF({
              ...f,
              name: e.target.value,
            })
          }
          required
        />

        <select
          className="input"
          value={f.type}
          onChange={(e) =>
            setF({
              ...f,
              type: e.target.value,
            })
          }
        >
          <option value="penjualan">Penjualan</option>

          <option value="penyewaan">Penyewaan</option><option value="campuran">Penjualan & Penyewaan</option>
        </select>

        <input
          className="input"
          placeholder="Alamat"
          value={f.address}
          onChange={(e) =>
            setF({
              ...f,
              address: e.target.value,
            })
          }
        />

        <input
          className="input"
          placeholder="Telepon"
          value={f.phone}
          onChange={(e) =>
            setF({
              ...f,
              phone: e.target.value,
            })
          }
        />

        <input
          className="input"
          type="number"
          min="0"
          placeholder="Denda / hari"
          value={f.late_fee_per_day}
          onChange={(e) =>
            setF({
              ...f,
              late_fee_per_day: Number(e.target.value),
            })
          }
        />

        <div />

        <input
          className="input"
          placeholder="Nama admin"
          value={f.admin_name}
          onChange={(e) =>
            setF({
              ...f,
              admin_name: e.target.value,
            })
          }
          required
        />

        <input
          className="input"
          type="email"
          placeholder="Email admin"
          value={f.admin_email}
          onChange={(e) =>
            setF({
              ...f,
              admin_email: e.target.value,
            })
          }
          required
        />

        <input
          className="input"
          type="password"
          minLength={8}
          placeholder="Password awal (min 8)"
          value={f.admin_password}
          onChange={(e) =>
            setF({
              ...f,
              admin_password: e.target.value,
            })
          }
          required
        />

        <button type="submit" className="btn-primary mt-2">
          Buat tenant + admin
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Toko</th><th>Status</th>
              <th>Tipe</th>
              <th>Produk</th>
              <th>Pesanan</th>
              <th>Omzet</th><th>Tindakan</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-[#2b1b1b]">
                  Belum ada tenant.
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id}>
                  <td className="text-[#0d0d0f] font-semibold">{t.name}</td><td><span className="badge">{t.approval_status === 'pending'?'Menunggu':t.approval_status === 'approved'?'Disetujui':'Ditolak'}</span></td>
                  <td>{t.type}</td>
                  <td>{t.products}</td>
                  <td>{t.orders}</td>
                  <td className="text-[#2b1b1b] font-bold">{rupiah(t.revenue)}</td><td>{t.approval_status==='pending'&&<div className="flex gap-2"><button onClick={()=>review(t.id,'approved')} className="btn-primary text-xs">Setujui</button><button onClick={()=>review(t.id,'rejected')} className="rounded-full border border-[#2b1b1b] px-4 py-1.5 font-semibold hover:bg-[#ffffff] text-[#2b1b1b] transition text-xs">Tolak</button></div>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
