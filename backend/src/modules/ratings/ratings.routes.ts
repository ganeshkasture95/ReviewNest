import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { createRating, updateRating } from "./ratings.controller";

const ratingsRouter = Router();

ratingsRouter.use(requireAuth, requireRole(Role.USER));

ratingsRouter.post("/", createRating);
ratingsRouter.put("/:id", updateRating);

export default ratingsRouter;
