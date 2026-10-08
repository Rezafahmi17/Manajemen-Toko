# TokoHub – Satu Tenant, Penjualan + Penyewaan

## Instalasi database
- Instalasi baru: import `database.sql` melalui phpMyAdmin. **Peringatan: skrip ini menghapus tabel lama.**
- Database existing: backup dahulu. Bila belum menerapkan verifikasi tenant, jalankan `migration_existing.sql` terlebih dahulu; kemudian jalankan `migration_jual_sewa.sql` **masing-masing sekali**.
- Jangan impor `database.sql` untuk database yang sudah memiliki data.

## Alur
- Super admin memverifikasi pendaftaran tenant; satu toko dapat melakukan kedua jenis transaksi.
- Tenant admin mengatur jenis produk (Hanya dijual / Hanya disewakan / Keduanya).
- POS memiliki mode Penjualan dan Penyewaan. Setiap checkout hanya satu jenis transaksi agar jatuh tempo dan proses pengembalian jelas. Berpindah mode mengosongkan keranjang.
- Checkout mengecek jenis transaksi dan stok di server serta menggunakan transaksi database dan kunci baris untuk mencegah stok negatif pada transaksi simultan.
- Penjualan mengurangi stok permanen; penyewaan mengurangi stok tersedia sampai seluruh barang dalam satu struk dikembalikan dan dicatat. Durasi sewa maksimal 365 hari.
- Tunai ditandai lunas oleh POS; QRIS adalah **simulasi, bukan integrasi payment gateway**, harus dikonfirmasi manual. Transaksi pemasukan tercatat ketika pembayaran ditandai lunas.
- Struk menampilkan item dan jenisnya; pengeluaran dicatat melalui menu keuangan. Denda keterlambatan tercatat setelah pengembalian.

## Batasan saat ini
- Satu struk sewa memakai tanggal jatuh tempo terlama dari item; semua barang dalam struk tersebut harus dikembalikan bersamaan.
- Tidak tersedia checkout campuran jual+sewa di satu struk; lakukan dua checkout.
- Alur customer storefront lama belum sepenuhnya dialihkan ke model POS baru. Gunakan POS admin tenant sebagai alur utama.
- Pengujian integrasi dengan MySQL nyata tetap diperlukan sebelum produksi.
