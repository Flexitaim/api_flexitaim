import { z } from "zod";

export const createServiceSchema = z.object({
  userId: z.number({
    required_error: "userId is required",
    invalid_type_error: "userId must be a number",
  }),
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
  duration: z.number().min(1, "duration must be greater than 0"),
  price: z.number().min(0, "price must be 0 or more").optional(),
});

export const updateServiceSchema = z.object({
  userId: z.number().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().min(1).optional(),
  price: z.number().min(0).optional(),
});
