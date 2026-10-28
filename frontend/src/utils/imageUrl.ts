const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000";

export function formatImageUrl(url?: string): string {
  if (!url) {
    return "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80"; // Fallback tech placeholder
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If local upload path (e.g., /uploads/image.png or uploads/image.png)
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${UPLOADS_BASE}${normalizedPath}`;
}

