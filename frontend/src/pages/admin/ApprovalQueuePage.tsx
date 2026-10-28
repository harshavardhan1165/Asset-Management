import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  Check,
  XCircle,
  Calendar,
  Layers,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import type { AssetRequest, Product, User } from "../../types";
import { requestService } from "../../api/requestService";
import { formatImageUrl } from "../../utils/imageUrl";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { RejectReasonModal } from "../../components/admin/RejectReasonModal";

export const ApprovalQueuePage: React.FC = () => {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal state
  const [selectedRequestForReject, setSelectedRequestForReject] = useState<AssetRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

  const fetchPendingRequests = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await requestService.getPendingRequests();
      setRequests(data || []);
      if (isManualRefresh) toast.success("Approval queue refreshed");
    } catch {
      toast.error("Failed to load pending requests");
      setRequests([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleApprove = async (req: AssetRequest) => {
    const id = req.id || req._id;
    if (!id) return;

    setProcessingId(id);
    try {
      await requestService.approveRequest(id);
      toast.success("Request approved! Catalog stock has been atomically allocated.");
      // Optimistically remove from pending queue
      setRequests((prev) => prev.filter((r) => (r.id || r._id) !== id));
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to approve request";
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedRequestForReject) return;
    const id = selectedRequestForReject.id || selectedRequestForReject._id;
    if (!id) return;

    setProcessingId(id);
    try {
      await requestService.rejectRequest(id, { adminRemark: reason });
      toast.success("Request rejected with explanation remark");
      setRequests((prev) => prev.filter((r) => (r.id || r._id) !== id));
      setIsRejectModalOpen(false);
      setSelectedRequestForReject(null);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to reject request";
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            Allocation Approval Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review borrower requests. Approving atomically deducts available stock with overdraft protection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {requests.length} Pending {requests.length === 1 ? "Request" : "Requests"}
          </span>

          <button
            type="button"
            onClick={() => fetchPendingRequests(true)}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white rounded-xl border border-slate-200">
          <LoadingSpinner size="lg" text="Loading pending requests..." />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
          title="All caught up! Queue is empty"
          description="There are currently no allocation requests awaiting administrator approval."
          actionText="View Equipment Inventory"
          onAction={() => (window.location.href = "/admin/products")}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const id = req.id || req._id;
            const user = (req.userId || req.user) as User | undefined;
            const product = (req.productId || req.product) as Product | undefined;

            const isProcessing = processingId === id;
            const availableStock = product?.availableStock ?? 0;
            const isStockSufficient = availableStock >= req.quantity;

            const formattedDate = new Date(req.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left Area: Requester & Equipment Info */}
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
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {product?.category || "Equipment"}
                      </span>

                      {isStockSufficient ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Stock Available ({availableStock} units)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock ({availableStock} avail)
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 truncate">
                      {product?.name || "Equipment Item"}
                    </h3>

                    {/* Requester Profile */}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase">
                          {user?.name?.substring(0, 1) || "U"}
                        </div>
                        <span className="font-semibold text-slate-800">{user?.name}</span>
                        <span className="text-slate-400">({user?.email})</span>
                      </div>

                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Requested: <strong className="text-slate-800">{req.quantity} units</strong>
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Purpose */}
                    <div className="mt-2.5">
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        "{req.purpose}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Area: Action Buttons */}
                <div className="flex items-center lg:flex-col gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700"
                    disabled={isProcessing || !isStockSufficient}
                    isLoading={isProcessing}
                    onClick={() => handleApprove(req)}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Approve Allocation
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    disabled={isProcessing}
                    onClick={() => {
                      setSelectedRequestForReject(req);
                      setIsRejectModalOpen(true);
                    }}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject Request
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      <RejectReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedRequestForReject(null);
        }}
        title="Reject Allocation Request"
        description="Provide a clear explanation for rejecting this request. The borrower will see this remark."
        itemName={(selectedRequestForReject?.productId as Product)?.name}
        requesterName={((selectedRequestForReject?.userId || selectedRequestForReject?.user) as User)?.name}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
};
