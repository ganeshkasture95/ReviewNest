import { z } from "zod";

export const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export const passwordField = z
  .string()
  .regex(passwordRegex, "Password must be 8-16 chars, include 1 uppercase and 1 special character");

export const nameField = z
  .string()
  .min(20, "Name must be at least 20 characters")
  .max(60, "Name must be at most 60 characters");

export const emailField = z.string().email("Invalid email format");

export const addressField = z.string().max(400, "Address must be at most 400 characters").optional();
