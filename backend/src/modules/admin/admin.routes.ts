import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  adminCreateStore,
  adminCreateUser,
  getAdminDashboard,
  listAdminStores,
  listAdminUsers,
} from "./admin.controller";

const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

adminRouter.post("/users", adminCreateUser);
adminRouter.post("/stores", adminCreateStore);
adminRouter.get("/dashboard", getAdminDashboard);
adminRouter.get("/users", listAdminUsers);
adminRouter.get("/stores", listAdminStores);

export default adminRouter;
