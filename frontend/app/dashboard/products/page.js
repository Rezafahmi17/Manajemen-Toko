"use client";

import { useEffect, useRef, useState } from "react";
import { api, rupiah } from "@/lib/api";
import { ImagePlus, Package, Pencil, Trash2, X, Upload } from "lucide-react";

export default function Products() {
  const blank = {
    name: "",
    description: "",
    sku: "",
    price: 0,
    rental_price_per_day: 0,
    transaction_type: "keduanya",
    stock: 0,
    image_url: "",
    is_active: true,
  };

  const [f, setF] = useState(blank);
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  // ==========================================
  // LOAD PRODUK
  // ==========================================

  function load() {
    setLoading(true);

    api("/products")
      .then((x) => {
        setRows(x.data || []);
        setErr("");
      })
      .catch((e) => {
        setErr(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  // ==========================================
  // PILIH FOTO
  // ==========================================

  function handleImage(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErr("Foto harus berformat JPG, PNG, atau WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErr("Ukuran foto maksimal 5 MB.");
      e.target.value = "";
      return;
    }

    setErr("");
    setImage(file);

    const objectUrl = URL.createObjectURL(file);

    setPreview((oldPreview) => {
      if (oldPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(oldPreview);
      }

      return objectUrl;
    });
  }

  // ==========================================
  // HAPUS FOTO YANG DIPILIH
  // ==========================================

  function removeSelectedImage() {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);

    // Saat edit, tampilkan kembali foto lama
    setPreview(edit ? f.image_url || "" : "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // ==========================================
  // SIMPAN PRODUK
  // ==========================================

  async function save(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setErr("");
      setSuccess("");

      const formData = new FormData();

      formData.append("name", f.name);
      formData.append("description", f.description || "");
      formData.append("sku", f.sku || "");

      formData.append("price", String(Number(f.price || 0)));

      formData.append(
        "rental_price_per_day",
        String(Number(f.rental_price_per_day || 0)),
      );

      formData.append("transaction_type", f.transaction_type);
      formData.append("stock", String(Number(f.stock || 0)));

      formData.append("is_active", f.is_active ? "true" : "false");

      if (image) {
        formData.append("image", image);
      }

      await api(edit ? `/products/${edit}` : "/products", {
        method: edit ? "PUT" : "POST",
        body: formData,
      });

      setSuccess(
        edit ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.",
      );

      resetForm();
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // EDIT PRODUK
  // ==========================================

  function choose(p) {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setEdit(p.id);

    setF({
      name: p.name || "",
      description: p.description || "",
      sku: p.sku || "",
      price: Number(p.price || 0),
      rental_price_per_day: Number(p.rental_price_per_day || 0),
      transaction_type: p.transaction_type || "keduanya",
      stock: Number(p.stock || 0),
      image_url: p.image_url || "",
      is_active: Boolean(p.is_active),
    });

    setImage(null);
    setPreview(p.image_url || "");
    setErr("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================
  // RESET FORM
  // ==========================================

  function resetForm() {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setF(blank);
    setEdit(null);
    setImage(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function cancelEdit() {
    resetForm();
    setErr("");
    setSuccess("");
  }

  // ==========================================
  // HAPUS PRODUK
  // ==========================================

  async function del(id) {
    const yakin = window.confirm("Apakah yakin ingin menghapus produk?");

    if (!yakin) return;

    try {
      setErr("");
      setSuccess("");

      await api(`/products/${id}`, {
        method: "DELETE",
      });

      if (edit === id) {
        resetForm();
      }

      setSuccess("Produk berhasil dihapus.");

      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  // ==========================================
  // TAMPILAN
  // ==========================================

  return (
    <>
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-black text-[#0d0d0f]">Barang / Produk</h1>

        <p className="mt-1 text-sm text-[#2b1b1b]">
          Kelola barang penjualan atau penyewaan toko.
        </p>
      </div>

      {/* FORM */}

      <form onSubmit={save} className="card my-5 grid gap-4 p-5 md:grid-cols-2">
        {/* ERROR */}

        {err && (
          <div className="md:col-span-2 rounded-[4px] border border-[#7f1d1d] bg-[#450a0a] p-3 text-sm text-[#fca5a5]">
            {err}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="md:col-span-2 rounded-[4px] border border-[#064e3b] bg-[#022c22] p-3 text-sm text-[#2b1b1b]">
            {success}
          </div>
        )}

        {/* NAMA */}

        <div>
          <label className="label">
            Nama Barang
          </label>

          <input
            className="input w-full"
            placeholder="Contoh: Senar Pancing"
            value={f.name}
            onChange={(e) =>
              setF({
                ...f,
                name: e.target.value,
              })
            }
            required
          />
        </div>

        {/* SKU */}

        <div>
          <label className="label">SKU</label>

          <input
            className="input w-full"
            placeholder="Contoh: SNR-001"
            value={f.sku}
            onChange={(e) =>
              setF({
                ...f,
                sku: e.target.value,
              })
            }
          />
        </div>

        <div><label className="label">Jenis Transaksi Produk</label>
          <select className="input w-full" value={f.transaction_type} onChange={e=>setF({...f,transaction_type:e.target.value})}>
            <option value="penjualan">Hanya dijual</option><option value="penyewaan">Hanya disewakan</option><option value="keduanya">Dijual dan disewakan</option>
          </select></div>
        {/* HARGA JUAL */}

        <div>
          <label className="label">Harga Jual</label>

          <input
            className="input w-full"
            type="number"
            min="0"
            step="1"
            placeholder="Harga jual"
            value={f.price}
            onChange={(e) =>
              setF({
                ...f,
                price: e.target.value,
              })
            }
          />
        </div>

        {/* HARGA SEWA */}

        <div>
          <label className="label">
            Harga Sewa / Hari
          </label>

          <input
            className="input w-full"
            type="number"
            min="0"
            step="1"
            placeholder="Harga sewa per hari"
            value={f.rental_price_per_day}
            onChange={(e) =>
              setF({
                ...f,
                rental_price_per_day: e.target.value,
              })
            }
          />
        </div>

        {/* STOK */}

        <div>
          <label className="label">Stok</label>

          <input
            className="input w-full"
            type="number"
            min="0"
            step="1"
            placeholder="Jumlah stok"
            value={f.stock}
            onChange={(e) =>
              setF({
                ...f,
                stock: e.target.value,
              })
            }
            required
          />
        </div>

        {/* UPLOAD FOTO */}

        <div>
          <label className="label">
            Foto Produk
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImage}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-dashed border-[#2b1b1b] bg-[#fcfbf7] px-4 py-3 text-sm font-semibold transition hover:border-[#2b1b1b] text-[#2b1b1b] hover:text-[#0d0d0f]"
          >
            <Upload size={18} />

            {image
              ? "Ganti Foto"
              : edit && f.image_url
                ? "Ganti Foto Produk"
                : "Pilih Foto"}
          </button>

          <p className="mt-2 text-[11px] text-[#2b1b1b] uppercase tracking-wider">
            JPG, PNG, atau WEBP • Maksimal 5 MB
          </p>
        </div>

        {/* PREVIEW FOTO */}

        {preview && (
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-semibold text-[#0d0d0f]">Preview Foto</p>

            <div className="relative w-fit">
              <img
                src={preview}
                alt="Preview produk"
                className="h-48 w-48 rounded-lg border border-[#2b1b1b] bg-[#fcfbf7] object-cover"
              />

              <button
                type="button"
                onClick={removeSelectedImage}
                className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[#2b1b1b] text-[#2b1b1b] shadow transition hover:bg-[#ffffff] hover:text-[#2b1b1b]"
                title="Batalkan foto"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* DESKRIPSI */}

        <div className="md:col-span-2">
          <label className="label">
            Deskripsi Barang
          </label>

          <textarea
            className="input min-h-28 w-full"
            placeholder="Masukkan deskripsi barang..."
            value={f.description}
            onChange={(e) =>
              setF({
                ...f,
                description: e.target.value,
              })
            }
            rows={4}
          />
        </div>

        {/* BUTTON */}

        <div className="flex flex-wrap gap-2 md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <ImagePlus size={18} />

            {saving
              ? "Menyimpan..."
              : edit
                ? "Simpan Perubahan"
                : "Tambah Barang"}
          </button>

          {edit && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-[#2b1b1b] px-6 py-2 font-semibold hover:bg-[#ffffff] text-[#2b1b1b] transition"
            >
              Batal Edit
            </button>
          )}
        </div>
      </form>

      {/* TABEL PRODUK */}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Harga</th>
              <th>Sewa / Hari</th>
              <th>Stok</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[#2b1b1b]">
                  Memuat produk...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[#2b1b1b]">
                  <Package size={30} className="mx-auto mb-2 text-[#2b1b1b]" />
                  Belum ada barang / produk.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  {/* PRODUK */}

                  <td>
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-12 w-12 rounded-lg border border-[#2b1b1b] object-cover bg-[#fcfbf7]"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#fcfbf7] text-[#2b1b1b] border border-[#2b1b1b]">
                          <Package size={20} />
                        </div>
                      )}

                      <div>
                        <div className="font-semibold text-[#0d0d0f]">{p.name}</div>

                        {p.sku && (
                          <div className="text-xs text-[#2b1b1b] mt-0.5">
                            SKU: {p.sku}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* HARGA */}

                  <td><span className="font-semibold text-[#2b1b1b]">{rupiah(p.price)}</span></td>

                  {/* SEWA */}

                  <td><span className="font-semibold text-[#2b1b1b]">{rupiah(p.rental_price_per_day)}</span></td>

                  {/* STOK */}

                  <td><span className="text-[#0d0d0f] font-medium">{p.stock}</span></td>

                  {/* AKSI */}

                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => choose(p)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-[#ffffff] text-[#2b1b1b] hover:text-[#2b1b1b] transition"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => del(p.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition"
                      >
                        <Trash2 size={15} />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
