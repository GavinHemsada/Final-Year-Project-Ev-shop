import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

/**
 * A higher-order function that creates a role-based authorization middleware for Express.
 * This middleware checks if the authenticated user's role is included in the list of allowed roles.
 * It should be used *after* an authentication middleware (like `protectJWT`) has run and attached
 * the user object to `req.user`.
 *
 * @example
 * // This route will only be accessible to users with the 'admin' role.
 * router.get('/admin/dashboard', protectJWT, authorizeRoles(UserRole.ADMIN), adminController.getDashboard);
 *
 * @param allowedRoles - A list of role strings (e.g., from the `UserRole` enum) that are permitted to access the route.
 * @returns An Express middleware function.
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // The `protectJWT` middleware should have already attached the user object.
    const userRole = req.user?.role;

    // Handle both array and string role formats
    let userRoles: string[] = [];
    if (Array.isArray(userRole)) {
      userRoles = userRole;
    } else if (typeof userRole === "string") {
      userRoles = [userRole];
    }

    // Check if the user has at least one role that matches the allowed roles
    const hasAuthorizedRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!userRole || !hasAuthorizedRole) {
      logger.warn(
        `Access denied for user ${
          req.user?.userId
        }. Role '${JSON.stringify(userRole)}' is not authorized. Required one of: [${allowedRoles.join(
          ", "
        )}]`
      );
      return res
        .status(403)
        .json({ message: "Access denied: Unauthorized role" });
    }
    // If the role is authorized, pass control to the next middleware or route handler.
    next();
  };
};
