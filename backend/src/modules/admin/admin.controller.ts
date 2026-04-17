import { Request, Response } from "express";
import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { adminCreateStoreSchema, adminCreateUserSchema, adminListQuerySchema } from "./admin.validation";

function queryString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

export const adminCreateUser = async (req: Request, res: Response): Promise<void> => {
  const parsed = adminCreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { name, email, password, address, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      address,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(201).json({ message: "User created", user });
};

export const adminCreateStore = async (req: Request, res: Response): Promise<void> => {
  const parsed = adminCreateStoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { name, email, address, ownerId } = parsed.data;

  if (ownerId != null) {
    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      res.status(400).json({ message: "Owner user not found" });
      return;
    }
    if (owner.role !== Role.STORE_OWNER) {
      res.status(400).json({ message: "Owner must be a user with role STORE_OWNER" });
      return;
    }
  }

  const store = await prisma.store.create({
    data: {
      name,
      email: email ?? null,
      address,
      ownerId: ownerId ?? null,
    },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  res.status(201).json({ message: "Store created", store });
};

export const getAdminDashboard = async (_req: Request, res: Response): Promise<void> => {
  const [totalUsers, totalStores, totalRatings] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.rating.count(),
  ]);

  res.status(200).json({
    totalUsers,
    totalStores,
    totalRatings,
  });
};

export const listAdminUsers = async (req: Request, res: Response): Promise<void> => {
  const raw = {
    name: queryString(req.query.name),
    email: queryString(req.query.email),
    address: queryString(req.query.address),
    role: queryString(req.query.role) as Role | undefined,
  };

  const parsed = adminListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters", errors: parsed.error.flatten() });
    return;
  }

  const { name, email, address, role } = parsed.data;

  const where: Prisma.UserWhereInput = {};
  if (name) where.name = { contains: name, mode: "insensitive" };
  if (email) where.email = { contains: email, mode: "insensitive" };
  if (address) where.address = { contains: address, mode: "insensitive" };
  if (role) where.role = role;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      role: true,
      createdAt: true,
    },
    orderBy: { id: "asc" },
  });

  res.status(200).json({ users });
};

export const listAdminStores = async (req: Request, res: Response): Promise<void> => {
  const raw = {
    name: queryString(req.query.name),
    email: queryString(req.query.email),
    address: queryString(req.query.address),
  };

  const parsed = adminListQuerySchema.pick({ name: true, email: true, address: true }).safeParse(raw);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters", errors: parsed.error.flatten() });
    return;
  }

  const { name, email, address } = parsed.data;

  const where: Prisma.StoreWhereInput = {};
  if (name) where.name = { contains: name, mode: "insensitive" };
  if (email) where.email = { contains: email, mode: "insensitive" };
  if (address) where.address = { contains: address, mode: "insensitive" };

  const stores = await prisma.store.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { id: "asc" },
  });

  const storeIds = stores.map((s) => s.id);
  const avgs =
    storeIds.length === 0
      ? []
      : await prisma.rating.groupBy({
          by: ["storeId"],
          where: { storeId: { in: storeIds } },
          _avg: { rating: true },
        });

  const avgByStore = new Map(avgs.map((a) => [a.storeId, a._avg.rating]));

  const payload = stores.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    address: s.address,
    averageRating: avgByStore.get(s.id) ?? null,
    owner: s.owner,
    createdAt: s.createdAt,
  }));

  res.status(200).json({ stores: payload });
};
