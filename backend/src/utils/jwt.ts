import jwt from "jsonwebtoken";
import { env } from "../config/env";

type JwtPayload = {
  userId: number;
  role: string;
};

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "1d" });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
};
