import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, X, Save, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { productService } from "../../api/productService";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { formatImageUrl } from "../../utils/imageUrl";

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null; // If provided, edit mode; else create mode
  onSuccess: () => void;
}

const DEFAULT_CATEGORIES = [
  "Laptops",
  "Monitors",
  "Cameras",
  "Lab Tools",
  "Audio Equipment",
  "Keyboards & Mice",
  "Mobile Devices",
  "Furniture & Desks",
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const isEditMode = !!product;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Laptops");
  const [description, setDescription] = useState("");
  const [totalStock, setTotalStock] = useState<number>(5);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name || "");
        setCategory(product.category || "Laptops");
        setDescription(product.description || "");
        setTotalStock(product.totalStock || 1);
        setImagePreview(product.imageUrl ? formatImageUrl(product.imageUrl) : "");
        setImageUrlInput(product.imageUrl?.startsWith("http") ? product.imageUrl : "");
        setImageFile(null);
      } else {
        setName("");
        setCategory("Laptops");
        setDescription("");
        setTotalStock(5);
        setImageFile(null);
        setImagePreview("");
        setImageUrlInput("");
      }
    }
  }, [isOpen, product]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview("");
    setImageUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Product description is required");
      return;
    }
    if (totalStock < 0) {
      toast.error("Total stock cannot be negative");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("description", description.trim());
      formData.append("totalStock", totalStock.toString());

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imageUrlInput.trim()) {
        formData.append("imageUrl", imageUrlInput.trim());
      }

      if (isEditMode) {
        const id = product.id || product._id;
        await productService.updateProduct(id!, formData);
        toast.success("Equipment item updated successfully!");
      } else {
        await productService.createProduct(formData);
        toast.success("New equipment item added to catalog!");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save equipment. Please verify your inputs.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Equipment: ${product.name}` : "Add New Equipment"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Equipment Name */}
        <Input
          label="Equipment Name"
          placeholder="e.g. MacBook Pro 16 M3 Max"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Category & Stock Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Total Inventory Units"
            type="number"
            min={0}
            value={totalStock}
            onChange={(e) => setTotalStock(parseInt(e.target.value, 10) || 0)}
            helperText={
              isEditMode ? "Available units will adjust automatically" : "Initial stock available"
            }
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Technical Specifications & Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 16-Core CPU, 48GB Unified RAM, 1TB SSD. Includes 140W USB-C power adapter."
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            required
          />
        </div>

        {/* Product Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Equipment Photo</label>

          {imagePreview ? (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 flex items-center gap-1 shadow-md"
                >
                  <X className="w-4 h-4" /> Remove Photo
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-indigo-600 transition-colors mb-2" />
              <p className="text-xs font-semibold text-slate-700">Click to upload product image</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG or WEBP (Max 5MB)</p>
            </div>
          )}

          {/* Or external URL */}
          {!imageFile && (
            <div className="mt-2.5">
              <Input
                placeholder="Or paste external image URL (https://...)"
                value={imageUrlInput}
                onChange={(e) => {
                  setImageUrlInput(e.target.value);
                  if (e.target.value.startsWith("http")) {
                    setImagePreview(e.target.value);
                  }
                }}
                leftIcon={<ImageIcon className="w-4 h-4" />}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="secondary"
            className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditMode ? "Save Changes" : "Create Equipment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

