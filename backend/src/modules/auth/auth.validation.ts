import { z } from "zod";

const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export const signupSchema = z.object({
  name: z.string().min(20, "Name must be at least 20 characters").max(60, "Name must be at most 60 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .regex(passwordRegex, "Password must be 8-16 chars, include 1 uppercase and 1 special character"),
  address: z.string().max(400, "Address must be at most 400 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
