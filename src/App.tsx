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
import ReportLinks from "./components/ReportLinks";
import { User, Shield, LogOut, FileText, Link2 } from 'lucide-react';
import InstallPWA from "./components/InstallPWA";

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
  courtName: string;
  logoUrl: string | null;
  verificationCode: string;
}

type AppPage = "login" | "signup" | "pending" | "banned" | "form" | "admin" | "forgot" | "reset" | "report-links";


function AppContent() {
  const { user, loading, logout } = useAuth();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState<AppPage>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    window.history.replaceState({ currentPage, showPreview }, "");
  }, []);

  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    window.history.pushState({ currentPage, showPreview }, "");
  }, [currentPage, showPreview]);

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

  const getEffectivePage = (): AppPage => {
    if (loading) return "login";
    if (user) {
      if (user.status === "banned") return "banned";
      if (user.status === "pending") return "pending";
      if (currentPage === "admin" && (user.role === "admin" || user.role === "owner")) return "admin";
      if (currentPage === "report-links") return "report-links";
      return "form";
    }
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
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        alert("PDF generation failed. Please try again.");
      } else {
        window.print();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentPage("login");
    setShowPreview(false);
    setOrderData(null);
  };

  let content;
  if (loading) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-300 text-lg">Loading GCS...</p>
        </div>
      </div>
    );
  } else if (page === "login") {
    content = (
      <LoginPage
        onSwitchToSignup={() => setCurrentPage("signup")}
        onForgotPassword={() => setCurrentPage("forgot")}
        onLoginSuccess={() => setCurrentPage("form")}
        onPending={() => setCurrentPage("pending")}
        onBanned={() => setCurrentPage("banned")}
      />
    );
  } else if (page === "signup") {
    content = (
      <SignupPage
        onSwitchToLogin={() => setCurrentPage("login")}
        onSignupSuccess={() => setCurrentPage("pending")}
        onBanned={() => setCurrentPage("banned")}
      />
    );
  } else if (page === "pending") {
    content = <PendingApprovalPage onBackToLogin={() => { logout(); setCurrentPage("login"); }} />;
  } else if (page === "forgot") {
    content = (
      <ForgotPasswordPage
        onBackToLogin={() => setCurrentPage("login")}
        onResetApproved={(email) => { setResetEmail(email); setCurrentPage("reset"); }}
      />
    );
  } else if (page === "reset") {
    content = (
      <ResetPasswordPage
        email={resetEmail}
        onBackToLogin={() => setCurrentPage("login")}
      />
    );
  } else if (page === "banned") {
    content = <BannedPage onBackToLogin={() => { logout(); setCurrentPage("login"); }} />;
  } else if (page === "admin") {
    content = <AdminPanel onBack={() => setCurrentPage("form")} />;
  } else {
    const isAdmin = user?.role === "admin" || user?.role === "owner";
    content = (
      <div className="min-h-screen overflow-x-hidden bg-transparent print:bg-none print:bg-white print:min-h-0 print:overflow-visible">
        <header className="bg-gradient-to-r from-blue-900 to-indigo-900 shadow-2xl border-b border-blue-700/50 print:hidden">
          <div className="max-w-7xl mx-auto px-4 py-3.5 sm:py-5 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
            {/* Top Row on Mobile: Logo, Title, User pill, Logout */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-600 rounded-xl flex shrink-0 items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-base sm:text-2xl font-bold text-white tracking-wide leading-tight">
                    GCS — Court Order Generator
                  </h1>
                  <p className="text-blue-300 text-[11px] sm:text-sm mt-0.5 sm:mt-1 line-clamp-1">
                    ২০০+ দেশের অফিসিয়াল আইন, সিলমোহর ও স্বাক্ষর সহ কোর্ট অর্ডার
                  </p>
                </div>
              </div>

              {/* User Badge & Quick Logout on Mobile */}
              <div className="flex items-center gap-2 sm:hidden shrink-0">
                <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-1.5 gap-1 text-xs">
                  <User className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                  <span className="text-white font-semibold truncate max-w-[70px]">{user?.codeName}</span>
                  <span className={`px-1 py-0.2 text-[9px] font-bold rounded-full uppercase shrink-0 ${user?.role === "owner" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : user?.role === "admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"}`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-500 transition-all shadow-md"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Bar (Full width equal tabs on mobile, horizontal on desktop) */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0">
              <div className="bg-slate-900/70 p-1 rounded-xl border border-slate-700/60 flex items-center gap-1 w-full sm:w-auto">
                <button
                  onClick={() => setCurrentPage("form")}
                  className={`flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    page === "form"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Generator</span>
                </button>
                <button
                  onClick={() => setCurrentPage("report-links")}
                  className={`flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    page === "report-links"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Link2 className="w-4 h-4 shrink-0" />
                  <span>Report Links</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setCurrentPage("admin")}
                    className={`flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      page === "admin"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "bg-purple-900/50 text-purple-200 hover:bg-purple-800/60"
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>Admin</span>
                  </button>
                )}
              </div>

              {/* Desktop User Badge & Logout */}
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className="flex items-center bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-300 shrink-0" />
                  <span className="text-white font-semibold truncate max-w-[110px]">{user?.codeName}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase shrink-0 ${user?.role === "owner" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : user?.role === "admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"}`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600/80 text-white font-semibold rounded-lg hover:bg-red-500 transition-all flex items-center gap-2 text-sm shadow-lg"
                >
                  <LogOut className="w-4 h-4 shrink-0" /> Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none">
          {page === "report-links" ? (
            <ReportLinks />
          ) : !showPreview ? (
            <OrderForm onGenerate={handleGenerate} existingData={orderData} />
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row gap-4 mb-8 print:hidden">
                <button
                  onClick={() => setShowPreview(false)}
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
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                       Generating PDF...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Download / Print PDF
                    </div>
                  )}
                </button>
              </div>
              <div className="w-full pb-6 print:pb-0">
                <div className="w-full max-w-[210mm] mx-auto bg-white/5 p-2 sm:p-6 rounded-xl shadow-2xl backdrop-blur-sm print:bg-transparent print:p-0 print:shadow-none">
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

  return (
    <>
      <PlexusBackground />
      {content}
      <InstallPWA active={page === "login"} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
