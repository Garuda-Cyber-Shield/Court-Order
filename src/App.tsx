import { useState, useRef, useEffect } from "react";
import { getCountryById } from "./data/countryData";
import { downloadElementAsPdf } from "./utils/downloadPdf";
import OrderDocument from "./components/OrderDocument";
import OrderForm from "./components/OrderForm";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import BannedPage from "./pages/BannedPage";
import AdminPanel from "./pages/AdminPanel";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PlexusBackground from "./components/PlexusBackground";

export interface OrderData {
  orderNo: string;
  date: string;
  country: string;
  complainantName: string;
  complainantId: string;
  accusedName: string;
  accusedProfileLink: string;
  postLink: string;
  reason: string;
  additionalNotes: string;
  officerName: string;
  officerDesignation: string;
  department: string;
  priority: "জরুরি" | "সাধারণ" | "অতি জরুরি";
  courtName: string;           // government heading line 1
  logoUrl: string | null;
  verificationCode: string;
}

type AppPage = "login" | "signup" | "pending" | "banned" | "form" | "admin" | "forgot" | "reset";

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState<AppPage>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  // Used to prevent double pushState when restoring from popstate
  const isRestoringRef = useRef(false);

  // ── Browser History API: seed initial state
  useEffect(() => {
    window.history.replaceState({ currentPage, showPreview }, "");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Push a new history entry on every navigation change
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    window.history.pushState({ currentPage, showPreview }, "");
  }, [currentPage, showPreview]);

  // ── Listen for mouse Back / Forward (and browser arrow keys)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (!e.state) return;
      isRestoringRef.current = true;
      setCurrentPage(e.state.currentPage as AppPage);
      setShowPreview(Boolean(e.state.showPreview));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Determine page based on auth state
  const getEffectivePage = (): AppPage => {
    if (loading) return "login"; // show nothing meaningful while loading

    // If user is logged in, check status
    if (user) {
      if (user.status === "banned") return "banned";
      if (user.status === "pending") return "pending";
      if (currentPage === "admin" && (user.role === "admin" || user.role === "owner")) return "admin";
      return "form";
    }

    // Not logged in — show whichever auth page is selected
    if (currentPage === "signup") return "signup";
    if (currentPage === "pending") return "pending";
    if (currentPage === "banned") return "banned";
    if (currentPage === "forgot") return "forgot";
    if (currentPage === "reset") return "reset";
    return "login";
  };

  const page = getEffectivePage();

  const handleGenerate = (data: OrderData) => {
    setOrderData(data);
    setShowPreview(true);
  };

  const handleDownloadPdf = async () => {
    if (!orderData) return;
    const country = getCountryById(orderData.country);
    const safeName = `Court-Order_${country.nameEn}_${orderData.orderNo}`.replace(/[^a-zA-Z0-9_\-]/g, "_");
    setIsGenerating(true);
    try {
      if (docRef.current) {
        await downloadElementAsPdf(docRef.current, safeName, orderData);
      } else {
        document.title = safeName;
        setTimeout(() => { window.print(); }, 100);
      }
    } catch (err) {
      console.error("PDF failed:", err);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // On mobile, never trigger window.print() — it shows a print dialog
        // instead of downloading. Show actionable feedback instead.
        alert("PDF generation failed. Please try again.");
      } else {
        // Desktop: print dialog works fine as a fallback (Save as PDF)
        window.print();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage("login");
    setShowPreview(false);
    setOrderData(null);
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-300 text-lg">Loading GCS...</p>
        </div>
      </div>
    );
  }

  // Auth Pages
  if (page === "login") {
    return (
      <LoginPage
        onSwitchToSignup={() => setCurrentPage("signup")}
        onForgotPassword={() => setCurrentPage("forgot")}
        onLoginSuccess={() => setCurrentPage("form")}
        onPending={() => setCurrentPage("pending")}
        onBanned={() => setCurrentPage("banned")}
      />
    );
  }

  if (page === "signup") {
    return (
      <SignupPage
        onSwitchToLogin={() => setCurrentPage("login")}
        onSignupSuccess={() => setCurrentPage("pending")}
        onBanned={() => setCurrentPage("banned")}
      />
    );
  }

  if (page === "pending") {
    return <PendingApprovalPage onBackToLogin={() => { logout(); setCurrentPage("login"); }} />;
  }

  if (page === "forgot") {
    return (
      <ForgotPasswordPage
        onBackToLogin={() => setCurrentPage("login")}
        onResetApproved={(email) => { setResetEmail(email); setCurrentPage("reset"); }}
      />
    );
  }

  if (page === "reset") {
    return (
      <ResetPasswordPage
        email={resetEmail}
        onBackToLogin={() => setCurrentPage("login")}
      />
    );
  }

  if (page === "banned") {
    return <BannedPage onBackToLogin={() => { logout(); setCurrentPage("login"); }} />;
  }

  if (page === "admin") {
    return <AdminPanel onBack={() => setCurrentPage("form")} />;
  }

  // ─── Main Form Page (authenticated) ─────────────────────────
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent print:bg-none print:bg-white print:min-h-0 print:overflow-visible">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 shadow-2xl border-b border-blue-700/50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-xl flex flex-shrink-0 items-center justify-center shadow-lg">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-wide leading-tight">
                GCS — Facebook Post Removal —<br className="sm:hidden" /> Court Order Generator
              </h1>
              <p className="text-blue-300 text-xs sm:text-sm mt-1">
                ১৫টি দেশের অফিসিয়াল সিলমোহর ও স্বাক্ষর সহ কোর্ট অর্ডার
              </p>
            </div>
          </div>

          {/* Right side: user info + buttons */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* User Badge */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
              <span className="text-blue-300">👤</span>
              <span className="text-white font-semibold truncate max-w-[120px]">{user?.codeName}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${user?.role === "owner" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : user?.role === "admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"}`}>
                {user?.role}
              </span>
            </div>

            {/* Admin Panel Button - only for admin/owner */}
            {isAdmin && (
              <button
                onClick={() => setCurrentPage("admin")}
                className="px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 transition-all flex items-center gap-2 text-sm shadow-lg hover:shadow-purple-500/30"
              >
                <span>🛡️</span> Admin Panel
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-red-600/80 text-white font-semibold rounded-lg hover:bg-red-500 transition-all flex items-center gap-2 text-sm shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none">
        {!showPreview ? (
          <OrderForm onGenerate={handleGenerate} existingData={orderData} />
        ) : (
          <div>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 print:hidden">
              <button
                onClick={handleBack}
                className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                ফিরে যান / Go Back
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Download / Print PDF
                  </>
                )}
              </button>
            </div>

            {/* Document Preview */}
            <div className="w-full pb-6 print:pb-0">
              <div className="w-full max-w-[210mm] mx-auto bg-white/5 p-2 sm:p-6 rounded-xl shadow-2xl backdrop-blur-sm print:bg-transparent print:p-0 print:shadow-none">
                {/* docRef targets only the clean white document for html2canvas */}
                <div ref={docRef}>
                  {orderData && <OrderDocument data={orderData} />}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 px-4 text-blue-400/60 text-xs sm:text-sm leading-relaxed print:hidden">
        <p className="mt-2 font-bold text-blue-400/80 tracking-wide uppercase text-[10px] sm:text-xs">
          © 2026 Garuda Cyber Shield. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PlexusBackground />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
