import React, { useState, useEffect } from "react";
import { Send, AlertCircle, Plus, Minus } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { requestService } from "../../api/requestService";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { formatImageUrl } from "../../utils/imageUrl";

export interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setReason("");
    }
  }, [isOpen]);

  if (!product) return null;

  const maxQuantity = product.availableStock;

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a purpose / business justification for this request");
      return;
    }

    if (reason.trim().length < 5) {
      toast.error("Purpose must be at least 5 characters long (e.g. 'Client project development')");
      return;
    }

    if (quantity < 1 || quantity > maxQuantity) {
      toast.error(`Quantity must be between 1 and ${maxQuantity}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const productId = product.id || (product as { _id?: string })._id;
      if (!productId) {
        throw new Error("Invalid product ID");
      }

      await requestService.submitRequest({
        productId,
        quantity,
        purpose: reason.trim(),
      });

      toast.success("Request submitted successfully! Awaiting Admin approval.");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const respData = (
        err as {
          response?: {
            data?: {
              message?: string;
              errors?: Array<{ field: string; message: string }>;
            };
          };
        }
      )?.response?.data;

      const specificError = respData?.errors?.[0]?.message;
      const errorMsg = specificError || respData?.message || "Failed to submit request. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Equipment Allocation" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Product Overview Summary */}
        <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <img
            src={formatImageUrl(product.imageUrl)}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white"
          />
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 mb-1">
              {product.category}
            </span>
            <h4 className="text-sm font-bold text-slate-800 truncate">{product.name}</h4>
            <p className="text-xs text-slate-500">
              Available Units:{" "}
              <span className="font-semibold text-emerald-600">{product.availableStock}</span>
            </p>
          </div>
        </div>

        {/* Quantity Stepper */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Quantity Required <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1 || isSubmitting}
              className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="w-16 text-center font-bold text-lg text-slate-800 select-none">
              {quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity || isSubmitting}
              className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-500 ml-2">
              (Max available: {maxQuantity} {maxQuantity === 1 ? "unit" : "units"})
            </span>
          </div>
        </div>

        {/* Purpose / Justification */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1.5">
            Purpose / Business Justification <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Primary development machine for the upcoming client onboarding sprint."
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            required
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-slate-400">
              Please be specific. Your request will be reviewed by an administrator.
            </span>
            <span
              className={`font-mono text-[11px] ${
                reason.trim().length >= 5 ? "text-emerald-600 font-semibold" : "text-amber-600"
              }`}
            >
              {reason.trim().length}/5 chars min
            </span>
          </div>
        </div>

        {/* Stock Advisory Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p>
            Submitting this request places it into the <strong>Admin Approval Queue</strong>. Stock
            is reserved upon admin approval.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

