import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

function queryString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

export const getOwnerDashboard = async (req: Request, res: Response): Promise<void> => {
  const ownerId = req.user!.userId;

  const stores = await prisma.store.findMany({
    where: { ownerId },
    select: { id: true, name: true, email: true, address: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  const storeIds = stores.map((s) => s.id);
  if (storeIds.length === 0) {
    res.status(200).json({ stores: [] });
    return;
  }

  const [avgs, counts] = await Promise.all([
    prisma.rating.groupBy({
      by: ["storeId"],
      where: { storeId: { in: storeIds } },
      _avg: { rating: true },
    }),
    prisma.rating.groupBy({
      by: ["storeId"],
      where: { storeId: { in: storeIds } },
      _count: { _all: true },
    }),
  ]);

  const avgMap = new Map(avgs.map((a) => [a.storeId, a._avg.rating]));
  const countMap = new Map(counts.map((c) => [c.storeId, c._count._all]));

  const payload = stores.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    address: s.address,
    averageRating: avgMap.get(s.id) ?? null,
    totalRatings: countMap.get(s.id) ?? 0,
    createdAt: s.createdAt,
  }));

  res.status(200).json({ stores: payload });
};

export const listOwnerRatings = async (req: Request, res: Response): Promise<void> => {
  const ownerId = req.user!.userId;
  const storeIdParam = queryString(req.query.storeId);
  const parsedStoreId = storeIdParam ? parseInt(storeIdParam, 10) : undefined;
  const storeId =
    parsedStoreId !== undefined && !Number.isNaN(parsedStoreId) && parsedStoreId >= 1
      ? parsedStoreId
      : undefined;

  const owned = await prisma.store.findMany({
    where: { ownerId },
    select: { id: true, name: true },
  });

  if (owned.length === 0) {
    res.status(200).json({ store: null, ratings: [] });
    return;
  }

  let targetStoreId: number;
  if (storeId != null) {
    const match = owned.find((s) => s.id === storeId);
    if (!match) {
      res.status(403).json({ message: "You do not own this store" });
      return;
    }
    targetStoreId = storeId;
  } else if (owned.length === 1) {
    targetStoreId = owned[0].id;
  } else {
    res.status(400).json({ message: "storeId query is required when you own multiple stores" });
    return;
  }

  const store = await prisma.store.findUnique({
    where: { id: targetStoreId },
    select: { id: true, name: true, email: true, address: true },
  });

  const avgRow = await prisma.rating.aggregate({
    where: { storeId: targetStoreId },
    _avg: { rating: true },
  });

  const ratings = await prisma.rating.findMany({
    where: { storeId: targetStoreId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(200).json({
    store: {
      ...store!,
      averageRating: avgRow._avg.rating ?? null,
    },
    ratings: ratings.map((r) => ({
      id: r.id,
      rating: r.rating,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: { id: r.user.id, name: r.user.name, email: r.user.email },
    })),
  });
};
