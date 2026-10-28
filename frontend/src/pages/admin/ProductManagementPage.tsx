import React, { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  Plus,
  Search,
  X,
  Sliders,
  Edit2,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { productService } from "../../api/productService";
import { useDebounce } from "../../hooks/useDebounce";
import { formatImageUrl } from "../../utils/imageUrl";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ProductFormModal } from "../../components/admin/ProductFormModal";
import { StockAdjustmentModal } from "../../components/admin/StockAdjustmentModal";
import { ProductHoldersModal } from "../../components/admin/ProductHoldersModal";
import { DeleteProductModal } from "../../components/admin/DeleteProductModal";

export const ProductManagementPage: React.FC = () => {
  // Search & Filters
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce<string>(searchInput, 400);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);

  const [isHoldersModalOpen, setIsHoldersModalOpen] = useState<boolean>(false);
  const [selectedProductForHolders, setSelectedProductForHolders] = useState<Product | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedProductForDelete, setSelectedProductForDelete] = useState<Product | null>(null);

  // Load categories
  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch(() => {
        setCategories(["Laptops", "Monitors", "Cameras", "Lab Tools", "Audio Equipment"]);
      });
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts({
        search: debouncedSearch.trim() || undefined,
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        page,
        limit: 10,
      });

      setProducts(data.products || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load inventory equipment");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            Equipment Inventory Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create equipment items, edit specifications, adjust stock bounds, and inspect active holders.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            setEditingProduct(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Equipment
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search inventory by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-400 ml-2">Total: {totalCount} items</span>
        </div>
      </div>

      {/* Main Table View */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white rounded-xl border border-slate-200">
          <LoadingSpinner size="lg" text="Loading equipment inventory..." />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-8 h-8 text-slate-400" />}
          title="No inventory records found"
          description="Try adjusting your search criteria or add a new equipment item."
          actionText="Add New Equipment"
          onAction={() => {
            setEditingProduct(null);
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Stock Breakdown</th>
                  <th className="px-4 py-3 text-center">Availability Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const borrowed = p.totalStock - p.availableStock;
                  const isOutOfStock = p.availableStock <= 0;
                  const isLowStock = p.availableStock > 0 && p.availableStock <= 2;

                  return (
                    <tr key={p.id || p._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={formatImageUrl(p.imageUrl)}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80";
                            }}
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-slate-800 block truncate">{p.name}</span>
                            <span className="text-[11px] text-slate-400 block line-clamp-1">
                              {p.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category}
                        </span>
                      </td>

                      {/* Stock Breakdown */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 font-mono text-xs">
                          <span className="text-emerald-700 font-bold" title="Available Units">
                            {p.availableStock} avail
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-600 font-medium" title="Total Units">
                            {p.totalStock} total
                          </span>
                          {borrowed > 0 && (
                            <span
                              className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]"
                              title="Currently in User Custody"
                            >
                              ({borrowed} borrowed)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Availability Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Low Stock ({p.availableStock} left)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Active Holders */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForHolders(p);
                              setIsHoldersModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Active Holders"
                          >
                            <Users className="w-4 h-4" />
                          </button>

                          {/* Quick Adjust Stock */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForStock(p);
                              setIsStockModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Adjust Inventory Stock"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Equipment Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Product */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForDelete(p);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages} ({totalCount} total items)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSuccess={fetchProducts}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedProductForStock(null);
        }}
        product={selectedProductForStock}
        onSuccess={fetchProducts}
      />

      {/* Active Borrowers Modal */}
      <ProductHoldersModal
        isOpen={isHoldersModalOpen}
        onClose={() => {
          setIsHoldersModalOpen(false);
          setSelectedProductForHolders(null);
        }}
        product={selectedProductForHolders}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProductForDelete(null);
        }}
        product={selectedProductForDelete}
        onSuccess={fetchProducts}
      />
    </div>
  );
};
