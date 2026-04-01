import { useState } from "react";

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
        setError(data.error || "Reset failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-green-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 rounded-2xl blur-sm opacity-25" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800/80 to-green-800/80 px-8 py-8 text-center border-b border-emerald-700/30">
            <div className="w-16 h-16 bg-emerald-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-emerald-500/30">
              <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">🔓 Reset Password</h1>
            <p className="text-emerald-300/70 text-sm mt-2">Admin approved! Set your new password</p>
          </div>

          <div className="p-8">
            {success ? (
              <div className="text-center space-y-5">
                <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-xl font-bold text-white">Password Reset Successful!</h2>
                <p className="text-slate-400">You can now login with your new password.</p>
                <button
                  onClick={onBackToLogin}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-lg rounded-xl hover:from-emerald-500 hover:to-green-500 transition-all shadow-xl"
                >
                  → Go to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                {error && (
                  <div className="bg-red-900/40 border border-red-500/50 rounded-lg px-4 py-3 text-red-300 text-sm flex items-center gap-2">
                    <span>❌</span> {error}
                  </div>
                )}

                <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-3 text-sm">
                  <span className="text-slate-400">Resetting for: </span>
                  <span className="text-blue-300 font-semibold">{email}</span>
                </div>

                <div>
                  <label className="block text-emerald-300 text-sm font-medium mb-2">🔒 New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-emerald-300 text-sm font-medium mb-2">🔒 Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${confirmPassword && confirmPassword !== newPassword ? "border-red-500 focus:ring-red-500" : "border-slate-600 focus:ring-emerald-500"}`}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-400 text-xs mt-1.5">⚠️ Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-lg rounded-xl hover:from-emerald-500 hover:to-green-500 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>🔓 Set New Password</>
                  )}
                </button>

                <div className="text-center">
                  <button type="button" onClick={onBackToLogin} className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 transition-colors">
                    ← Back to Login
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
