import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  ClipboardList,
  ShieldCheck,
  PackageCheck,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Badge } from "../components/common/Badge";
import { useClickOutside } from "../hooks/useClickOutside";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsProfileDropdownOpen(false));

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/catalog" && (location.pathname === "/" || location.pathname === "/catalog")) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive(path)
        ? "bg-emerald-50 text-emerald-700"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  const mobileNavLinkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 text-base font-medium rounded-lg transition-colors ${
      isActive(path)
        ? "bg-emerald-50 text-emerald-700 font-semibold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/catalog" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                  Asset<span className="text-emerald-600">Flow</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Equipment Desk
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Link to="/catalog" className={navLinkClass("/catalog")}>
                <Boxes className="w-4 h-4" />
                <span>Catalog</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link to="/my-requests" className={navLinkClass("/my-requests")}>
                    <ClipboardList className="w-4 h-4" />
                    <span>My Requests</span>
                  </Link>

                  <Link to="/my-assets" className={navLinkClass("/my-assets")}>
                    <PackageCheck className="w-4 h-4" />
                    <span>Active Custody</span>
                  </Link>
                </>
              )}

              {isAuthenticated && user?.role === "ADMIN" && (
                <Link to="/admin/dashboard" className={navLinkClass("/admin")}>
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-indigo-900 font-semibold">Admin Portal</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Area: Auth or Profile */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.substring(0, 2)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">{user.email}</span>
                  </div>
                  <Badge role={user.role} className="ml-1" />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-scale-up">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                    </div>

                    {user.role === "ADMIN" && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/catalog"
            onClick={() => setIsMobileMenuOpen(false)}
            className={mobileNavLinkClass("/catalog")}
          >
            <Boxes className="w-5 h-5" />
            <span>Catalog</span>
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/my-requests"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass("/my-requests")}
              >
                <ClipboardList className="w-5 h-5" />
                <span>My Requests</span>
              </Link>

              <Link
                to="/my-assets"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass("/my-assets")}
              >
                <PackageCheck className="w-5 h-5" />
                <span>Active Custody</span>
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "ADMIN" && (
            <Link
              to="/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileNavLinkClass("/admin")}
            >
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Admin Portal</span>
            </Link>
          )}

          <div className="pt-4 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    {user.name.substring(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg shadow-sm"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
