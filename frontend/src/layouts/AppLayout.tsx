import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AssetFlow. Enterprise Equipment & Asset Allocation Management.</p>
          <div className="flex items-center gap-6">
            <span>Status: Connected to API</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

