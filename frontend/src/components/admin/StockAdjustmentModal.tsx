import React, { useState, useEffect } from "react";
import { Sliders, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { productService } from "../../api/productService";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [newTotalStock, setNewTotalStock] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && product) {
      setNewTotalStock(product.totalStock);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const activelyBorrowed = product.totalStock - product.availableStock;
  const projectedAvailable = Math.max(0, newTotalStock - activelyBorrowed);
  const isInvalid = newTotalStock < activelyBorrowed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isInvalid) {
      toast.error(
        `Total stock cannot be less than ${activelyBorrowed} (the number of units actively held by users)`
      );
      return;
    }

    const productId = product.id || product._id;
    if (!productId) return;

    setIsSubmitting(true);
    try {
      await productService.adjustStock(productId, newTotalStock);
      toast.success(`Inventory stock for '${product.name}' adjusted successfully`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to adjust inventory stock";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Inventory Stock: ${product.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Breakdown Card */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total</span>
            <span className="text-base font-bold text-slate-800">{product.totalStock}</span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] text-emerald-600 block font-semibold uppercase">
              Available
            </span>
            <span className="text-base font-bold text-emerald-600">{product.availableStock}</span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] text-indigo-600 block font-semibold uppercase">
              In Custody
            </span>
            <span className="text-base font-bold text-indigo-600">{activelyBorrowed}</span>
          </div>
        </div>

        {/* Input */}
        <div>
          <Input
            label="New Total Inventory Stock"
            type="number"
            min={activelyBorrowed}
            value={newTotalStock}
            onChange={(e) => setNewTotalStock(parseInt(e.target.value, 10) || 0)}
            helperText={`Minimum allowed: ${activelyBorrowed} units (currently borrowed)`}
            required
          />
        </div>

        {/* Real-time Projected Available Preview */}
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            isInvalid
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {isInvalid ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>
              {isInvalid
                ? `Cannot set total below ${activelyBorrowed} borrowed units.`
                : "Projected available units after update:"}
            </span>
          </div>
          <span className="font-bold text-sm">{isInvalid ? "Error" : `${projectedAvailable} units`}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="secondary"
            className="bg-indigo-600 hover:bg-indigo-700"
            isLoading={isSubmitting}
            disabled={isInvalid}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            Update Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
};

