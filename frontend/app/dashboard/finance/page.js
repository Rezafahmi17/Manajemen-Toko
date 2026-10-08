"use client";
import { useEffect, useState } from "react";
import { API, api, rupiah } from "@/lib/api";
export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]),
    [f, setF] = useState({
      type: "pengeluaran",
      category: "",
      description: "",
      amount: "",
      transaction_date: new Date().toISOString().slice(0, 10),
    });
  const load = () => Promise.all([api("/finance"),api("/finance/summary")]).then(([a,b]) => {setRows(a.data);setSummary(b);});
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    await api("/finance", { method: "POST", body: JSON.stringify(f) });
    setF({ ...f, category: "", description: "", amount: "" });
    load();
  }
  async function download() {
    const r = await fetch(`${API}/finance/export`, { credentials: "include" });
    if (!r.ok) return alert("Export gagal");
    const b = await r.blob();
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = "laporan-keuangan.xlsx";
    a.click();
    URL.revokeObjectURL(u);
  }
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0d0d0f]">Keuangan</h1>
          <p className="mt-1 text-[#2b1b1b]">Catat dan unduh laporan transaksi keuangan Anda.</p>
        </div>
        <button className="btn-primary" onClick={download}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Excel
        </button>
      </div>
      {summary && <div className="grid gap-3 sm:grid-cols-3 mt-5">{[['Pemasukan',summary.income],['Pengeluaran',summary.expense],['Saldo',Number(summary.income)-Number(summary.expense)]].map(([label,v])=><div key={label} className="card p-4"><p className="text-sm text-[#2b1b1b]">{label}</p><b className="text-xl text-[#2b1b1b]">{rupiah(v)}</b></div>)}</div>}
      {summary?.by_category?.length>0 && <div className="card mt-4 p-4"><h2 className="font-bold mb-3 text-[#0d0d0f]">Rincian berdasarkan kategori (termasuk penjualan, penyewaan, denda)</h2><div className="grid sm:grid-cols-2 gap-4">{summary.by_category.map((x,i)=><div className="flex justify-between border-b border-[#2b1b1b] py-2 text-sm text-[#2b1b1b]" key={i}><span>{x.type} — {x.category}</span><b className="text-[#0d0d0f]">{rupiah(x.amount)}</b></div>)}</div></div>}
      <form onSubmit={save} className="card my-5 grid gap-3 p-5 md:grid-cols-2">
        <select
          className="input"
          value={f.type}
          onChange={(e) => setF({ ...f, type: e.target.value })}
        >
          <option value="pemasukan">Pemasukan</option>
          <option value="pengeluaran">Pengeluaran</option>
        </select>
        <input
          className="input"
          placeholder="Kategori"
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Keterangan"
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />
        <input
          className="input"
          type="number"
          min="1"
          placeholder="Nominal"
          value={f.amount}
          onChange={(e) => setF({ ...f, amount: e.target.value })}
          required
        />
        <input
          className="input"
          type="date"
          value={f.transaction_date}
          onChange={(e) => setF({ ...f, transaction_date: e.target.value })}
        />
        <button className="btn-primary">Catat transaksi</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Keterangan</th>
              <th>Nominal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>{String(x.transaction_date).slice(0, 10)}</td>
                <td>{x.type}</td>
                <td>{x.category}</td>
                <td>{x.description}</td>
                <td>{rupiah(x.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
