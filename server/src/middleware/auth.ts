import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend the Express Request type to include the user payload
export interface AuthenticatedRequest extends Request {
  user?: { userId: number; role: string };
}

// Middleware to verify JWT
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required." });
  }

  const token = authHeader.split(" ")[1];

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET must be defined in .env");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      role: string;
    };
    req.user = decoded; // Attach user info to the request
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Middleware to check for a specific role
export const roleMiddleware = (role: "admin" | "patient") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res
        .status(403)
        .json({ error: `Forbidden: requires ${role} role.` });
    }
    next();
  };
};
