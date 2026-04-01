import { useState } from "react";

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

    if (!email.trim()) { setError("Please enter your email."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Request failed.");
      } else {
        if (data.canReset) {
          onResetApproved(email.trim());
        } else {
          setMessage(data.message);
          setRequestSent(true);
        }
      }
    } catch {
      setError("Network error.");
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
      setError("Network error.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-orange-600/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-600 rounded-2xl blur-sm opacity-25" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-800/80 to-amber-800/80 px-8 py-8 text-center border-b border-orange-700/30">
            <div className="w-16 h-16 bg-orange-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-orange-500/30">
              <svg className="w-8 h-8 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">🔑 Forgot Password</h1>
            <p className="text-orange-300/70 text-sm mt-2">
              {requestSent ? "Request submitted — check status below" : "Enter your email to request a password reset"}
            </p>
          </div>

          <div className="p-8 space-y-5">
            {error && (
              <div className="bg-red-900/40 border border-red-500/50 rounded-lg px-4 py-3 text-red-300 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </div>
            )}
            {message && (
              <div className="bg-emerald-900/40 border border-emerald-500/50 rounded-lg px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
                <span>✅</span> {message}
              </div>
            )}

            {!requestSent ? (
              <form onSubmit={handleSubmitRequest} className="space-y-5">
                <div>
                  <label className="block text-blue-300 text-sm font-medium mb-2">📧 Your Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-4 text-amber-200/70 text-sm">
                  <p>⚠️ <strong>How it works:</strong></p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                    <li>Submit your email to request a reset</li>
                    <li>Admin must approve your request</li>
                    <li>Once approved, you can set a new password</li>
                  </ol>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-lg rounded-xl hover:from-orange-500 hover:to-amber-500 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>📨 Submit Reset Request</>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-5 text-center">
                  <div className="text-4xl mb-3">⏳</div>
                  <p className="text-white font-semibold mb-1">Waiting for Admin Approval</p>
                  <p className="text-slate-400 text-sm">Email: <span className="text-blue-300">{email}</span></p>
                </div>

                <button
                  onClick={handleCheckStatus}
                  disabled={checking}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {checking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>🔄 Check Approval Status</>
                  )}
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                onClick={onBackToLogin}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors text-sm"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
