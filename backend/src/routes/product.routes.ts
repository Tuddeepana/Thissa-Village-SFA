import { Router } from "express";
import * as controller from "../controllers/product.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// List with pagination + search
router.get("/", authenticate, controller.list);

// Get by id
router.get("/:id", authenticate, controller.getById);

// Create (admin only)
router.post("/", authenticate, authorize(Role.ADMIN), controller.create);

// Update (admin only)
router.put("/:id", authenticate, authorize(Role.ADMIN), controller.update);

// Hard delete (admin only)
router.delete("/:id", authenticate, authorize(Role.ADMIN), controller.remove);

export default router;
