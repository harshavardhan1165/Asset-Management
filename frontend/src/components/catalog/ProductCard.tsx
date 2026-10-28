import React from "react";
import { Package, ArrowUpRight, AlertTriangle } from "lucide-react";
import type { Product } from "../../types";
import { formatImageUrl } from "../../utils/imageUrl";
import { Button } from "../common/Button";

export interface ProductCardProps {
  product: Product;
  onRequest: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onRequest }) => {
  const isOutOfStock = product.availableStock <= 0;
  const isLowStock = product.availableStock > 0 && product.availableStock <= 2;
  const stockPercentage = Math.round((product.availableStock / product.totalStock) * 100);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={formatImageUrl(product.imageUrl)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            // Fallback placeholder on image load failure
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/95 text-slate-800 shadow-sm backdrop-blur-xs border border-slate-200/50">
            {product.category}
          </span>
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-600 text-white shadow-sm flex items-center gap-1">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500 text-white shadow-sm flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Only {product.availableStock} Left
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-600 text-white shadow-sm">
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Inventory Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              Stock Availability
            </span>
            <span className="font-semibold text-slate-700">
              {product.availableStock} / {product.totalStock} units
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOutOfStock
                  ? "bg-rose-500"
                  : isLowStock
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.max(stockPercentage, isOutOfStock ? 0 : 5)}%` }}
            />
          </div>

          {/* Action Button */}
          <div className="mt-4">
            <Button
              variant={isOutOfStock ? "outline" : "primary"}
              className="w-full text-xs"
              size="md"
              disabled={isOutOfStock}
              onClick={() => onRequest(product)}
              rightIcon={!isOutOfStock ? <ArrowUpRight className="w-3.5 h-3.5" /> : undefined}
            >
              {isOutOfStock ? "Currently Unavailable" : "Request Equipment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

