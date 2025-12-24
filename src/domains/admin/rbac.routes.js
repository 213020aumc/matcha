import { Router } from "express";
import * as RbacController from "./rbac.controller.js"; // Ensure this matches your file structure
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/rbacMiddleware.js";

const router = Router();

// 1. GLOBAL PROTECTION
// All routes require login
router.use(protect);

// 2. RBAC MANAGEMENT ROUTES
// Typically, only Super Admins should manage roles/permissions.
// We use a specific permission 'users.manage' or creating a new specific one like 'rbac.manage'.
// For now, let's use 'users.manage' as a proxy for high-level admin access.

// GET /api/v1/admin/rbac/roles -> List all Roles
router.get(
  "/roles",
  requirePermission("users.manage"),
  RbacController.getRoles
);

// GET /api/v1/admin/rbac/permissions -> List all Available Permissions
router.get(
  "/permissions",
  requirePermission("users.manage"),
  RbacController.getPermissions
);

// POST /api/v1/admin/rbac/roles -> Create a New Role
router.post(
  "/roles",
  requirePermission("users.manage"),
  RbacController.createRole
);

// POST /api/v1/admin/rbac/assign -> Assign Role to User
router.post(
  "/assign",
  requirePermission("users.manage"),
  RbacController.assignRole
);

export default router;
