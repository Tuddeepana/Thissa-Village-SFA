import { Router } from "express";
import * as controller from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// List with pagination
router.get("/", authenticate, controller.list);

// Get by id
router.get("/:id", authenticate, controller.getById);

// Create (admin only)
router.post("/", authenticate, authorize(Role.ADMIN), controller.create);

// Update (admin only)
router.put("/:id", authenticate, authorize(Role.ADMIN), controller.update);

// Soft delete (admin only)
router.delete("/:id", authenticate, authorize(Role.ADMIN), controller.softDelete);

// Restore (admin only)
router.post("/:id/restore", authenticate, authorize(Role.ADMIN), controller.restore);

// Hard delete (admin only)
router.delete("/:id/hard", authenticate, authorize(Role.ADMIN), controller.hardDelete);

export default router;
