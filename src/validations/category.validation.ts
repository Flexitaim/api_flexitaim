import { z } from "zod";

export const createCategorySchema = z.object({
  description: z.string().min(1, "description is required"),
});

export const updateCategorySchema = z.object({
  description: z.string().optional(),
});
