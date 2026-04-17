import { z } from "zod";
import { passwordField } from "../shared/userFields";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordField,
});
