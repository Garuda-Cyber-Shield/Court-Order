import { Ban } from 'lucide-react';

interface BannedPageProps {
  onBackToLogin: () => void;
}

export default function BannedPage({ onBackToLogin }: BannedPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950/40 to-slate-900 px-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-red-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-lg text-center">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-700 via-red-600 to-red-800 rounded-2xl blur-sm opacity-25" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-700/40 overflow-hidden px-8 py-14">
          {/* Ban icon */}
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" style={{ animationDuration: "2s" }} />
            <div className="relative w-full h-full bg-gradient-to-br from-red-600/30 to-red-800/30 rounded-full flex items-center justify-center border-2 border-red-500/50">
              <Ban className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-red-300 mb-3">Account Banned</h1>
          <p className="text-red-200/80 text-lg mb-2">Your account has been suspended.</p>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your access to the GCS Court Order Generator system has been revoked by an administrator.
            If you believe this is an error, please contact the system administrator.
          </p>

          <div className="bg-red-900/30 border border-red-600/40 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-center gap-3 text-red-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">Status: BANNED</span>
            </div>
            <p className="text-red-200/60 text-sm mt-2">
              Contact Admin for details about your account suspension.
            </p>
          </div>

          <button
            onClick={onBackToLogin}
            className="px-8 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all shadow-lg"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
