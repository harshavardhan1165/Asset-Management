import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { formatImageUrl } from "../../utils/imageUrl";

export interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrls: string[];
  initialIndex?: number;
  title?: string;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  photoUrls,
  initialIndex = 0,
  title = "Handover Condition Photo",
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      } else if (e.key === "ArrowLeft" && photoUrls.length > 1) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photoUrls.length - 1));
      } else if (e.key === "ArrowRight" && photoUrls.length > 1) {
        setCurrentIndex((prev) => (prev < photoUrls.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, photoUrls.length]);

  if (!isOpen || !photoUrls || photoUrls.length === 0) return null;

  const currentPhoto = photoUrls[currentIndex] || photoUrls[0];
  const fullUrl = formatImageUrl(currentPhoto);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
        <div>
          <h3 className="text-sm font-semibold tracking-wide drop-shadow-md">{title}</h3>
          {photoUrls.length > 1 && (
            <span className="text-xs text-slate-300">
              Photo {currentIndex + 1} of {photoUrls.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Open in new tab / download"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close photo preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Photo Container */}
      <div className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2">
        <img
          src={fullUrl}
          alt={`Proof ${currentIndex + 1}`}
          className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
        />

        {/* Previous Button */}
        {photoUrls.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photoUrls.length - 1))}
            className="absolute left-2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors shadow-lg"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {photoUrls.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev < photoUrls.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors shadow-lg"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

