import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { changePasswordSchema } from "./user.validation";

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    res.status(401).json({ message: "Current password is incorrect" });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ message: "New password must be different from the current password" });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  res.status(200).json({ message: "Password updated successfully" });
};
