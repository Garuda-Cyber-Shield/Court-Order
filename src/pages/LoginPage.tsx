import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  onLoginSuccess: () => void;
  onPending: () => void;
  onBanned: () => void;
}

export default function LoginPage({ onSwitchToSignup, onForgotPassword, onLoginSuccess, onPending, onBanned }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else if (result.errorType === "PENDING") {
      onPending();
    } else if (result.errorType === "BANNED") {
      onBanned();
    } else {
      setError(result.error || "Login failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-10">
      {/* Floating animated shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glowing card border effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-sm opacity-30" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800/80 to-indigo-800/80 px-8 py-8 text-center border-b border-blue-700/30">
            <div className="w-24 h-24 mx-auto mb-4 drop-shadow-2xl">
              <img src="/Logo.png" alt="GCS Logo" className="w-full h-full object-contain rounded-full ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">GCS Login</h1>
            <p className="text-blue-300/70 text-sm mt-2">Sign in to access Court Order Generator</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-900/40 border border-red-500/50 rounded-lg px-4 py-3 text-red-300 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors flex items-center gap-1"
              >
                <KeyRound className="w-4 h-4" /> Forgot Password?
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-slate-400 text-sm">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </div>

            {/* PWA Install Link - Small for Mobile */}
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('triggerPwaInstall'))}
                className="text-[10px] sm:text-xs text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] font-medium border-t border-slate-700/30 pt-4 w-full"
              >
                Install GCS App
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
