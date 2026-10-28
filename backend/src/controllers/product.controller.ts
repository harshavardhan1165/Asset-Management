import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ProductService } from "../services/product.service";

export class ProductController {
  /**
   * GET /api/products
   */
  public static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProductService.getProducts(req.query as any);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/products/categories
   */
  public static getCategories = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await ProductService.getCategories();
    res.status(200).json({
      success: true,
      data: { categories },
    });
  });

  /**
   * GET /api/products/:id
   */
  public static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.getProductById(req.params.id);
    res.status(200).json({
      success: true,
      data: { product },
    });
  });

  /**
   * POST /api/products (Admin Only)
   */
  public static createProduct = asyncHandler(async (req: Request, res: Response) => {
    // If a photo was uploaded through Multer, attach its Cloudinary or static URL
    if (req.file) {
      req.body.imageUrl = (req.file as any).path?.startsWith("http")
        ? (req.file as any).path
        : `/uploads/products/${req.file.filename}`;
    }

    const product = await ProductService.createProduct(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    });
  });

  /**
   * PUT /api/products/:id (Admin Only)
   */
  public static updateProduct = asyncHandler(async (req: Request, res: Response) => {
    if (req.file) {
      req.body.imageUrl = (req.file as any).path?.startsWith("http")
        ? (req.file as any).path
        : `/uploads/products/${req.file.filename}`;
    }

    const product = await ProductService.updateProduct(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: { product },
    });
  });

  /**
   * DELETE /api/products/:id (Admin Only)
   */
  public static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    await ProductService.deleteProduct(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  });

  /**
   * GET /api/products/:id/holders (Admin Only)
   */
  public static getProductHolders = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProductService.getProductHolders(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

