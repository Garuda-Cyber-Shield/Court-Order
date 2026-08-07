import { useState } from "react";
import { KeyRound, XCircle, CheckCircle2, Mail, Send, Hourglass, RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';

const API_BASE = "/api";

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  onResetApproved: (email: string) => void;
}

export default function ForgotPasswordPage({ onBackToLogin, onResetApproved }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Request failed. Please try again.");
      } else {
        if (data.canReset) {
          onResetApproved(email.trim());
        } else {
          setMessage(data.message);
          setRequestSent(true);
        }
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setError("");
    setMessage("");
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE}/auth/check-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.canReset) {
        onResetApproved(email.trim());
      } else {
        setMessage(data.message || "Still waiting for admin approval...");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-10">
      {/* Floating background light accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glowing card border effect matching GCS LoginPage */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-sm opacity-35" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header synced with GCS Project UI */}
          <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 px-8 py-7 text-center border-b border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-3 drop-shadow-2xl relative flex items-center justify-center">
                <img
                  src="/Logo.png"
                  alt="GCS Logo"
                  className="w-full h-full object-contain rounded-full ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-full ring-2 ring-slate-800 shadow-md">
                  <KeyRound className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                Forgot Password
              </h1>
              <p className="text-blue-200/80 text-xs sm:text-sm mt-1.5 font-medium">
                {requestSent
                  ? "Request submitted — check status below"
                  : "Submit your registered email to request a reset"}
              </p>
            </div>
          </div>

          <div className="p-8 space-y-5">
            {error && (
              <div className="bg-red-900/40 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2.5 shadow-sm">
                <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="bg-emerald-900/40 border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-300 text-sm flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{message}</span>
              </div>
            )}

            {!requestSent ? (
              <form onSubmit={handleSubmitRequest} className="space-y-5">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-400" /> Your Official Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* How it works visually polished section */}
                <div className="bg-slate-900/50 border border-slate-700/70 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> How It Works
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        1
                      </span>
                      <span>Submit your registered email to request password recovery.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        2
                      </span>
                      <span>Admin reviews and approves your reset request.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        3
                      </span>
                      <span>Once approved, you can set a new password.</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-base sm:text-lg rounded-xl hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 transition-all shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Request...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Submit Reset Request
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="bg-slate-900/60 border border-blue-500/30 rounded-xl p-5 text-center space-y-3 relative overflow-hidden">
                  <div className="w-12 h-12 mx-auto bg-blue-500/20 border border-blue-500/40 rounded-full flex items-center justify-center text-blue-400">
                    <Hourglass className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">Waiting for Admin Approval</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Reset requested for: <span className="text-blue-300 font-medium">{email}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCheckStatus}
                  disabled={checking}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {checking ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Checking Status...</span>
                    </div>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" /> Check Approval Status
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="text-center pt-2 border-t border-slate-700/30">
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors text-sm py-1 px-3 rounded-lg hover:bg-slate-700/30"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

