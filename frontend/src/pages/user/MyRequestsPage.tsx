import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Calendar,
  Layers,
  XCircle,
  AlertCircle,
  RotateCcw,
  Plus,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import type { AssetRequest, RequestStatus, Product } from "../../types";
import { requestService } from "../../api/requestService";
import { formatImageUrl } from "../../utils/imageUrl";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { HandoverModal } from "../../components/user/HandoverModal";

type FilterTab = "ALL" | RequestStatus;

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Handover modal state
  const [selectedRequestForHandover, setSelectedRequestForHandover] = useState<AssetRequest | null>(
    null
  );
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState<boolean>(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await requestService.getMyRequests();
      setRequests(data || []);
    } catch {
      toast.error("Failed to load your allocation requests");
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCancelRequest = async (id: string) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this pending equipment request?"
    );
    if (!confirmCancel) return;

    setCancellingId(id);
    try {
      await requestService.cancelRequest(id);
      toast.success("Request cancelled successfully");
      // Update local state to reflect cancellation
      setRequests((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, status: "CANCELLED" } : r))
      );
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to cancel request";
      toast.error(errorMsg);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "ALL") return true;
    return req.status === activeTab;
  });

  const getTabCount = (tab: FilterTab) => {
    if (tab === "ALL") return requests.length;
    return requests.filter((r) => r.status === tab).length;
  };

  const tabs: { label: string; value: FilterTab }[] = [
    { label: "All Requests", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Active Custody", value: "APPROVED" },
    { label: "Return Inspection", value: "RETURN_PENDING" },
    { label: "Returned", value: "RETURNED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-emerald-600" />
            My Equipment Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track the status, admin approvals, and return lifecycles of your requested assets.
          </p>
        </div>

        <Link to="/catalog">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            New Allocation Request
          </Button>
        </Link>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {tabs.map((tab) => {
          const count = getTabCount(tab.value);
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading requests history..." />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8 text-slate-400" />}
          title={`No ${activeTab === "ALL" ? "" : activeTab.toLowerCase()} requests found`}
          description={
            activeTab === "ALL"
              ? "You haven't submitted any equipment allocation requests yet."
              : `There are currently no requests with '${activeTab}' status.`
          }
          actionText="Browse Equipment Catalog"
          onAction={() => (window.location.href = "/catalog")}
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const product: Product | undefined =
              typeof req.productId === "object"
                ? req.productId
                : typeof req.product === "object"
                ? req.product
                : undefined;

            const reqId = req.id || req._id;
            const formattedDate = new Date(req.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={reqId}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Product & Request Details */}
                <div className="flex items-start sm:items-center gap-4 flex-1">
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
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {product?.category || "Equipment"}
                      </span>
                      <Badge status={req.status} />
                    </div>

                    <h3 className="font-bold text-base text-slate-900 truncate">
                      {product?.name || "Equipment Item"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {req.quantity} {req.quantity === 1 ? "unit" : "units"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Requested on {formattedDate}
                      </span>
                    </div>

                    {/* Purpose snippet */}
                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      "{req.purpose}"
                    </p>

                    {/* Admin Rejection Callout */}
                    {req.status === "REJECTED" && req.adminRemark && (
                      <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="block font-semibold">Admin Rejection Reason:</strong>
                          <span>{req.adminRemark}</span>
                        </div>
                      </div>
                    )}

                    {/* Return Handover Photos if in inspection or returned */}
                    {req.handoverPhotos && req.handoverPhotos.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Handover Proof:
                        </span>
                        {req.handoverPhotos.map((photoUrl, idx) => (
                          <a
                            key={idx}
                            href={formatImageUrl(photoUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                            title="Click to view full condition photo"
                          >
                            <img
                              src={formatImageUrl(photoUrl)}
                              alt={`Proof ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 p-0.5 bg-black/60 text-white text-[8px]">
                              <ImageIcon className="w-2 h-2" />
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Contextual Action Buttons */}
                <div className="flex md:flex-col items-center md:items-end justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {req.status === "PENDING" && reqId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => handleCancelRequest(reqId)}
                      isLoading={cancellingId === reqId}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Cancel Request
                    </Button>
                  )}

                  {req.status === "APPROVED" && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSelectedRequestForHandover(req);
                        setIsHandoverModalOpen(true);
                      }}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Return Equipment
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Handover Modal */}
      <HandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => {
          setIsHandoverModalOpen(false);
          setSelectedRequestForHandover(null);
        }}
        request={selectedRequestForHandover}
        onSuccess={fetchRequests}
      />
    </div>
  );
};
