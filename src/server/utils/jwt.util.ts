import jwt from "jsonwebtoken";
import { config } from "../../config/environment";

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, config.user_sessions.secret, {
    expiresIn: `${config.user_sessions.expiration_days}d`,
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.user_sessions.secret);
};