import { Schema, model, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  category: string;
  description: string;
  totalStock: number;
  availableStock: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  isInStock: boolean;
}

export type ProductModelType = Model<IProduct>;

const productSchema = new Schema<IProduct, ProductModelType>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1500, "Description cannot exceed 1500 characters"],
    },
    totalStock: {
      type: Number,
      required: [true, "Total stock is required"],
      min: [0, "Total stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total stock must be an integer",
      },
    },
    availableStock: {
      type: Number,
      required: [true, "Available stock is required"],
      min: [0, "Available stock cannot be negative"],
      validate: [
        {
          validator: Number.isInteger,
          message: "Available stock must be an integer",
        },
        {
          validator: function (this: IProduct, val: number): boolean {
            // Only validate on document save/create when totalStock is present
            if (this.totalStock !== undefined) {
              return val <= this.totalStock;
            }
            return true;
          },
          message: "Available stock cannot exceed total stock",
        },
      ],
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual field: Quick boolean indicator for in-stock status
productSchema.virtual("isInStock").get(function (this: IProduct) {
  return this.availableStock > 0;
});

// Full-text search index on name and description
productSchema.index({ name: "text", description: "text" });

// Compound index for sorting & filtering by category and available stock
productSchema.index({ category: 1, availableStock: -1 });

export const Product = model<IProduct, ProductModelType>("Product", productSchema);
