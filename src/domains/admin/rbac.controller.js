import prisma from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";

// GET ALL ROLES (with permission lists)
export const getRoles = catchAsync(async (req, res) => {
  const roles = await prisma.role.findMany({
    include: { permissions: true },
  });
  res.status(200).json({ status: "success", data: roles });
});

// GET ALL AVAILABLE PERMISSIONS (So frontend can show checkboxes)
export const getPermissions = catchAsync(async (req, res) => {
  const permissions = await prisma.permission.findMany();
  res.status(200).json({ status: "success", data: permissions });
});

// CREATE NEW ROLE
export const createRole = catchAsync(async (req, res) => {
  const { name, description, permissionSlugs } = req.body;

  // Find Permission IDs based on slugs
  const permissions = await prisma.permission.findMany({
    where: { slug: { in: permissionSlugs } },
  });

  const newRole = await prisma.role.create({
    data: {
      name,
      description,
      permissions: {
        connect: permissions.map((p) => ({ id: p.id })),
      },
    },
  });

  res.status(201).json({ status: "success", data: newRole });
});

// ASSIGN ROLE TO USER
export const assignRole = catchAsync(async (req, res, next) => {
  const { userId, roleName } = req.body;

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return next(new AppError("Role not found", 404));

  await prisma.user.update({
    where: { id: userId },
    data: { accessRoleId: role.id },
  });

  res
    .status(200)
    .json({ status: "success", message: `User assigned to ${roleName}` });
});
