import { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import { useAuth } from "../context/AuthContext";
import { Users, User, Hourglass, CheckCircle2, Ban, ShieldAlert, Crown, Shield, Mail, Calendar, Trash2, Key, XSquare } from 'lucide-react';


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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      showToast("Failed to fetch users.", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      // Email gets 84mm — plenty of room for any Gmail address
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
        // Truncate code name if extremely long
        const codeName = u.code_name.length > 16 ? u.code_name.substring(0, 14) + "…" : u.code_name;
        doc.text(codeName, cols[1], y);
        // Truncate email safely — 82mm / ~2.2mm per char ≈ 37 chars max
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
    const matchesFilter = filter === "all" || u.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      u.code_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: users.length,
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
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
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600/40 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Admin Panel</h1>
              <p className="text-purple-300/70 text-sm">User Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2 text-sm shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2 text-sm shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Form
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {([["all", "Total Users", Users, "from-blue-600/20 to-indigo-600/20", "border-blue-500/30"], ["pending", "Pending", Hourglass, "from-amber-600/20 to-yellow-600/20", "border-amber-500/30"], ["approved", "Approved", CheckCircle2, "from-emerald-600/20 to-green-600/20", "border-emerald-500/30"]] as const).map(([key, label, IconComponent, bg, border]) => (

            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`bg-gradient-to-br ${bg} backdrop-blur-sm rounded-xl p-4 border ${border} transition-all hover:scale-105 text-left ${filter === key ? "ring-2 ring-blue-400" : ""}`}
            >
              <div className="flex items-center justify-between">
                <IconComponent className="w-6 h-6 shrink-0 opacity-80" />
                <span className="text-3xl font-black text-white">{counts[key]}</span>
              </div>
              <p className="text-slate-300 text-sm mt-2 font-medium">{label}</p>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by code name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Ban className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No users found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className={`bg-slate-800/80 backdrop-blur-sm rounded-xl border p-5 transition-all hover:shadow-lg ${u.is_default_owner ? "border-yellow-500/40" : "border-slate-700/50"}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-white font-bold text-lg truncate">{u.code_name}</h3>
                      {getRoleBadge(u.role, u.is_default_owner)}
                      {getStatusBadge(u.status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-4 h-4 shrink-0" /> {u.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 shrink-0" /> {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {u.status === "pending" && (
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={actionLoading === u.id}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {actionLoading === u.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve</>}
                      </button>
                    )}

                    {!u.is_default_owner && u.status !== "banned" && user?.role === "owner" && (
                      <button
                        onClick={() => handlePromote(u.id)}
                        disabled={actionLoading === u.id}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 ${u.role === "admin" ? "bg-amber-600 text-white hover:bg-amber-500" : "bg-purple-600 text-white hover:bg-purple-500"}`}
                      >
                        {actionLoading === u.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : u.role === "admin" ? (
                          <>Demote</>
                        ) : (
                          <>Make Admin</>
                        )}
                      </button>
                    )}

                    {!u.is_default_owner && u.status !== "banned" && (
                      <button
                        onClick={() => handleDelete(u.id, u.email)}
                        disabled={actionLoading === u.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {actionLoading === u.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 className="w-4 h-4" /> Ban/Delete</>}
                      </button>
                    )}

                    {u.is_default_owner && (
                      <span className="text-xs text-yellow-400/60 italic flex items-center gap-1"><Shield className="w-3 h-3" /> Protected</span>
                    )}
                    {u.status === "banned" && !u.is_default_owner && (
                      <span className="text-xs text-red-400/60 italic">Account Banned</span>
                    )}

                    {/* Password Reset Request */}
                    {u.reset_requested && !u.reset_approved && (
                      <>
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse inline-flex items-center gap-1"><Key className="w-3 h-3" /> Reset Requested</span>
                        <button
                          onClick={() => handleApproveReset(u.id)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve Reset
                        </button>
                        <button
                          onClick={() => handleDenyReset(u.id)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 bg-slate-600 text-white text-xs font-semibold rounded-lg hover:bg-slate-500 transition-all disabled:opacity-50"
                        >
                          <XSquare className="w-3.5 h-3.5 inline mr-1" /> Deny
                        </button>
                      </>
                    )}
                    {u.reset_approved && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-300 border border-green-500/40 inline-flex items-center gap-1"><Key className="w-3 h-3" /> Reset Approved</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
