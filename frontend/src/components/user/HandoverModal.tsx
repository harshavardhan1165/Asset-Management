import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, CheckCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import type { AssetRequest } from "../../types";
import { requestService } from "../../api/requestService";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { formatImageUrl } from "../../utils/imageUrl";

export interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AssetRequest | null;
  onSuccess: () => void;
}

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess,
}) => {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [handoverNotes, setHandoverNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on close or unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  useEffect(() => {
    if (isOpen) {
      setPhotos([]);
      setHandoverNotes("");
    }
  }, [isOpen]);

  if (!request) return null;

  const product =
    typeof request.productId === "object"
      ? request.productId
      : typeof request.product === "object"
      ? request.product
      : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    // Maximum 2 photos permitted by backend
    if (photos.length + selectedFiles.length > 2) {
      toast.error("You can upload a maximum of 2 condition photos");
      return;
    }

    const validNewPreviews: PhotoPreview[] = [];
    for (const file of selectedFiles) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`'${file.name}' is not an image file`);
        continue;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`'${file.name}' exceeds the 5MB size limit`);
        continue;
      }

      validNewPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPhotos((prev) => [...prev, ...validNewPreviews]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (photos.length === 0) {
      toast.error("At least 1 photo verifying the asset's condition is required");
      return;
    }

    const requestId = request.id || request._id;
    if (!requestId) {
      toast.error("Invalid request ID");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestService.submitHandover(requestId, {
        photos: photos.map((p) => p.file),
        handoverNotes: handoverNotes.trim() || undefined,
      });

      toast.success("Return handover submitted! Awaiting administrator physical sign-off.");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to submit return handover. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Return Equipment & Submit Handover"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Asset Context Card */}
        {product && (
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <img
              src={formatImageUrl(product.imageUrl)}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-white"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {product.category}
              </span>
              <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5">{product.name}</h4>
              <p className="text-xs text-slate-500">
                Quantity in Custody: <span className="font-semibold text-slate-700">{request.quantity} units</span>
              </p>
            </div>
          </div>
        )}

        {/* Condition Photos Upload Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">
              Condition Verification Photos <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400">({photos.length}/2 photos attached)</span>
          </div>

          {photos.length < 2 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSubmitting}
              />
              <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-600 transition-colors mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Click to attach photos of the equipment
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG or WEBP (Max 5MB each, up to 2 photos)
              </p>
            </div>
          )}

          {/* Photo Thumbnails Preview List */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 shadow-xs"
                >
                  <img
                    src={photo.previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] backdrop-blur-xs flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Photo {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Handover Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">
            Return Notes & Included Accessories
          </label>
          <textarea
            id="notes"
            rows={3}
            value={handoverNotes}
            onChange={(e) => setHandoverNotes(e.target.value)}
            placeholder="e.g. Device wiped and cleaned. Original charger and protective sleeve included in perfect working condition."
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-slate-400">
            Mention any cosmetic wear or bundled accessories for the admin inspection desk.
          </p>
        </div>

        {/* Advisory Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <p>
            Submitting this moves the equipment into <strong>Return Inspection</strong>. Once an
            administrator verifies the photos and equipment condition, stock will be automatically
            restored.
          </p>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Submit Return Proof
          </Button>
        </div>
      </form>
    </Modal>
  );
};

