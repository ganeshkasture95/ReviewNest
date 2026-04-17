import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const isSupabase = env.databaseUrl.includes("supabase.co");

const adapter = new PrismaPg({
  connectionString: env.databaseUrl,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const prisma = new PrismaClient({ adapter });
