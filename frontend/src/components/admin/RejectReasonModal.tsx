import React, { useState, useEffect } from "react";
import { AlertCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";

export interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  itemName?: string;
  requesterName?: string;
  onConfirm: (reason: string) => Promise<void>;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  itemName,
  requesterName,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    if (reason.trim().length < 3) {
      toast.error("Rejection reason must be at least 3 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to submit rejection reason";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {(itemName || requesterName) && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            {itemName && (
              <div>
                <span className="text-slate-400">Equipment:</span>{" "}
                <strong className="text-slate-800">{itemName}</strong>
              </div>
            )}
            {requesterName && (
              <div>
                <span className="text-slate-400">Borrower:</span>{" "}
                <strong className="text-slate-800">{requesterName}</strong>
              </div>
            )}
          </div>
        )}

        {description && <p className="text-xs text-slate-500">{description}</p>}

        <div>
          <label htmlFor="rejectReason" className="block text-sm font-medium text-slate-700 mb-1.5">
            Mandatory Rejection Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="rejectReason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Equipment reserved for executive summit; or missing power adapter."
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
            required
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-slate-400">The borrower will see this explanation.</span>
            <span
              className={`font-mono text-[11px] ${
                reason.trim().length >= 3 ? "text-emerald-600 font-semibold" : "text-amber-600"
              }`}
            >
              {reason.trim().length}/3 chars min
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p>
            This action will update the request status and record your remark in the permanent audit
            log.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} size="sm">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            size="sm"
            leftIcon={<XCircle className="w-4 h-4" />}
          >
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
};

