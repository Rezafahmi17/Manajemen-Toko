import "./globals.css";
import CosmicBackground from "@/components/CosmicBackground";

export const metadata = {
  title: "TokoHub - Multi Tenant Store",
  description: "Manajemen toko penjualan dan penyewaan",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <CosmicBackground />
        {children}
      </body>
    </html>
  );
}
