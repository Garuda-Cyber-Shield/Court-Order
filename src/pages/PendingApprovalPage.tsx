interface PendingPageProps {
  onBackToLogin: () => void;
}

export default function PendingApprovalPage({ onBackToLogin }: PendingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 px-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-yellow-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative w-full max-w-lg text-center">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-600 rounded-2xl blur-sm opacity-20" />

        <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-700/30 overflow-hidden px-8 py-14">
          {/* Animated clock icon */}
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" style={{ animationDuration: "3s" }} />
            <div className="relative w-full h-full bg-gradient-to-br from-amber-600/30 to-yellow-600/30 rounded-full flex items-center justify-center border-2 border-amber-500/40">
              <span className="text-5xl">⏳</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">Awaiting Approval</h1>
          <p className="text-amber-200/80 text-lg mb-2">Your account has been created successfully!</p>
          <p className="text-slate-400 mb-8 leading-relaxed">
            An administrator needs to approve your account before you can access the system.
            Please check back later or contact the admin.
          </p>

          <div className="bg-amber-900/30 border border-amber-600/40 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-center gap-3 text-amber-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Status: Pending Review</span>
            </div>
            <p className="text-amber-200/60 text-sm mt-2">
              You will be able to log in once an admin approves your request.
            </p>
          </div>

          <button
            onClick={onBackToLogin}
            className="px-8 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold rounded-xl hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg hover:shadow-amber-500/30"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
