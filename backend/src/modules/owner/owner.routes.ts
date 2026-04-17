import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { getOwnerDashboard, listOwnerRatings } from "./owner.controller";

const ownerRouter = Router();

ownerRouter.use(requireAuth, requireRole(Role.STORE_OWNER));

ownerRouter.get("/dashboard", getOwnerDashboard);
ownerRouter.get("/ratings", listOwnerRatings);

export default ownerRouter;
