import { AppError } from "../utils/AppError.js";
import prisma from "../config/prisma.js";

export const requirePermission = (permissionSlug) => {
  return async (req, res, next) => {
    try {
      // 1. User must be logged in (protect middleware runs before this)
      if (!req.user || !req.user.accessRoleId) {
        return next(new AppError("Access Denied. No role assigned.", 403));
      }

      // 2. Fetch User's Role with Permissions
      // Optimization: You could cache this in Redis or the JWT token
      const userRole = await prisma.role.findUnique({
        where: { id: req.user.accessRoleId },
        include: { permissions: true },
      });

      if (!userRole) {
        return next(new AppError("Assigned role no longer exists.", 403));
      }

      // 3. Check if role has the specific permission
      const hasPermission = userRole.permissions.some(
        (p) => p.slug === permissionSlug
      );

      if (!hasPermission) {
        return next(
          new AppError(
            `You do not have permission to perform this action. Required: ${permissionSlug}`,
            403
          )
        );
      }

      next();
    } catch (error) {
      next(new AppError("RBAC Authorization failed", 500));
    }
  };
};
