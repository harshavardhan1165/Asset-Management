import React from "react";
import type { RequestStatus, UserRole } from "../../types";

export interface BadgeProps {
  status?: RequestStatus;
  role?: UserRole;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "purple";
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  role,
  variant,
  children,
  className = "",
}) => {
  let badgeStyles = "bg-slate-100 text-slate-700 border-slate-200";
  let label = children;

  if (status) {
    switch (status) {
      case "PENDING":
        badgeStyles = "bg-amber-50 text-amber-700 border-amber-200";
        label = label || "Pending Approval";
        break;
      case "APPROVED":
        badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-200";
        label = label || "Approved (In Custody)";
        break;
      case "REJECTED":
        badgeStyles = "bg-rose-50 text-rose-700 border-rose-200";
        label = label || "Rejected";
        break;
      case "RETURN_PENDING":
        badgeStyles = "bg-purple-50 text-purple-700 border-purple-200";
        label = label || "Return Pending Inspection";
        break;
      case "CANCELLED":
        badgeStyles = "bg-slate-100 text-slate-500 border-slate-200";
        label = label || "Cancelled";
        break;
      case "RETURNED":
        badgeStyles = "bg-slate-100 text-slate-600 border-slate-300";
        label = label || "Returned & Restocked";
        break;
    }
  } else if (role) {
    switch (role) {
      case "ADMIN":
        badgeStyles = "bg-indigo-50 text-indigo-700 border-indigo-200";
        label = label || "Admin";
        break;
      case "USER":
        badgeStyles = "bg-slate-100 text-slate-700 border-slate-200";
        label = label || "Standard User";
        break;
    }
  } else if (variant) {
    switch (variant) {
      case "success":
        badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
      case "warning":
        badgeStyles = "bg-amber-50 text-amber-700 border-amber-200";
        break;
      case "danger":
        badgeStyles = "bg-rose-50 text-rose-700 border-rose-200";
        break;
      case "info":
        badgeStyles = "bg-sky-50 text-sky-700 border-sky-200";
        break;
      case "purple":
        badgeStyles = "bg-purple-50 text-purple-700 border-purple-200";
        break;
      case "neutral":
      default:
        badgeStyles = "bg-slate-100 text-slate-700 border-slate-200";
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles} ${className}`}
    >
      {label}
    </span>
  );
};
