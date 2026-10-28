import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Shield, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import type { UserRole } from "../../types";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your work email");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      toast.success(`Account created! Welcome, ${newUser.name}`);
      if (newUser.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/catalog", { replace: true });
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed. An account with this email may already exist.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-6 sm:my-10 animate-scale-up">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-8 text-center text-white">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Create an Account</h2>
          <p className="text-xs text-slate-300 mt-1">
            Register to request and manage company equipment
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Work Email"
            type="email"
            placeholder="e.g. alex@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div className="relative">
            <Input
              label="Password (min. 6 characters)"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Account Role Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("USER")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  role === "USER"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20 font-semibold"
                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Borrower</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  role === "ADMIN"
                    ? "border-indigo-500 bg-indigo-50/50 text-indigo-800 ring-2 ring-indigo-500/20 font-semibold"
                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Administrator</span>
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {role === "ADMIN"
                ? "Admin role grants permissions to approve requests and manage inventory."
                : "Standard role enables browsing catalog and requesting equipment."}
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-4"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account
          </Button>

          <div className="pt-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
