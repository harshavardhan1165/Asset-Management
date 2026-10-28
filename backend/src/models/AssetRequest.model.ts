import { Schema, model, Document, Model, Types } from "mongoose";
import {
  RequestStatus,
  RequestStatusType,
  ALLOWED_TRANSITIONS,
} from "../constants/requestState";
import { AppError } from "../utils/AppError";

export interface IAssetRequest extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  purpose: string;
  supportingDocUrl?: string;
  status: RequestStatusType;
  
  // Admin review fields
  adminRemark?: string;
  processedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedAt?: Date;

  // Handover & verification fields
  handoverPhotos: string[];
  handoverNotes?: string;
  handoverRequestedAt?: Date;
  handoverRejectedReason?: string;
  returnedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type AssetRequestModelType = Model<IAssetRequest>;

const assetRequestSchema = new Schema<IAssetRequest, AssetRequestModelType>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity requested must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
    purpose: {
      type: String,
      required: [true, "Purpose/justification is mandatory"],
      trim: true,
      minlength: [5, "Purpose must be at least 5 characters"],
      maxlength: [500, "Purpose cannot exceed 500 characters"],
    },
    supportingDocUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: Object.values(RequestStatus),
        message: "Invalid request status",
      },
      default: RequestStatus.PENDING,
      index: true,
    },
    adminRemark: {
      type: String,
      trim: true,
      default: "",
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    handoverPhotos: {
      type: [String],
      default: [],
    },
    handoverNotes: {
      type: String,
      trim: true,
      default: "",
    },
    handoverRequestedAt: {
      type: Date,
    },
    handoverRejectedReason: {
      type: String,
      trim: true,
      default: "",
    },
    returnedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Capture original status on document load and after save to enforce FSM transition guards
assetRequestSchema.post("init", function () {
  this.$locals.originalStatus = this.status;
});

assetRequestSchema.post("save", function () {
  this.$locals.originalStatus = this.status;
});

// Pre-save hook: Enforce state machine transition guards
assetRequestSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("status")) {
    const prevStatus = this.$locals.originalStatus as RequestStatusType | undefined;
    if (prevStatus && prevStatus !== this.status) {
      const allowed = ALLOWED_TRANSITIONS[prevStatus] || [];
      if (!allowed.includes(this.status)) {
        return next(
          new AppError(
            `Illegal status transition: cannot move request from '${prevStatus}' to '${this.status}'`,
            400
          )
        );
      }
    }
  }
  next();
});

// Compound indexes for optimal performance across all dashboard queries:
// 1. Used by End Users for "My Requests" and "Owned Assets"
assetRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });

// 2. Used by Admins for "Pending Requests Queue" and "Handover Inspection Desk"
assetRequestSchema.index({ status: 1, createdAt: -1 });

// 3. Used to check for active allocations before deleting a product
assetRequestSchema.index({ productId: 1, status: 1 });

export const AssetRequest = model<IAssetRequest, AssetRequestModelType>(
  "AssetRequest",
  assetRequestSchema
);
