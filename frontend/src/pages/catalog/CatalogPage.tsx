import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  X,
  Filter,
  Boxes,
  Layers,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { productService } from "../../api/productService";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { ProductCard } from "../../components/catalog/ProductCard";
import { RequestModal } from "../../components/catalog/RequestModal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { Button } from "../../components/common/Button";

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const CatalogPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter & Search states
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce<string>(searchInput, 400);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  // Fetch dynamic categories from backend
  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setAvailableCategories(cats);
        }
      })
      .catch(() => {
        setAvailableCategories(["Laptops", "Monitors", "Cameras", "Lab Tools", "Audio Equipment"]);
      });
  }, []);

  // Fetch products callback
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts({
        search: debouncedSearch.trim() || undefined,
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        inStock: inStockOnly ? "true" : undefined,
        page,
        limit: 12,
      });

      // Handle backend response data
      const items = data.products || [];
      setProducts(items);
      setPagination(data.pagination || null);
    } catch {
      toast.error("Failed to load catalog products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, inStockOnly, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, inStockOnly]);

  const handleRequestClick = (product: Product) => {
    if (!isAuthenticated) {
      toast("Please sign in to request equipment", { icon: "🔒" });
      navigate("/login", { state: { from: location } });
      return;
    }

    setSelectedProduct(product);
    setIsRequestModalOpen(true);
  };

  const handleRequestSuccess = () => {
    fetchProducts();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-4">
            <Boxes className="w-4 h-4" />
            <span>Equipment Allocation Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Reserve Hardware & IT Equipment
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Browse our verified inventory of developer laptops, monitors, accessories, and lab
            equipment. Request allocations with real-time stock verification.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search equipment by name or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* In-Stock Only Toggle & Reset */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>In-Stock Only</span>
            </label>

            {(debouncedSearch || selectedCategory !== "ALL" || inStockOnly) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  setSearchInput("");
                  setSelectedCategory("ALL");
                  setInStockOnly(false);
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Items</span>
          </button>

          {availableCategories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Showing{" "}
          <strong className="text-slate-800">{pagination?.total || products.length}</strong> items
          found
        </span>
        {pagination && pagination.pages > 1 && (
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
        )}
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading equipment catalog..." />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-8 h-8 text-slate-400" />}
          title="No equipment found"
          description="Try modifying your search keywords or clearing the category filter."
          actionText="Clear All Filters"
          onAction={() => {
            setSearchInput("");
            setSelectedCategory("ALL");
            setInStockOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id || product._id || product.name}
              product={product}
              onRequest={handleRequestClick}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <span className="text-xs font-medium text-slate-600">
            Page {pagination.page} of {pagination.pages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => setPage((prev) => prev + 1)}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        </div>
      )}

      {/* Allocation Request Modal */}
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
};
