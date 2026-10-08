-- Jalankan sekali setelah migration_existing.sql (bila database lama belum punya approval_status).
-- Backup database sebelum migrasi. Jangan import database.sql untuk data yang sudah ada.
ALTER TABLE tenants MODIFY COLUMN type ENUM('penjualan','penyewaan','campuran') NOT NULL DEFAULT 'campuran';
ALTER TABLE products ADD COLUMN transaction_type ENUM('penjualan','penyewaan','keduanya') NOT NULL DEFAULT 'keduanya' AFTER rental_price_per_day;
UPDATE products p JOIN tenants t ON t.id=p.tenant_id SET p.transaction_type=CASE WHEN t.type='penjualan' THEN 'penjualan' WHEN t.type='penyewaan' THEN 'penyewaan' ELSE 'keduanya' END;
ALTER TABLE order_items ADD COLUMN transaction_type ENUM('penjualan','penyewaan') NOT NULL DEFAULT 'penjualan' AFTER rental_days;
UPDATE order_items oi JOIN orders o ON o.id=oi.order_id SET oi.transaction_type=o.type;
UPDATE tenants SET type='campuran' WHERE type IN ('penjualan','penyewaan');
