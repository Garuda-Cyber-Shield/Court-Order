import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Tag, Mail, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: () => void;
  onBanned: () => void;
}

export default function SignupPage({ onSwitchToLogin, onSignupSuccess, onBanned }: SignupPageProps) {
  const { signup } = useAuth();
  const [codeName, setCodeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Field-level validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Gmail validation
  const validateEmail = (val: string) => {
    if (!val) { setEmailError(""); return; }
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(val)) {
      setEmailError("Only Gmail addresses are accepted (e.g. user@gmail.com)");
    } else {
      setEmailError("");
    }
  };

  // Password validation
  const validatePassword = (val: string) => {
    if (!val) { setPasswordError(""); return; }
    if (val.length < 8) {
      setPasswordError("Password must be at least 8 characters");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Final validations
    if (!codeName.trim()) { setError("Code Name is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password.trim()) { setError("Password is required."); return; }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(email)) {
      setError("Only Gmail addresses are accepted.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await signup(codeName, email, password);
    setLoading(false);

    if (result.success) {
      onSignupSuccess();
    } else if (result.errorType === "BANNED") {
      onBanned();
    } else {
      setError(result.error || "Signup failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-10">
      {/* Floating animated shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 rounded-2xl blur-sm opacity-30" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800/80 to-blue-800/80 px-8 py-8 text-center border-b border-emerald-700/30">
            <div className="w-24 h-24 mx-auto mb-4 drop-shadow-2xl">
              <img src="/Logo.png" alt="GCS Logo" className="w-full h-full object-contain rounded-full ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Create Account</h1>
            <p className="text-emerald-300/70 text-sm mt-2">Sign up to join GCS — Court Order Generator</p>
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

            {/* Code Name */}
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Code Name</label>
              <input
                type="text"
                id="signup-codename"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
                placeholder="Your unique code name"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Official Gmail */}
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2 flex items-center gap-1.5"><Mail className="w-4 h-4" /> Official Gmail</label>
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                onBlur={() => validateEmail(email)}
                placeholder="yourname@gmail.com"
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${emailError ? "border-red-500 focus:ring-red-500" : "border-slate-600 focus:ring-emerald-500"}`}
                required
              />
              {emailError && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2 flex items-center gap-1.5"><Lock className="w-4 h-4" /> Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="signup-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                  onBlur={() => validatePassword(password)}
                  placeholder="Minimum 8 characters"
                  className={`w-full px-4 py-3 pr-12 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${passwordError ? "border-red-500 focus:ring-red-500" : "border-slate-600 focus:ring-emerald-500"}`}
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
              {passwordError && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {passwordError}
                </p>
              )}
              {/* Password strength indicator */}
              {password && !passwordError && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    <div className={`h-1 rounded-full flex-1 ${password.length >= 8 ? "bg-emerald-500" : "bg-slate-600"}`} />
                    <div className={`h-1 rounded-full flex-1 ${password.length >= 10 ? "bg-emerald-500" : "bg-slate-600"}`} />
                    <div className={`h-1 rounded-full flex-1 ${password.length >= 12 && /[!@#$%^&*]/.test(password) ? "bg-emerald-500" : "bg-slate-600"}`} />
                  </div>
                  <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2 flex items-center gap-1.5"><Lock className="w-4 h-4" /> Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="signup-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${confirmPassword && confirmPassword !== password ? "border-red-500 focus:ring-red-500" : "border-slate-600 focus:ring-emerald-500"}`}
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold text-lg rounded-xl hover:from-emerald-500 hover:to-blue-500 transition-all shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Create Account
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-slate-400 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
