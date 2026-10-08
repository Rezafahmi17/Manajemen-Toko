import ExcelJS from "exceljs";
import { z } from "zod";
import { pool } from "../config/db.js";
import { tenantId } from "../middleware/auth.js";
export async function list(req, res) {
  const tid = tenantId(req);
  const [rows] = await pool.query(
    "SELECT * FROM transactions WHERE tenant_id=? ORDER BY transaction_date DESC,id DESC",
    [tid],
  );
  res.json({ data: rows });
}
export async function create(req, res) {
  const tid = tenantId(req);
  const d = z
    .object({
      type: z.enum(["pemasukan", "pengeluaran"]),
      category: z.string().min(2),
      description: z.string().optional(),
      amount: z.coerce.number().positive(),
      transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .parse(req.body);
  const [r] = await pool.query(
    "INSERT INTO transactions(tenant_id,type,category,description,amount,transaction_date) VALUES(?,?,?,?,?,?)",
    [
      tid,
      d.type,
      d.category,
      d.description || null,
      d.amount,
      d.transaction_date,
    ],
  );
  res.status(201).json({ id: r.insertId, message: "Transaksi dicatat" });
}
export async function summary(req, res) {
  const tid = tenantId(req);
  const [[s]] = await pool.query(
    "SELECT COALESCE(SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END),0) expense FROM transactions WHERE tenant_id=?",
    [tid],
  );
  const [monthly] = await pool.query(
    "SELECT DATE_FORMAT(transaction_date,'%Y-%m') label,SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END) income,SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END) expense FROM transactions WHERE tenant_id=? GROUP BY label ORDER BY label DESC LIMIT 12",
    [tid],
  );
  const [byCategory] = await pool.query(
    `SELECT category, type, SUM(amount) amount FROM transactions WHERE tenant_id=? GROUP BY category,type ORDER BY type,category`,
    [tid]
  );
  res.json({ ...s, monthly: monthly.reverse(), by_category: byCategory });
}
export async function excel(req, res) {
  const tid = tenantId(req);
  const [rows] = await pool.query(
    "SELECT transaction_date,type,category,description,amount FROM transactions WHERE tenant_id=? ORDER BY transaction_date DESC",
    [tid],
  );
  
  const [[s]] = await pool.query(
    "SELECT COALESCE(SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END),0) expense FROM transactions WHERE tenant_id=?",
    [tid]
  );

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Keuangan", { views: [{ showGridLines: false }] });
  
  // Title
  ws.mergeCells('A1:E2');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'LAPORAN KEUANGAN';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B4D3C' } }; // Dark green
  
  // Summary
  ws.getCell('A4').value = 'Total Pemasukan:';
  ws.getCell('B4').value = Number(s.income);
  ws.getCell('B4').numFmt = '"Rp"#,##0.00';
  ws.getCell('B4').font = { bold: true, color: { argb: 'FF10B981' } };

  ws.getCell('A5').value = 'Total Pengeluaran:';
  ws.getCell('B5').value = Number(s.expense);
  ws.getCell('B5').numFmt = '"Rp"#,##0.00';
  ws.getCell('B5').font = { bold: true, color: { argb: 'FFEF4444' } };

  ws.getCell('A6').value = 'Saldo Bersih:';
  ws.getCell('B6').value = Number(s.income) - Number(s.expense);
  ws.getCell('B6').numFmt = '"Rp"#,##0.00';
  ws.getCell('B6').font = { bold: true };

  // Empty row before table
  const startRow = 8;

  // Table Headers
  const columns = [
    { header: "Tanggal", key: "transaction_date", width: 18 },
    { header: "Tipe", key: "type", width: 15 },
    { header: "Kategori", key: "category", width: 25 },
    { header: "Keterangan", key: "description", width: 40 },
    { header: "Nominal", key: "amount", width: 22 },
  ];
  
  ws.getRow(startRow).values = columns.map(c => c.header);
  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
  });

  // Style Header Row
  const headerRow = ws.getRow(startRow);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald green
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
  });

  // Table Data
  let currentRow = startRow + 1;
  rows.forEach((row, index) => {
    const trRow = ws.getRow(currentRow);
    trRow.values = [
      row.transaction_date ? new Date(row.transaction_date).toISOString().slice(0, 10) : '',
      row.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
      row.category,
      row.description || '-',
      Number(row.amount)
    ];

    trRow.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 5 ? 'right' : (colNumber <= 2 ? 'center' : 'left') };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
      
      // Stripe effect
      if (index % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });

    // Formatting nominal
    trRow.getCell(5).numFmt = '"Rp"#,##0.00';
    trRow.getCell(5).font = { color: { argb: row.type === 'pemasukan' ? 'FF059669' : 'FFDC2626' }, bold: true };

    currentRow++;
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=laporan-keuangan.xlsx",
  );
  await wb.xlsx.write(res);
  res.end();
}
