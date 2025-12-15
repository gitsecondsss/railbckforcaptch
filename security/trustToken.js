import jwt from "jsonwebtoken";
import { TOKEN_TTL, TRUST_TOKEN_SECRET } from "../config/constants.js";

export function generateToken(score) {
  return jwt.sign({ score }, TRUST_TOKEN_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  try {
    jwt.verify(token, TRUST_TOKEN_SECRET);
    return true;
  } catch {
    return false;
  }
}
