import { Request, Response, NextFunction } from "express";
import { DateTime } from "luxon";

const ZONE_UTC = "UTC";
const ZONE_AR  = "America/Argentina/Buenos_Aires";

const toLocal = (v: unknown): string | null => {
  if (!v) return null;
  const dt =
    typeof v === "string"
      ? DateTime.fromSQL(v, { zone: ZONE_UTC })
      : v instanceof Date
      ? DateTime.fromJSDate(v, { zone: ZONE_UTC })
      : null;
  if (!dt || !dt.isValid) return null;
  return dt.setZone(ZONE_AR).toISO({ includeOffset: true });
};

const addLocal = (o: any) => {
  if (!o || typeof o !== "object") return o;
  if ("createdAt" in o && !("createdAtLocal" in o)) o.createdAtLocal = toLocal(o.createdAt);
  if ("updatedAt" in o && !("updatedAtLocal" in o)) o.updatedAtLocal = toLocal(o.updatedAt);
  return o;
};

const transform = (payload: any): any => {
  if (payload == null) return payload;
  // Instancias de Sequelize -> plain
  if (payload && typeof payload === "object" && typeof payload.toJSON === "function") {
    return transform(payload.toJSON());
  }
  if (Array.isArray(payload)) return payload.map(transform);
  if (typeof payload === "object") {
    const out: any = { ...payload };
    addLocal(out);
    for (const k of Object.keys(out)) {
      const v = out[k];
      if (v && (typeof v === "object" || Array.isArray(v))) out[k] = transform(v);
    }
    return out;
  }
  return payload;
};

export function attachLocalTimes() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res) as Response["json"];
    const originalSend = res.send.bind(res) as Response["send"];

    res.json = ((body?: any) => originalJson(transform(body))) as Response["json"];

    res.send = ((body?: any) => {
      if (body && typeof body === "object") return originalJson(transform(body));
      const ct = res.getHeader("Content-Type");
      if (typeof body === "string" && ct && String(ct).includes("application/json")) {
        try {
          const parsed = JSON.parse(body);
          return originalSend(JSON.stringify(transform(parsed)));
        } catch { /* sigue normal */ }
      }
      return originalSend(body as any);
    }) as Response["send"];

    next();
  };
}