import React, { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { productService } from "../../api/productService";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";

export interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!product) return null;

  const borrowedCount = product.totalStock - product.availableStock;
  const hasActiveBorrowers = borrowedCount > 0;

  const handleDelete = async () => {
    const id = product.id || product._id;
    if (!id) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(id);
      toast.success(`'${product.name}' deleted from catalog`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete equipment item.";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Equipment Item" maxWidth="md">
      <div className="space-y-4">
        {hasActiveBorrowers ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-sm text-rose-800 mb-1">
                Deletion Blocked by System Guard
              </strong>
              <p>
                Cannot delete <strong>{product.name}</strong> because{" "}
                <strong className="text-rose-900">{borrowedCount} unit(s)</strong> are currently in
                active custody with users.
              </p>
              <p className="mt-2 text-rose-700">
                To delete this item, all allocated units must first be returned and signed off in the
                Return Inspection Desk.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete <strong>{product.name}</strong> from the
              equipment catalog?
            </p>
            <p className="text-xs text-slate-500">
              This action cannot be undone. All catalog specifications for this product will be removed.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} size="sm">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={hasActiveBorrowers}
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

