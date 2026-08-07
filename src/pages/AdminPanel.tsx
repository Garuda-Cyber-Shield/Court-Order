import { useState, useEffect, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";
import { useAuth } from "../context/AuthContext";
import { Users, User, Hourglass, CheckCircle2, Ban, ShieldAlert, Crown, Shield, Mail, Calendar, Key, ChevronDown } from 'lucide-react';


interface DBUser {
  id: number;
  code_name: string;
  email: string;
  role: "user" | "admin" | "owner";
  status: "pending" | "approved" | "banned";
  is_default_owner: number;
  created_at: string;
  reset_requested?: boolean;
  reset_approved?: boolean;
}

interface AdminPanelProps {
  onBack: () => void;
}

const API_BASE = "/api";

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "banned">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [resetDecision, setResetDecision] = useState<Record<number, "approved" | "denied">>({});
  const resetDecisionTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      if (!silent) showToast("Failed to fetch users.", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchUsers();
    // MongoDB changes can come from another member's browser, so refresh the
    // admin list in the background without requiring a page reload.
    const refreshTimer = window.setInterval(() => void fetchUsers(true), 5000);
    return () => window.clearInterval(refreshTimer);
  }, [fetchUsers]);

  useEffect(() => () => {
    resetDecisionTimers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  const showResetDecision = (userId: number, decision: "approved" | "denied") => {
    const existingTimer = resetDecisionTimers.current.get(userId);
    if (existingTimer) clearTimeout(existingTimer);

    setResetDecision((current) => ({ ...current, [userId]: decision }));
    const timer = setTimeout(() => {
      setResetDecision((current) => {
        const { [userId]: _hidden, ...remaining } = current;
        return remaining;
      });
      resetDecisionTimers.current.delete(userId);
    }, 5000);
    resetDecisionTimers.current.set(userId, timer);
  };

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/approve/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        showResetDecision(userId, "approved");
        fetchUsers();
      } else {
        showToast(data.error, "error");
      }
    } catch {
      showToast("Action failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/promote/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        showResetDecision(userId, "denied");
        fetchUsers();
      } else {
        showToast(data.error, "error");
      }
    } catch {
      showToast("Action failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number, email: string) => {
    if (!confirm(`Are you sure you want to BAN "${email}"? They will see a Ban page upon login.`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/delete/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        fetchUsers();
      } else {
        showToast(data.error, "error");
      }
    } catch {
      showToast("Action failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveReset = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/approve-reset/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        fetchUsers();
      } else {
        showToast(data.error, "error");
      }
    } catch {
      showToast("Action failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDenyReset = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/deny-reset/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        fetchUsers();
      } else {
        showToast(data.error, "error");
      }
    } catch {
      showToast("Action failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActionSelect = (action: string, targetUser: DBUser) => {
    setOpenActionId(null);
    if (action === "approve") void handleApprove(targetUser.id);
    if (action === "toggle-admin") void handlePromote(targetUser.id);
    if (action === "ban") void handleDelete(targetUser.id, targetUser.email);
    if (action === "approve-reset") void handleApproveReset(targetUser.id);
    if (action === "deny-reset") void handleDenyReset(targetUser.id);
  };

  const handleExport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("GCS — User List", pageWidth / 2, 20, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: "center" });

      // Column x-positions (mm): #, Code Name, Email, Role, Status
      let y = 40;
      const cols = [14, 28, 68, 152, 178];
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(30, 41, 59);
      doc.rect(10, y - 5, pageWidth - 20, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("#", cols[0], y);
      doc.text("Code Name", cols[1], y);
      doc.text("Email", cols[2], y);
      doc.text("Role", cols[3], y);
      doc.text("Status", cols[4], y);
      doc.setTextColor(0, 0, 0);
      y += 10;

      // Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      users.forEach((u, i) => {
        if (y > 275) { doc.addPage(); y = 20; }
        if (i % 2 === 0) {
          doc.setFillColor(241, 245, 249);
          doc.rect(10, y - 5, pageWidth - 20, 8, "F");
        }
        doc.text(String(i + 1), cols[0], y);
        const codeName = u.code_name.length > 16 ? u.code_name.substring(0, 14) + "…" : u.code_name;
        doc.text(codeName, cols[1], y);
        const email = u.email.length > 35 ? u.email.substring(0, 33) + "…" : u.email;
        doc.text(email, cols[2], y);
        doc.text(u.role.toUpperCase(), cols[3], y);
        doc.text(u.status, cols[4], y);
        y += 8;
      });

      // Footer
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Total Users: ${users.length}`, 14, y);

      doc.save("GCS_User_List.pdf");
      showToast("User list downloaded as PDF!");
    } catch {
      showToast("Export failed.", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    // Pending accounts are managed only from the Pending tab, never in All Users.
    const matchesFilter = filter === "all" ? u.status !== "pending" : u.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      u.code_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: users.filter((u) => u.status !== "pending").length,
    pending: users.filter((u) => u.status === "pending").length,
    banned: users.filter((u) => u.status === "banned").length,
  };

  const getRoleBadge = (role: string, isDefaultOwner: number) => {
    if (isDefaultOwner) return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 inline-flex items-center gap-1"><Crown className="w-3 h-3" /> OWNER</span>;
    if (role === "owner") return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 inline-flex items-center gap-1"><Crown className="w-3 h-3" /> OWNER</span>;
    if (role === "admin") return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1"><Shield className="w-3 h-3" /> ADMIN</span>;
    return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 inline-flex items-center gap-1"><User className="w-3 h-3" /> USER</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
    if (status === "pending") return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1"><Hourglass className="w-3 h-3" /> Pending</span>;
    return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-300 border border-red-500/40 inline-flex items-center gap-1"><Ban className="w-3 h-3" /> Banned</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl border text-sm font-semibold flex items-center gap-2 animate-slide-in ${toast.type === "success" ? "bg-emerald-900/90 border-emerald-500/50 text-emerald-200" : "bg-red-900/90 border-red-500/50 text-red-200"}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 shadow-2xl border-b border-purple-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600/40 rounded-xl flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">Admin Panel</h1>
                <p className="text-purple-300/70 text-xs sm:text-sm">User Management Dashboard</p>
              </div>
            </div>

            {/* Mobile Back Button Quick Access */}
            <button
              onClick={onBack}
              className="sm:hidden px-3 py-1.5 bg-slate-800/80 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-semibold hover:bg-slate-700 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export PDF</span>
            </button>
            <button
              onClick={onBack}
              className="hidden sm:flex px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all items-center gap-2 text-sm shadow-lg"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Form</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Stats Cards (2-column on mobile, side-by-side) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {([["all", "All Users", Users, "from-blue-600/20 to-indigo-600/20", "border-blue-500/30"], ["pending", "Pending", Hourglass, "from-amber-600/20 to-yellow-600/20", "border-amber-500/30"]] as const).map(([key, label, IconComponent, bg, border]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`bg-gradient-to-br ${bg} backdrop-blur-sm rounded-xl p-3.5 sm:p-4 border ${border} transition-all hover:scale-[1.02] text-left ${filter === key ? "ring-2 ring-blue-400" : ""}`}
            >
              <div className="flex items-center justify-between">
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 opacity-80" />
                <span className="text-2xl sm:text-3xl font-black text-white">{counts[key]}</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 sm:mt-2 font-medium">{label}</p>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search code name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Ban className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-base sm:text-lg">No users found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const isProtectedOwner = u.is_default_owner === 1;

              return (
                <div
                  key={u.id}
                  className={`bg-slate-800/80 backdrop-blur-sm rounded-xl border p-4 sm:p-5 transition-all hover:shadow-lg ${isProtectedOwner ? "border-yellow-500/40" : "border-slate-700/50"}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-white font-bold text-base sm:text-lg truncate">{u.code_name}</h3>
                        {getRoleBadge(u.role, u.is_default_owner)}
                        {u.status !== "approved" && getStatusBadge(u.status)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-400">
                        <span className="flex items-center gap-1.5 break-all">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-blue-400" /> {u.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-blue-400" /> {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap pt-2 lg:pt-0 border-t border-slate-700/40 lg:border-t-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isProtectedOwner && (
                          <span className="text-xs text-yellow-400/80 italic flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/30">
                            <Shield className="w-3 h-3" /> Protected Owner
                          </span>
                        )}
                        {u.status === "banned" && !isProtectedOwner && (
                          <span className="text-xs text-red-400/80 italic bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30">Account Banned</span>
                        )}

                        {/* Password Reset Request Badges */}
                        {u.reset_requested && !u.reset_approved && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse inline-flex items-center gap-1">
                            <Key className="w-3 h-3" /> Reset Requested
                          </span>
                        )}
                        {resetDecision[u.id] === "approved" && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-300 border border-green-500/40 inline-flex items-center gap-1">
                            <Key className="w-3 h-3" /> Reset Approved
                          </span>
                        )}
                        {resetDecision[u.id] === "denied" && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40 inline-flex items-center gap-1">
                            <Key className="w-3 h-3" /> Reset Denied
                          </span>
                        )}
                      </div>

                      {(u.status === "pending" || (!isProtectedOwner && u.status !== "banned") || (u.reset_requested && !u.reset_approved)) && (
                        <button
                          type="button"
                          aria-label={`Actions for ${u.code_name}`}
                          aria-expanded={openActionId === u.id}
                          disabled={actionLoading === u.id}
                          onClick={() => setOpenActionId((current) => current === u.id ? null : u.id)}
                          className="min-w-28 sm:min-w-36 rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-100 shadow-sm transition-colors hover:border-slate-500 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:cursor-wait disabled:opacity-60 inline-flex items-center justify-between gap-2 sm:gap-4 ml-auto sm:ml-0"
                        >
                          <span>{actionLoading === u.id ? "Working..." : "Actions"}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openActionId === u.id ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {openActionId === u.id && actionLoading !== u.id && (
                    <div className="mt-3 border-t border-slate-700/70 pt-3 flex justify-end">
                      <div className="w-full sm:w-56 overflow-hidden rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-lg shadow-slate-950/30">
                        {u.status === "pending" && <button type="button" onClick={() => handleActionSelect("approve", u)} className="w-full px-4 py-2 text-left text-xs sm:text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10">Approve account</button>}
                        {!isProtectedOwner && u.status === "approved" && user?.role === "owner" && <button type="button" onClick={() => handleActionSelect("toggle-admin", u)} className="w-full px-4 py-2 text-left text-xs sm:text-sm font-medium text-sky-200 transition-colors hover:bg-sky-500/10">{u.role === "admin" ? "Demote to user" : "Make admin"}</button>}
                        {u.reset_requested && !u.reset_approved && <button type="button" onClick={() => handleActionSelect("approve-reset", u)} className="w-full px-4 py-2 text-left text-xs sm:text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10">Approve password reset</button>}
                        {u.reset_requested && !u.reset_approved && <button type="button" onClick={() => handleActionSelect("deny-reset", u)} className="w-full px-4 py-2 text-left text-xs sm:text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">Deny password reset</button>}
                        {!isProtectedOwner && u.status !== "banned" && <button type="button" onClick={() => handleActionSelect("ban", u)} className="w-full border-t border-slate-700 px-4 py-2 text-left text-xs sm:text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10">Ban user</button>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
