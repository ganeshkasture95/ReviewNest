import { z } from "zod";
import { addressField, emailField, nameField, passwordField } from "../shared/userFields";

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  address: addressField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});
