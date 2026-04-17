import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

function queryString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

export const listStoresForUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const search = queryString(req.query.search)?.trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { address: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const stores = await prisma.store.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, address: true },
  });

  const storeIds = stores.map((s) => s.id);
  if (storeIds.length === 0) {
    res.status(200).json({ stores: [] });
    return;
  }

  const [avgs, myRatings] = await Promise.all([
    prisma.rating.groupBy({
      by: ["storeId"],
      where: { storeId: { in: storeIds } },
      _avg: { rating: true },
    }),
    prisma.rating.findMany({
      where: { userId, storeId: { in: storeIds } },
      select: { id: true, storeId: true, rating: true },
    }),
  ]);

  const avgMap = new Map(avgs.map((a) => [a.storeId, a._avg.rating]));
  const myMap = new Map(myRatings.map((r) => [r.storeId, { ratingId: r.id, rating: r.rating }]));

  const payload = stores.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    address: s.address,
    averageRating: avgMap.get(s.id) ?? null,
    yourRating: myMap.get(s.id) ?? null,
  }));

  res.status(200).json({ stores: payload });
};
