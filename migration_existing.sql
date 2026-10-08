-- Untuk database lama yang sudah berisi data; jalankan SEKALI via phpMyAdmin.
-- Jangan import database.sql ulang karena akan menghapus seluruh data.
ALTER TABLE tenants ADD COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' AFTER late_fee_per_day;
