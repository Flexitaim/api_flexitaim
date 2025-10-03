import { z } from "zod";

export const createAppointmentSchema = z.object({
  serviceId: z.number().min(1, "serviceId is required"),
  //userId: z.string().uuid("userId must be a valid UUID"),
  userId: z.number().int().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be in HH:MM format"),
  status: z.enum(["Reserved", "Confirmed", "Cancelled", "Completed"]).optional(),
  observations: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  serviceId: z.number().optional(),
  userId: z.number().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format").optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be in HH:MM format").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be in HH:MM format").optional(),
  status: z.enum(["Reserved", "Confirmed", "Cancelled", "Completed"]).optional(),
  observations: z.string().optional(),
});

export const paramsWithUserId = z.object({
  userId: z.string().regex(/^\d+$/).transform(Number),
});