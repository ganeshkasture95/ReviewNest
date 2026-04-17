import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

const isPrismaUniqueViolation = (e: unknown): boolean =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
import { prisma } from "../../config/prisma";
import { createRatingSchema, updateRatingSchema } from "./ratings.validation";

export const createRating = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const parsed = createRatingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { storeId, rating } = parsed.data;

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    res.status(404).json({ message: "Store not found" });
    return;
  }

  try {
    const row = await prisma.rating.create({
      data: { userId, storeId, rating },
      select: { id: true, userId: true, storeId: true, rating: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json({ message: "Rating created", rating: row });
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      res.status(409).json({
        message: "You already rated this store; use PUT /ratings/:id to update",
      });
      return;
    }
    throw e;
  }
};

export const updateRating = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ message: "Invalid rating id" });
    return;
  }

  const parsed = updateRatingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { rating: value } = parsed.data;

  const existing = await prisma.rating.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Rating not found" });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ message: "You can only update your own ratings" });
    return;
  }

  const row = await prisma.rating.update({
    where: { id },
    data: { rating: value },
    select: { id: true, userId: true, storeId: true, rating: true, createdAt: true, updatedAt: true },
  });

  res.status(200).json({ message: "Rating updated", rating: row });
};
