import { z } from "zod";
import { Role } from "@prisma/client";
import { addressField, emailField, nameField, passwordField } from "../shared/userFields";

export const adminCreateUserSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  address: addressField,
  role: z.nativeEnum(Role),
});

export const adminCreateStoreSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  address: z.string().min(1, "Address is required").max(400),
  ownerId: z.coerce.number().int().positive().optional().nullable(),
});

export const adminListQuerySchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
});
