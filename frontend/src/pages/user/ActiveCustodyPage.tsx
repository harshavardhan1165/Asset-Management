import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PackageCheck,
  Calendar,
  Layers,
  ArrowRight,
  RotateCcw,
  Clock,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import type { AssetRequest, Product } from "../../types";
import { requestService } from "../../api/requestService";
import { formatImageUrl } from "../../utils/imageUrl";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { HandoverModal } from "../../components/user/HandoverModal";

export const ActiveCustodyPage: React.FC = () => {
  const [assets, setAssets] = useState<AssetRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal state for handover
  const [selectedAsset, setSelectedAsset] = useState<AssetRequest | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState<boolean>(false);

  const fetchOwnedAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await requestService.getOwnedAssets();
      setAssets(data || []);
    } catch {
      toast.error("Failed to load active custody equipment");
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwnedAssets();
  }, [fetchOwnedAssets]);

  const handleReturnClick = (asset: AssetRequest) => {
    setSelectedAsset(asset);
    setIsHandoverModalOpen(true);
  };

  const handleHandoverSuccess = () => {
    fetchOwnedAssets();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <PackageCheck className="w-7 h-7 text-emerald-600" />
            Active Equipment Custody
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hardware, tools, and accessories currently allocated and in your possession.
          </p>
        </div>

        <Link to="/catalog">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Request More Equipment
          </Button>
        </Link>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading active custody equipment..." />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<PackageCheck className="w-8 h-8 text-slate-400" />}
          title="No equipment currently in your custody"
          description="You do not have any active hardware allocations at this time. Browse our equipment catalog to request laptops, monitors, or tools."
          actionText="Browse Equipment Catalog"
          onAction={() => (window.location.href = "/catalog")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const product: Product | undefined =
              typeof asset.productId === "object"
                ? asset.productId
                : typeof asset.product === "object"
                ? asset.product
                : undefined;

            const isPendingReturn = asset.status === "RETURN_PENDING";
            const formattedDate = asset.approvedAt
              ? new Date(asset.approvedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : new Date(asset.createdAt).toLocaleDateString();

            return (
              <div
                key={asset.id || asset._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Product Image Header */}
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  <img
                    src={formatImageUrl(product?.imageUrl)}
                    alt={product?.name || "Equipment"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/95 text-slate-800 shadow-sm border border-slate-200/50">
                      {product?.category || "Equipment"}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge status={asset.status} />
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                      {product?.name || "Allocated Equipment"}
                    </h3>

                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Quantity Allocated
                        </span>
                        <span className="font-semibold text-slate-800">
                          {asset.quantity} {asset.quantity === 1 ? "unit" : "units"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Allocated On
                        </span>
                        <span className="font-medium text-slate-700">{formattedDate}</span>
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-400 block mb-0.5">Assigned Purpose:</span>
                        <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                          "{asset.purpose}"
                        </p>
                      </div>
                    </div>

                    {/* Return Under Inspection Banner */}
                    {isPendingReturn && (
                      <div className="mt-3 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Return photos submitted. Awaiting physical admin verification.</span>
                      </div>
                    )}

                    {/* Attached Return Photo Previews if available */}
                    {asset.handoverPhotos && asset.handoverPhotos.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                          Attached Proof Photos:
                        </span>
                        <div className="flex items-center gap-2">
                          {asset.handoverPhotos.map((photoUrl, idx) => (
                            <a
                              key={idx}
                              href={formatImageUrl(photoUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                              title="Click to view full photo"
                            >
                              <img
                                src={formatImageUrl(photoUrl)}
                                alt={`Proof ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 right-0 p-0.5 bg-black/60 text-white text-[8px] rounded-tl">
                                <ImageIcon className="w-2.5 h-2.5" />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    {isPendingReturn ? (
                      <Button variant="outline" className="w-full text-xs" size="sm" disabled>
                        Return Pending Sign-Off
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full text-xs"
                        size="md"
                        onClick={() => handleReturnClick(asset)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Initiate Equipment Return
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Handover Modal */}
      <HandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => {
          setIsHandoverModalOpen(false);
          setSelectedAsset(null);
        }}
        request={selectedAsset}
        onSuccess={handleHandoverSuccess}
      />
    </div>
  );
};
