import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  ClipboardCheck,
  ScanEye,
  PackageCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Package,
  Layers,
  ChevronRight,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Product, AssetRequest, User } from "../../types";
import { productService } from "../../api/productService";
import { requestService } from "../../api/requestService";
import { formatImageUrl } from "../../utils/imageUrl";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Button } from "../../components/common/Button";

interface CategoryStat {
  category: string;
  count: number;
  totalStock: number;
  availableStock: number;
}

export const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  // Raw states
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AssetRequest[]>([]);
  const [pendingHandovers, setPendingHandovers] = useState<AssetRequest[]>([]);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [prodRes, reqRes, handRes] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        requestService.getPendingRequests(),
        requestService.getPendingHandovers(),
      ]);

      setProducts(prodRes.products || []);
      setPendingRequests(reqRes || []);
      setPendingHandovers(handRes || []);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

      if (isManual) toast.success("Dashboard metrics updated");
    } catch {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics
  const totalProducts = products.length;
  const totalInventoryUnits = products.reduce((acc, p) => acc + (p.totalStock || 0), 0);
  const totalAvailableUnits = products.reduce((acc, p) => acc + (p.availableStock || 0), 0);
  const totalAllocatedUnits = Math.max(0, totalInventoryUnits - totalAvailableUnits);
  const utilizationPercentage =
    totalInventoryUnits > 0 ? Math.round((totalAllocatedUnits / totalInventoryUnits) * 100) : 0;

  // Category distribution
  const categoryMap: Record<string, CategoryStat> = {};
  products.forEach((p) => {
    const cat = p.category || "Other";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, count: 0, totalStock: 0, availableStock: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].totalStock += p.totalStock || 0;
    categoryMap[cat].availableStock += p.availableStock || 0;
  });
  const categoryStats = Object.values(categoryMap);

  // Critical items (low stock <= 2)
  const lowStockProducts = products.filter((p) => p.availableStock <= 2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dashboard Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            Asset & Equipment Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated metrics on catalog assets, active employee custody, and pending queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] text-slate-400">Updated at {lastRefreshed}</span>
          )}

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <Link to="/admin/products">
            <Button
              variant="secondary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Equipment
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center bg-white rounded-2xl border border-slate-200">
          <LoadingSpinner size="lg" text="Calculating inventory analytics..." />
        </div>
      ) : (
        <>
          {/* Top 5 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Total Catalog Products */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Catalog Items</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900">{totalProducts}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Unique models</span>
              </div>
            </div>

            {/* 2. Total Inventory Units */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Units</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900">{totalInventoryUnits}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {totalAvailableUnits} in warehouse
                </span>
              </div>
            </div>

            {/* 3. In Active Custody */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">In User Custody</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-emerald-700">{totalAllocatedUnits}</span>
                <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
                  {utilizationPercentage}% deployed
                </span>
              </div>
            </div>

            {/* 4. Pending Allocation Approvals */}
            <Link
              to="/admin/requests"
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Approvals</span>
                <div
                  className={`p-2 rounded-xl ${
                    pendingRequests.length > 0
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900">
                    {pendingRequests.length}
                  </span>
                  <span className="text-[11px] text-amber-700 font-medium block mt-0.5">
                    Awaiting review
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
              </div>
            </Link>

            {/* 5. Pending Return Inspections */}
            <Link
              to="/admin/handovers"
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Return Inspections</span>
                <div
                  className={`p-2 rounded-xl ${
                    pendingHandovers.length > 0
                      ? "bg-purple-100 text-purple-800 animate-pulse"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <ScanEye className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900">
                    {pendingHandovers.length}
                  </span>
                  <span className="text-[11px] text-purple-700 font-medium block mt-0.5">
                    Photos to verify
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 transition-colors" />
              </div>
            </Link>
          </div>

          {/* Asset Deployment Utilization Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-semibold flex items-center gap-1.5 text-slate-800">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Enterprise Hardware Utilization
              </span>
              <span className="font-bold text-slate-800">
                {totalAllocatedUnits} of {totalInventoryUnits} units deployed ({utilizationPercentage}%)
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-700"
                style={{ width: `${utilizationPercentage}%` }}
                title={`${totalAllocatedUnits} units actively allocated`}
              />
              <div
                className="bg-slate-200 h-full transition-all duration-700"
                style={{ width: `${100 - utilizationPercentage}%` }}
                title={`${totalAvailableUnits} units available in warehouse`}
              />
            </div>

            <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                In Active Borrower Custody ({totalAllocatedUnits} units)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                Available Warehouse Reserve ({totalAvailableUnits} units)
              </span>
            </div>
          </div>

          {/* Two-Column Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Category Breakdown & Low Stock Watchlist */}
            <div className="lg:col-span-2 space-y-6">
              {/* Category Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Category Inventory Distribution
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryStats.map((cat) => {
                    const pct =
                      cat.totalStock > 0
                        ? Math.round((cat.availableStock / cat.totalStock) * 100)
                        : 0;

                    return (
                      <div
                        key={cat.category}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{cat.category}</span>
                          <span className="text-[11px] text-slate-500">{cat.count} models</span>
                        </div>

                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Available: {cat.availableStock}</span>
                          <span>Total: {cat.totalStock}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Low Stock Watchlist */}
              {lowStockProducts.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Critical Low Stock Watchlist (≤ 2 Available)
                    </h3>
                    <Link
                      to="/admin/products"
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      Manage Stock
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {lowStockProducts.map((p) => (
                      <div
                        key={p.id || p._id}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={formatImageUrl(p.imageUrl)}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.category}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.availableStock === 0
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {p.availableStock === 0 ? "Out of Stock" : `Only ${p.availableStock} left`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Quick Operational Actions & Pending Feed */}
            <div className="space-y-6">
              {/* Quick Action Shortcuts */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-3">
                <h3 className="text-sm font-bold tracking-tight">Administrative Operations</h3>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Jump straight into priority administrative queues to keep asset turnarounds rapid.
                </p>

                <div className="space-y-2 pt-2">
                  <Link
                    to="/admin/requests"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-amber-400" />
                      Process Pending Approvals
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold">
                      {pendingRequests.length}
                    </span>
                  </Link>

                  <Link
                    to="/admin/handovers"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <ScanEye className="w-4 h-4 text-purple-400" />
                      Sign Off Return Handovers
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-400 text-slate-900 text-[10px] font-bold">
                      {pendingHandovers.length}
                    </span>
                  </Link>

                  <Link
                    to="/admin/products"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-emerald-400" />
                      Full Equipment Inventory
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>

              {/* Pending Requests Live Feed Preview */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Recent Pending Requests</h3>
                  <Link
                    to="/admin/requests"
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    View All
                  </Link>
                </div>

                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No pending requests</p>
                ) : (
                  <div className="space-y-2.5">
                    {pendingRequests.slice(0, 3).map((req) => {
                      const user = (req.userId || req.user) as User | undefined;
                      const product = (req.productId || req.product) as Product | undefined;

                      return (
                        <div
                          key={req.id || req._id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-800 block truncate">
                              {product?.name}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block">
                              by {user?.name} ({req.quantity} units)
                            </span>
                          </div>
                          <Link
                            to="/admin/requests"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[10px] hover:bg-emerald-700 shrink-0"
                          >
                            Review
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
