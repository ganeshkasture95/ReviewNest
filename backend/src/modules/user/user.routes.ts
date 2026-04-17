import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { changePassword } from "./user.controller";

const userRouter = Router();

userRouter.put(
  "/password",
  requireAuth,
  requireRole(Role.USER, Role.STORE_OWNER),
  changePassword,
);

export default userRouter;
