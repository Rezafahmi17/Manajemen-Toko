export function notFound(req, res) {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
}
export function errorHandler(err, req, res, next) {
  if (err?.name === "ZodError")
    return res
      .status(400)
      .json({
        message: "Validasi gagal",
        errors: err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
  console.error(err);
  res
    .status(err.status || 500)
    .json({
      message: err.status ? err.message : "Terjadi kesalahan pada server",
    });
}
