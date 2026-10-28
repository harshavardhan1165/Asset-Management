import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { Button } from "../../components/common/Button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-6">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="mt-2 text-lg font-semibold text-slate-800">Page Not Found</h2>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6">
        <Link to="/catalog">
          <Button variant="primary">Back to Catalog</Button>
        </Link>
      </div>
    </div>
  );
};

