import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../constants/roles";
import { uploadProductImage } from "../config/upload";
import {
  createProductSchema,
  updateProductSchema,
  queryProductSchema,
} from "../validations/product.schema";

const router = Router();

// Public / Discoverability routes
router.get("/", validate(queryProductSchema), ProductController.getProducts);
router.get("/categories", ProductController.getCategories);
router.get("/:id", ProductController.getProductById);

// Admin-only Inventory Management routes
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  uploadProductImage.single("image"),
  validate(createProductSchema),
  ProductController.createProduct
);

router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  uploadProductImage.single("image"),
  validate(updateProductSchema),
  ProductController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  ProductController.deleteProduct
);

router.get(
  "/:id/holders",
  authenticate,
  authorize(UserRole.ADMIN),
  ProductController.getProductHolders
);

export const productRoutes = router;

