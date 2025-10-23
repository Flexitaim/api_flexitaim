import { z } from "zod";

export const upsertFavoriteSchema = z.object({
  userId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
});
export type UpsertFavoriteDto = z.infer<typeof upsertFavoriteSchema>;
