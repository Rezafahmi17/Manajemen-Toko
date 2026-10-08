import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.js";

import { pool } from "./config/db.js";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(cookieParser());

/* FOTO PRODUK */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);

pool
  .query("SELECT 1")
  .then(() => {
    app.listen(port, () => {
      console.log(`API berjalan di http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.error("Database gagal terhubung:", e.message);

    process.exit(1);
  });
