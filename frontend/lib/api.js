export const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const r = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const ct = r.headers.get("content-type") || "";

  const data = ct.includes("application/json")
    ? await r.json()
    : await r.blob();

  if (!r.ok) {
    throw new Error(data?.message || "Permintaan gagal");
  }

  return data;
}

export const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export const assetUrl = (path) => {
  if (!path)
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='100%25' height='100%25' fill='%23f1f3ef'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='%2394a39c' font-family='Arial' font-size='24'%3ETanpa foto%3C/text%3E%3C/svg%3E";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${API.replace(/\/api\/?$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
};
