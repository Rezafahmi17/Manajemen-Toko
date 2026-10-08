
CREATE DATABASE IF NOT EXISTS tokohub_baru
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE tokohub_baru;

-- ==========================================
-- TOKOHUB MULTI-TENANT
-- PENJUALAN DAN PENYEWAAN
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS rentals;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. TENANTS
-- ==========================================

CREATE TABLE tenants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL UNIQUE,
    type ENUM(
        'penjualan',
        'penyewaan',
        'campuran'
    ) NOT NULL DEFAULT 'campuran',
    address TEXT NULL,
    phone VARCHAR(30) NULL,
    qris_label VARCHAR(120) NULL,
    late_fee_per_day DECIMAL(14,2) NOT NULL DEFAULT 0,
    approval_status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'approved',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==========================================
-- 2. USERS
-- ==========================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'super_admin',
        'tenant_admin',
        'customer'
    ) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    must_confirm TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE SET NULL,

    INDEX idx_users_tenant (tenant_id)
) ENGINE=InnoDB;

-- ==========================================
-- 3. PRODUCTS
-- ==========================================

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    sku VARCHAR(80) NULL,
    price DECIMAL(14,2) NOT NULL DEFAULT 0,
    rental_price_per_day DECIMAL(14,2) NULL,
    transaction_type ENUM(
        'penjualan',
        'penyewaan',
        'keduanya'
    ) NOT NULL DEFAULT 'keduanya',
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_tenant_sku (tenant_id, sku),
    INDEX idx_products_tenant (tenant_id)
) ENGINE=InnoDB;

-- ==========================================
-- 4. CARTS
-- ==========================================

CREATE TABLE carts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    status ENUM(
        'active',
        'checked_out',
        'abandoned'
    ) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_cart_scope (
        tenant_id,
        user_id,
        status
    )
) ENGINE=InnoDB;

-- ==========================================
-- 5. CART ITEMS
-- ==========================================

CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    cart_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    rental_days INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_cart_product (
        cart_id,
        product_id
    )
) ENGINE=InnoDB;

-- ==========================================
-- 6. ORDERS
-- ==========================================

CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM(
        'penjualan',
        'penyewaan',
        'campuran'
    ) NOT NULL DEFAULT 'campuran',
    status ENUM(
        'pending',
        'paid',
        'processing',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(14,2) NOT NULL,
    fine_total DECIMAL(14,2) NOT NULL DEFAULT 0,
    total DECIMAL(14,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    INDEX idx_orders_tenant (tenant_id),
    INDEX idx_orders_user (user_id)
) ENGINE=InnoDB;

-- ==========================================
-- 7. ORDER ITEMS
-- ==========================================

CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(14,2) NOT NULL,
    rental_days INT NULL,
    transaction_type ENUM(
        'penjualan',
        'penyewaan'
    ) NOT NULL DEFAULT 'penjualan',
    line_total DECIMAL(14,2) NOT NULL,

    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==========================================
-- 8. RENTALS
-- ==========================================

CREATE TABLE rentals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL UNIQUE,
    rent_date DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_at DATETIME NULL,
    late_days INT NOT NULL DEFAULT 0,
    late_fee_per_day DECIMAL(14,2) NOT NULL DEFAULT 0,
    fine_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    status ENUM(
        'active',
        'returned',
        'late'
    ) NOT NULL DEFAULT 'active',

    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================
-- 9. PAYMENTS
-- ==========================================

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    method ENUM(
        'tunai',
        'qris'
    ) NOT NULL,
    status ENUM(
        'pending',
        'paid',
        'failed',
        'expired'
    ) NOT NULL DEFAULT 'pending',
    amount DECIMAL(14,2) NOT NULL,
    qris_payload TEXT NULL,
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    INDEX idx_pay_tenant (tenant_id)
) ENGINE=InnoDB;

-- ==========================================
-- 10. TRANSACTIONS / KEUANGAN
-- ==========================================

CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    type ENUM(
        'pemasukan',
        'pengeluaran'
    ) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    amount DECIMAL(14,2) NOT NULL,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL,

    INDEX idx_transactions_tenant_date (
        tenant_id,
        transaction_date
    )
) ENGINE=InnoDB;

-- ==========================================
-- 11. RECEIPTS / STRUK
-- ==========================================

CREATE TABLE receipts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL UNIQUE,
    receipt_no VARCHAR(60) NOT NULL UNIQUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================
-- VERIFIKASI DATABASE
-- ==========================================

SHOW TABLES;

SELECT COUNT(*) AS jumlah_user
FROM users;

SELECT COUNT(*) AS jumlah_tenant
FROM tenants;

SELECT COUNT(*) AS jumlah_produk
FROM products;

-- ==========================================
-- SELESAI
-- ==========================================
