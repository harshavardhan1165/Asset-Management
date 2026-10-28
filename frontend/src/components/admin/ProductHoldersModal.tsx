import React, { useState, useEffect } from "react";
import { Layers, Calendar, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { productService, type ProductHoldersData } from "../../api/productService";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { LoadingSpinner } from "../common/LoadingSpinner";

export interface ProductHoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductHoldersModal: React.FC<ProductHoldersModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [data, setData] = useState<ProductHoldersData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && product) {
      const productId = product.id || product._id;
      if (!productId) return;

      setIsLoading(true);
      productService
        .getProductHolders(productId)
        .then((res) => {
          setData(res);
        })
        .catch(() => {
          toast.error("Failed to load allocation holders");
          setData(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, product]);

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Active Allocations: ${product.name}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Metric summary */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block">Total Catalog Units</span>
            <span className="font-bold text-slate-800 text-sm">{product.totalStock} units</span>
          </div>
          <div>
            <span className="text-emerald-600 block">In Stock</span>
            <span className="font-bold text-emerald-600 text-sm">{product.availableStock} units</span>
          </div>
          <div>
            <span className="text-indigo-600 block">Currently Allocated</span>
            <span className="font-bold text-indigo-600 text-sm">
              {product.totalStock - product.availableStock} units
            </span>
          </div>
        </div>

        {/* Holders List */}
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" text="Loading active holders..." />
          </div>
        ) : !data || data.holders.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No Active Borrowers</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              All units of this equipment are currently available in the central inventory.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {data.holders.map((holder, idx) => {
              const formattedDate = holder.approvedAt
                ? new Date(holder.approvedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Active";

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs uppercase">
                        {holder.user.name?.substring(0, 2) || "U"}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {holder.user.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{holder.user.email}</span>
                      </div>
                    </div>
                    <Badge
                      variant={holder.status === "RETURN_PENDING" ? "purple" : "success"}
                    >
                      {holder.status === "RETURN_PENDING" ? "Inspection Pending" : "In Custody"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" /> {holder.quantity} units held
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" /> Allocated {formattedDate}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                    "{holder.purpose}"
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
