import { z } from "zod";

export const favoriteKeySchema = z.object({
  userId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
});

export type FavoriteKeyDto = z.infer<typeof favoriteKeySchema>;
