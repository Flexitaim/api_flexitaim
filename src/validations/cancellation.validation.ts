import { z } from "zod";

export const createCancellationSchema = z.object({
  appointmentId: z.number({
    required_error: "appointmentId is required",
    invalid_type_error: "appointmentId must be a number",
  })
});

export const updateCancellationSchema = z.object({
});
