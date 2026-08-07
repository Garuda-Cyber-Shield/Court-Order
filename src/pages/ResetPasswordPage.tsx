import { useState } from "react";
import { LockOpen, CheckCircle2, Lock, Eye, EyeOff, XCircle, ArrowLeft } from 'lucide-react';

const API_BASE = "/api";

interface ResetPasswordPageProps {
  email: string;
  onBackToLogin: () => void;
}

export default function ResetPasswordPage({ email, onBackToLogin }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Reset failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-10">
      {/* Floating background light accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glowing border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-2xl blur-sm opacity-35" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-blue-900/90 px-8 py-7 text-center border-b border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-3 drop-shadow-2xl relative flex items-center justify-center">
                <img
                  src="/Logo.png"
                  alt="GCS Logo"
                  className="w-full h-full object-contain rounded-full ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-emerald-600 to-teal-600 p-1.5 rounded-full ring-2 ring-slate-800 shadow-md">
                  <LockOpen className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                Set New Password
              </h1>
              <p className="text-emerald-200/80 text-xs sm:text-sm mt-1.5 font-medium">
                Admin approved! Create your new secure password
              </p>
            </div>
          </div>

          <div className="p-8 space-y-5">
            {success ? (
              <div className="text-center space-y-5 py-2">
                <div className="w-20 h-20 mx-auto bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Password Reset Complete!</h2>
                  <p className="text-slate-400 text-sm mt-1">Your password has been successfully updated.</p>
                </div>
                <button
                  onClick={onBackToLogin}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base sm:text-lg rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99]"
                >
                  Proceed to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                {error && (
                  <div className="bg-red-900/40 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2.5 shadow-sm">
                    <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="bg-slate-900/50 border border-slate-700/70 rounded-xl p-3 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Resetting password for:</span>
                  <span className="text-emerald-300 font-semibold truncate max-w-[200px]">{email}</span>
                </div>

                <div>
                  <label className="block text-emerald-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-400" /> New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-emerald-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-400" /> Confirm New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-inner ${confirmPassword && confirmPassword !== newPassword ? "border-red-500 focus:ring-red-500" : "border-slate-600 focus:ring-emerald-500"}`}
                    required
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      ⚠️ Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white font-bold text-base sm:text-lg rounded-xl hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 transition-all shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </div>
                  ) : (
                    <>
                      <LockOpen className="w-5 h-5" /> Set New Password
                    </>
                  )}
                </button>

                <div className="text-center pt-2 border-t border-slate-700/30">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors text-sm py-1 px-3 rounded-lg hover:bg-slate-700/30"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

