import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const loggedInUser = await login({ email: email.trim(), password });
      toast.success(`Welcome back, ${loggedInUser.name}!`);

      // Determine redirection target
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      if (from && from !== "/login" && from !== "/register") {
        navigate(from, { replace: true });
      } else if (loggedInUser.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/catalog", { replace: true });
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid email or password. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-6 sm:my-10 animate-scale-up">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-900 px-6 py-8 text-center text-white relative">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Sign In to AssetFlow</h2>
          <p className="text-xs text-slate-300 mt-1">
            Access your company equipment allocation and custody portal
          </p>
        </div>

        {/* Currently Signed-In Banner */}
        {isAuthenticated && user && (
          <div className="bg-emerald-50 border-b border-emerald-200/80 p-3.5 flex items-center justify-between text-xs text-emerald-900">
            <div>
              <p className="font-semibold">Currently signed in as: {user.name}</p>
              <p className="text-emerald-700 text-[11px]">{user.email} ({user.role})</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={user.role === "ADMIN" ? "/admin/dashboard" : "/catalog"}
                className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800 font-semibold hover:bg-emerald-100"
              >
                Go to Portal
              </Link>
              <button
                type="button"
                onClick={logout}
                className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-semibold hover:bg-rose-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="e.g. name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>

          <div className="pt-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New team member?{" "}
              <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
                Register an account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
