import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  ClipboardCheck,
  ScanEye,
  ShieldCheck,
} from "lucide-react";

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      label: "Overview",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Equipment Inventory",
      path: "/admin/products",
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      label: "Approval Queue",
      path: "/admin/requests",
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      label: "Return Inspection Desk",
      path: "/admin/handovers",
      icon: <ScanEye className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Subheader & Navigation Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Operations Console</h1>
              <p className="text-xs text-slate-300">
                Manage inventory, approve equipment allocations, and sign off returns.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Links */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Admin Content Area */}
      <div>
        <Outlet />
      </div>
    </div>
  );
};

