export type Ecc = "L" | "M" | "Q" | "H";
export type Fmt = "png" | "svg";

const QR_BASE = process.env.QR_MS_BASE_URL || "http://localhost:3060/api/qr";

export function buildQrUrl(
  data: string,
  opts?: Partial<{ format: Fmt; size: number; margin: number; eccLevel: Ecc; dark: string; light: string; }>
): string {
  const u = new URL(QR_BASE);
  u.searchParams.set("data", data);
  if (opts?.format) u.searchParams.set("format", opts.format);
  if (opts?.size) u.searchParams.set("size", String(opts.size));
  if (opts?.margin) u.searchParams.set("margin", String(opts.margin));
  if (opts?.eccLevel) u.searchParams.set("eccLevel", opts.eccLevel);
  if (opts?.dark) u.searchParams.set("dark", opts.dark);
  if (opts?.light) u.searchParams.set("light", opts.light);
  return u.toString();
}
