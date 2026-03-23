import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: {
  agentId: string;
  name: string;
  mobile: string;
  isAdmin: boolean;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): {
  agentId: string;
  name: string;
  mobile: string;
  isAdmin: boolean;
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      agentId: string;
      name: string;
      mobile: string;
      isAdmin: boolean;
    };
  } catch {
    return null;
  }
}
