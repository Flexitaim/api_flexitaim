import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;


const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

const toUtcDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
};
const isPastUtc = (d: Date) => {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return d.getTime() < todayUtc.getTime();
};
const timeToSecs = (t: string) => {
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

export const createAvailabilitySchema = z.object({
  serviceId: z.number().int().min(1),
  dayOfWeek: z.number().int().min(0).max(6),  // 0=Domingo, 1=Lunes, ... (como JS)
  startTime: z.string().regex(timeRegex, "startTime must be HH:mm or HH:mm:ss"),
  endTime:   z.string().regex(timeRegex,   "endTime must be HH:mm or HH:mm:ss"),
  startDate: z.string().regex(dateRegex, "startDate must be YYYY-MM-DD"),
  endDate:   z.string().regex(dateRegex,   "endDate must be YYYY-MM-DD"),
}).superRefine((val, ctx) => {
  // orden de horas
  const toSecs = (t: string) => {
    const [h,m,s] = t.split(":").map(Number);
    return (h ?? 0)*3600 + (m ?? 0)*60 + (s ?? 0);
  };
  if (toSecs(val.startTime) >= toSecs(val.endTime)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startTime"], message: "startTime must be before endTime" });
  }
  // orden de fechas (solo día)
  if (val.startDate > val.endDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "startDate must be on or before endDate" });
  }
});

export const updateAvailabilitySchema = z.object({
  serviceId: z.number().optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
}).superRefine((val, ctx) => {
  if (val.startTime && val.endTime && timeToSecs(val.startTime) >= timeToSecs(val.endTime)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "startTime must be before endTime", path: ["startTime"] });
  }
  if (val.startDate && val.endDate) {
    const sd = toUtcDate(val.startDate);
    const ed = toUtcDate(val.endDate);
    if (sd.getTime() > ed.getTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "startDate must be on or before endDate", path: ["startDate"] });
    }
  }
  if (val.startDate && isPastUtc(toUtcDate(val.startDate))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "startDate cannot be in the past", path: ["startDate"] });
  }
  if (val.endDate && isPastUtc(toUtcDate(val.endDate))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endDate cannot be in the past", path: ["endDate"] });
  }
});


export const bulkCreateAvailabilitySchema = z
  .array(createAvailabilitySchema)
  .nonempty("At least one availability is required")
  .max(500, "Max 500 items per request");