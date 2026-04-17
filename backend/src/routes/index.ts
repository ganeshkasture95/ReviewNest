import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import adminRouter from "../modules/admin/admin.routes";
import storesRouter from "../modules/stores/stores.routes";
import ratingsRouter from "../modules/ratings/ratings.routes";
import ownerRouter from "../modules/owner/owner.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ message: "API is running" });
});

router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/stores", storesRouter);
router.use("/ratings", ratingsRouter);
router.use("/owner", ownerRouter);

export default router;
