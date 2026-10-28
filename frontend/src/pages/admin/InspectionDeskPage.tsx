import React, { useState, useEffect, useCallback } from "react";
import {
  ScanEye,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  RefreshCw,
  ImageIcon,
  CheckCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import type { AssetRequest, Product, User } from "../../types";
import { requestService } from "../../api/requestService";
import { formatImageUrl } from "../../utils/imageUrl";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { RejectReasonModal } from "../../components/admin/RejectReasonModal";
import { PhotoLightboxModal } from "../../components/admin/PhotoLightboxModal";

export const InspectionDeskPage: React.FC = () => {
  const [handovers, setHandovers] = useState<AssetRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rejection modal state
  const [selectedHandoverForReject, setSelectedHandoverForReject] = useState<AssetRequest | null>(
    null
  );
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

  // Photo lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const fetchHandovers = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await requestService.getPendingHandovers();
      setHandovers(data || []);
      if (isManualRefresh) toast.success("Inspection desk refreshed");
    } catch {
      toast.error("Failed to load pending return handovers");
      setHandovers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHandovers();
  }, [fetchHandovers]);

  const handleApproveHandover = async (req: AssetRequest) => {
    const id = req.id || req._id;
    if (!id) return;

    setProcessingId(id);
    try {
      await requestService.approveHandover(id);
      toast.success("Return verified and approved! Equipment stock automatically restored to catalog.");
      setHandovers((prev) => prev.filter((h) => (h.id || h._id) !== id));
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to approve return handover";
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedHandoverForReject) return;
    const id = selectedHandoverForReject.id || selectedHandoverForReject._id;
    if (!id) return;

    setProcessingId(id);
    try {
      await requestService.rejectHandover(id, { adminRemark: reason });
      toast.success("Return handover rejected. Equipment custody reverted to borrower.");
      setHandovers((prev) => prev.filter((h) => (h.id || h._id) !== id));
      setIsRejectModalOpen(false);
      setSelectedHandoverForReject(null);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to reject return handover";
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const openLightbox = (photos: string[]) => {
    setLightboxPhotos(photos);
    setIsLightboxOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ScanEye className="w-5 h-5 text-indigo-600" />
            Return Inspection Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify condition photos submitted by borrowers. Approving restocks units automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            {handovers.length} Pending {handovers.length === 1 ? "Inspection" : "Inspections"}
          </span>

          <button
            type="button"
            onClick={() => fetchHandovers(true)}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh handovers"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white rounded-xl border border-slate-200">
          <LoadingSpinner size="lg" text="Loading pending return handovers..." />
        </div>
      ) : handovers.length === 0 ? (
        <EmptyState
          icon={<CheckCheck className="w-8 h-8 text-emerald-500" />}
          title="Inspection desk is clear"
          description="There are currently no return handovers awaiting physical inspection."
          actionText="View Equipment Inventory"
          onAction={() => (window.location.href = "/admin/products")}
        />
      ) : (
        <div className="space-y-5">
          {handovers.map((req) => {
            const id = req.id || req._id;
            const user = (req.userId || req.user) as User | undefined;
            const product = (req.productId || req.product) as Product | undefined;
            const isProcessing = processingId === id;

            const formattedDate = req.handoverRequestedAt
              ? new Date(req.handoverRequestedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : new Date(req.updatedAt).toLocaleDateString();

            const photos = req.handoverPhotos || [];

            return (
              <div
                key={id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Details Section */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={formatImageUrl(product?.imageUrl)}
                    alt={product?.name || "Equipment"}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80";
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {product?.category || "Equipment"}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {req.quantity} {req.quantity === 1 ? "unit returned" : "units returned"}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 truncate">
                      {product?.name || "Equipment Item"}
                    </h3>

                    {/* Borrower Profile */}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px] uppercase">
                          {user?.name?.substring(0, 1) || "U"}
                        </div>
                        <span className="font-semibold text-slate-800">{user?.name}</span>
                        <span className="text-slate-400">({user?.email})</span>
                      </div>

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Handover submitted {formattedDate}
                      </span>
                    </div>

                    {/* Return Notes */}
                    {req.handoverNotes && (
                      <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-slate-700 block text-[11px]">
                            Borrower Condition Notes:
                          </strong>
                          <span>"{req.handoverNotes}"</span>
                        </div>
                      </div>
                    )}

                    {/* Condition Proof Photos */}
                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                        Condition Proof Photos ({photos.length} uploaded):
                      </span>

                      {photos.length === 0 ? (
                        <p className="text-xs text-amber-600">No photos attached</p>
                      ) : (
                        <div className="flex items-center gap-3">
                          {photos.map((photoUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => openLightbox(photos)}
                              className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shadow-2xs hover:border-indigo-500 transition-colors"
                              title="Click to view full photo in lightbox"
                            >
                              <img
                                src={formatImageUrl(photoUrl)}
                                alt={`Proof ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                          <span className="text-[11px] text-slate-400 italic">
                            (Click thumbnail to inspect full image)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center lg:flex-col gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end w-full lg:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700"
                    disabled={isProcessing}
                    isLoading={isProcessing}
                    onClick={() => handleApproveHandover(req)}
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                  >
                    Verify Condition & Restock
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    disabled={isProcessing}
                    onClick={() => {
                      setSelectedHandoverForReject(req);
                      setIsRejectModalOpen(true);
                    }}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject Return
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Handover Modal */}
      <RejectReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedHandoverForReject(null);
        }}
        title="Reject Return Handover"
        description="Explain why this equipment cannot be accepted (e.g. damaged casing, missing accessories, or unclear photos). Custody will revert to borrower."
        itemName={(selectedHandoverForReject?.productId as Product)?.name}
        requesterName={((selectedHandoverForReject?.userId || selectedHandoverForReject?.user) as User)?.name}
        onConfirm={handleConfirmReject}
      />

      {/* Full-Res Lightbox Modal */}
      <PhotoLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        photoUrls={lightboxPhotos}
        title="Equipment Return Proof Photo"
      />
    </div>
  );
};
