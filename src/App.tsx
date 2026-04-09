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
import { User, Shield, LogOut } from 'lucide-react';
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

type AppPage = "login" | "signup" | "pending" | "banned" | "form" | "admin" | "forgot" | "reset";

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
                  ২০০+ দেশের অফিসিয়াল আইন, সিলমোহর ও স্বাক্ষর সহ কোর্ট অর্ডার
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-0">
              <div className="flex-1 sm:flex-none flex items-center justify-center bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-2.5 sm:px-3 sm:py-2 gap-1.5 sm:gap-2 text-sm">
                <User className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="text-white font-semibold truncate max-w-[90px] sm:max-w-[120px]">{user?.codeName}</span>
                <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] font-bold rounded-full uppercase shrink-0 ${user?.role === "owner" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : user?.role === "admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"}`}>
                  {user?.role}
                </span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setCurrentPage("admin")}
                  className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 transition-all flex items-center gap-2 text-sm shadow-lg hover:shadow-purple-500/30"
                >
                  <Shield className="w-4 h-4 shrink-0" /> Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto justify-center px-4 py-2.5 bg-red-600/80 text-white font-semibold rounded-lg hover:bg-red-500 transition-all flex items-center gap-2 text-sm shadow-lg"
              >
                <LogOut className="w-4 h-4 shrink-0" /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none">
          {!showPreview ? (
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
