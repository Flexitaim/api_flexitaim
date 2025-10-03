// src/utils/availabilityDates.ts
import { DateTime } from "luxon";

const ZONE_AR = "America/Argentina/Buenos_Aires";

/**
 * Ajusta startDate al próximo día `dayOfWeek` disponible dentro del rango [startDate..endDate].
 * - `dayOfWeek`: 0..6 (0=Domingo, 1=Lunes, ..., 6=Sábado) como en JS.
 * - Si startDate no cae en ese dayOfWeek, lo avanza hasta el próximo.
 * - Si cae en ese dayOfWeek pero la hora startTime ya pasó hoy, lo corre 7 días.
 * - Si al ajustar supera endDate, devuelve null.
 *
 * @return "yyyy-MM-dd" o null si no hay ventana.
 */
export function normalizeStartDateWindow(
  startDate: string,
  endDate: string,
  dayOfWeek: number,
  startTime: string
): string | null {
  let start = DateTime.fromISO(startDate, { zone: ZONE_AR }).startOf("day");
  const end = DateTime.fromISO(endDate, { zone: ZONE_AR }).endOf("day");
  const now = DateTime.now().setZone(ZONE_AR);

  // Luxon: weekday 1=lun..7=dom → mapeamos 0 (dom) -> 7
  const wantedLuxonWeekday = dayOfWeek === 0 ? 7 : dayOfWeek;

  // 1) avanzar hasta el próximo día con ese weekday (>= startDate)
  while (start.weekday !== wantedLuxonWeekday) {
    start = start.plus({ days: 1 });
  }

  // 2) si es hoy y la hora ya pasó, rodar una semana
  const [h = 0, m = 0, s = 0] = startTime.split(":").map(Number);
  const slotTodayStart = start.set({ hour: h, minute: m, second: s });

  if (slotTodayStart <= now) {
    start = start.plus({ days: 7 });
  }

  // 3) validar ventana
  if (start > end) return null;

  return start.toFormat("yyyy-LL-dd");
}
