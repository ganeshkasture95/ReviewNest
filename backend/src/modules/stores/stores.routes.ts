import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { listStoresForUser } from "./stores.controller";

const storesRouter = Router();

storesRouter.get("/", requireAuth, requireRole(Role.USER), listStoresForUser);

export default storesRouter;
