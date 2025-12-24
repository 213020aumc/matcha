import prisma from "../../config/prisma.js";
import catchAsync from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";

// --- 1. READ (Get All Settings) ---
export const getSettings = catchAsync(async (req, res) => {
  const settings = await prisma.settings.findMany({
    orderBy: { key: "asc" },
  });

  // Convert Array to Object { "BUSINESS_NAME": "Helix", ... }
  // This format is much easier for the Frontend to use
  const formatted = settings.reduce(
    (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
    {}
  );

  res.status(200).json({
    status: "success",
    data: formatted,
  });
});

// --- 2. CREATE / UPDATE (Bulk or Single) ---
export const updateSettings = catchAsync(async (req, res) => {
  // Accepts Object: { "NEW_KEY": "Value", "EXISTING_KEY": "New Value" }
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    return res
      .status(200)
      .json({ status: "success", message: "No changes provided" });
  }

  // Use Transaction to handle multiple upserts safely
  const promises = Object.entries(updates).map(([key, value]) => {
    return prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  });

  await prisma.$transaction(promises);

  res.status(200).json({
    status: "success",
    message: "Settings saved successfully",
  });
});

// --- 3. DELETE (Remove a specific setting) ---
export const deleteSetting = catchAsync(async (req, res, next) => {
  const { key } = req.params;

  // Protect critical keys from being deleted (Optional safety)
  const PROTECTED_KEYS = ["BUSINESS_NAME", "ADMIN_EMAIL"];
  if (PROTECTED_KEYS.includes(key)) {
    return next(new AppError(`Cannot delete protected setting: ${key}`, 403));
  }

  try {
    await prisma.settings.delete({
      where: { key },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return next(new AppError("Setting key not found", 404));
    }
    throw err;
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
