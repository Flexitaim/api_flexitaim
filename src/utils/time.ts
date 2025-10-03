import { DateTime } from "luxon";

export const ZONE_UTC = "UTC";
export const ZONE_AR = "America/Argentina/Buenos_Aires";

/** Convierte un string SQL "YYYY-MM-DD HH:mm:ss" asumido en UTC a ISO con zona AR */
export function utcSqlToArIso(sql: string | Date | null | undefined): string | null {
  if (!sql) return null;
  // Acepta Date o string; siempre lo interpretamos como UTC
  const dt = typeof sql === "string"
    ? DateTime.fromSQL(sql, { zone: ZONE_UTC })
    : DateTime.fromJSDate(sql as Date, { zone: ZONE_UTC });
  if (!dt.isValid) return null;
  return dt.setZone(ZONE_AR).toISO({ includeOffset: true }); // ej: 2025-09-22T14:37:00-03:00
}

/** Devuelve "YYYY-MM-DD HH:mm:ss" en UTC (útil si necesitás normalizar) */
export function toUtcSql(input: string | Date): string {
  const dt = typeof input === "string"
    ? DateTime.fromISO(input, { setZone: true }) // respeta offset si viene en ISO con zona
    : DateTime.fromJSDate(input);
  const utc = dt.setZone(ZONE_UTC);
  return utc.toFormat("yyyy-LL-dd HH:mm:ss");
}

/** Convierte un ISO/local AR a UTC SQL (para filtros) */
export function arIsoToUtcSql(iso: string): string {
  const dt = DateTime.fromISO(iso, { setZone: true }).setZone(ZONE_AR);
  return dt.setZone(ZONE_UTC).toFormat("yyyy-LL-dd HH:mm:ss");
}