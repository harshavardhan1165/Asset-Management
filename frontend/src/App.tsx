import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Pages
import { CatalogPage } from "./pages/catalog/CatalogPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { MyRequestsPage } from "./pages/user/MyRequestsPage";
import { ActiveCustodyPage } from "./pages/user/ActiveCustodyPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { ProductManagementPage } from "./pages/admin/ProductManagementPage";
import { ApprovalQueuePage } from "./pages/admin/ApprovalQueuePage";
import { InspectionDeskPage } from "./pages/admin/InspectionDeskPage";
import { NotFoundPage } from "./pages/common/NotFoundPage";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              padding: "0.75rem 1rem",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#ffffff",
              },
            },
          }}
        />

        <Routes>
          {/* Main App Layout */}
          <Route element={<AppLayout />}>
            {/* Public Catalog */}
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            <Route path="/catalog" element={<CatalogPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/my-requests" element={<MyRequestsPage />} />
              <Route path="/my-assets" element={<ActiveCustodyPage />} />
            </Route>

            {/* Admin-Only Portal */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="products" element={<ProductManagementPage />} />
                <Route path="requests" element={<ApprovalQueuePage />} />
                <Route path="handovers" element={<InspectionDeskPage />} />
              </Route>
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  );
}
