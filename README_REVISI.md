# TokoHub — Revisi Kasir Multi-Tenant

## Perubahan
- Tenant mengajukan toko di `/daftar-toko`, status `pending` dan belum bisa login.
- Super admin masuk ke `/dashboard/tenants`, menekan **Setujui** atau **Tolak**.
- Tenant yang disetujui login dan kelola produk di `/dashboard/products`.
- Admin toko mengoperasikan **Kasir/POS** `/dashboard/pos`: pilih produk, jumlah dan lama sewa (bila tipe penyewaan), checkout, struk dan cetak.
- Pembayaran tunai langsung dikonfirmasi saat checkout. QRIS tetap *pending* sampai admin memverifikasi pembayaran melalui menu **Pesanan**.
- Riwayat pemasukan dicatat otomatis saat konfirmasi lunas; pengeluaran ditambah secara manual di halaman Keuangan. Dashboard menampilkan ringkasannya.
- Produk yang dihapus disembunyikan dari penjualan sehingga riwayat transaksi tidak rusak.

## Menjalankan dari VS Code (Windows + XAMPP)
1. Ekstrak ZIP. Buka folder `revisi` di VS Code.
2. Nyalakan **MySQL** XAMPP. Untuk instalasi pertama saja, impor `database.sql` di phpMyAdmin. **PERINGATAN: `database.sql` menghapus seluruh tabel lama.**
3. Jika database **sudah berisi data**, jangan impor ulang `database.sql`; cukup impor `migration_existing.sql` sekali.
4. Salin `backend/.env.example` menjadi `backend/.env`. Isi akses MySQL, `JWT_SECRET` yang panjang/acak dan `FRONTEND_URL=http://localhost:3000`.
5. Terminal pertama: `cd backend`, `npm install`, `npm run seed:superadmin`, `npm run dev`.
6. Terminal kedua: `cd frontend`, `npm install`, `npm run dev`.
7. Buka `http://localhost:3000` lalu login menggunakan akun super admin dari skrip seed. Konfigurasi kredensial ada di file env / skrip seed (jangan gunakan password contoh di produksi).
8. Tautan UI: `/daftar-toko`, `/login`, `/dashboard/tenants`, `/dashboard/pos`, `/dashboard/products`, `/dashboard/orders`, `/dashboard/finance`.

## Ketentuan penting
- Dalam revisi ini, **satu toko punya satu jenis usaha**: penjualan atau penyewaan. Jika ingin menjual *dan* menyewakan produk dalam toko yang sama, diperlukan pengembangan mode per-item berikutnya.
- Pembayaran QRIS dan QR yang ditampilkan adalah **demo/simulasi**, belum menggunakan payment gateway terverifikasi. Jangan memperlakukan QR simulasi sebagai pembayaran sungguhan.
- Tidak ada data produk dummy otomatis; tambah produk dari menu Barang.
- `node_modules`, hasil build, dan file `.env` asli **tidak disertakan** dalam ZIP. Gunakan `npm install` untuk memasang dependensi.
- Belum dilakukan pengujian end-to-end dengan server MySQL hidup; sebelum produksi, lakukan uji registrasi, persetujuan, checkout tunai/sewa, retur, laporan, dan pembatasan akses per tenant.
