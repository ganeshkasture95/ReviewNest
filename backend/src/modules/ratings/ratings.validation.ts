import { z } from "zod";

export const createRatingSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
});

export const updateRatingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
});
