import { Product, IProduct } from "../models/Product.model";
import { AssetRequest } from "../models/AssetRequest.model";
import { RequestStatus } from "../constants/requestState";
import { AppError } from "../utils/AppError";
import {
  CreateProductInput,
  UpdateProductInput,
  QueryProductInput,
} from "../validations/product.schema";

export interface PaginatedProducts {
  products: IProduct[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ProductService {
  /**
   * Retrieves products with search, category filtering, and pagination
   */
  public static async getProducts(query: QueryProductInput): Promise<PaginatedProducts> {
    const filter: Record<string, any> = {};

    // Full-text search on name and description
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Category filter
    if (query.category) {
      filter.category = query.category;
    }

    // Live availability filter
    if (query.inStock === "true") {
      filter.availableStock = { $gt: 0 };
    } else if (query.inStock === "false") {
      filter.availableStock = 0;
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Returns a distinct list of all product categories
   */
  public static async getCategories(): Promise<string[]> {
    const categories = await Product.distinct("category");
    return categories.sort();
  }

  /**
   * Retrieves a single product by ID
   */
  public static async getProductById(id: string): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return product;
  }

  /**
   * Creates a new product and sets availableStock equal to totalStock
   */
  public static async createProduct(input: CreateProductInput): Promise<IProduct> {
    const product = await Product.create({
      ...input,
      availableStock: input.totalStock,
    });
    return product;
  }

  /**
   * Updates product metadata and adjusts stock with borrowed-units bounds protection
   */
  public static async updateProduct(
    id: string,
    input: UpdateProductInput
  ): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Stock bounds recalculation
    if (input.totalStock !== undefined) {
      const currentlyBorrowed = product.totalStock - product.availableStock;

      if (input.totalStock < currentlyBorrowed) {
        throw new AppError(
          `Cannot reduce total stock to ${input.totalStock}. Currently, ${currentlyBorrowed} unit(s) are actively held by users.`,
          400
        );
      }

      // Recalculate available stock based on the new total stock
      product.availableStock = input.totalStock - currentlyBorrowed;
      product.totalStock = input.totalStock;
    }

    if (input.name !== undefined) product.name = input.name;
    if (input.category !== undefined) product.category = input.category;
    if (input.description !== undefined) product.description = input.description;
    if (input.imageUrl !== undefined) product.imageUrl = input.imageUrl;

    await product.save();
    return product;
  }

  /**
   * Deletes a product, strictly blocked if units are in active custody
   */
  public static async deleteProduct(id: string): Promise<void> {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Integrity Check: Block deletion if units are held under APPROVED or RETURN_PENDING requests
    const activeCustodyCount = await AssetRequest.countDocuments({
      productId: id,
      status: { $in: [RequestStatus.APPROVED, RequestStatus.RETURN_PENDING] },
    });

    if (activeCustodyCount > 0) {
      throw new AppError(
        `Cannot delete product: ${activeCustodyCount} unit(s) are currently in active custody with users.`,
        400
      );
    }

    await Product.findByIdAndDelete(id);
  }

  /**
   * Retrieves all users currently holding units of this product (Global Allocation View)
   */
  public static async getProductHolders(productId: string) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const activeAllocations = await AssetRequest.find({
      productId,
      status: { $in: [RequestStatus.APPROVED, RequestStatus.RETURN_PENDING] },
    })
      .populate("userId", "name email")
      .sort({ approvedAt: -1 });

    return {
      product: {
        id: product._id,
        name: product.name,
        totalStock: product.totalStock,
        availableStock: product.availableStock,
        allocatedCount: product.totalStock - product.availableStock,
      },
      holders: activeAllocations.map((alloc) => ({
        requestId: alloc._id,
        user: alloc.userId,
        quantity: alloc.quantity,
        status: alloc.status,
        approvedAt: alloc.approvedAt,
        purpose: alloc.purpose,
      })),
    };
  }
}

