import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ExternalLink,
  Copy,
  Check,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Search,
  AlertCircle,
  X,
  Link2,
  Sparkles,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export interface ReportLinkItem {
  id: number;
  name: string;
  vpn: string;
  link: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE = "/api";

interface ReportTheme {
  dotClass: string;
  cardBgClass: string;
  linkTextClass: string;
  linkBoxClass: string;
  openBtnClass: string;
  borderAccentClass: string;
}

const REPORT_THEMES: ReportTheme[] = [
  {
    dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    cardBgClass: "bg-gradient-to-r from-emerald-950/40 via-slate-800/90 to-slate-800/90 border-emerald-500/30",
    linkTextClass: "text-emerald-300 hover:text-emerald-200",
    linkBoxClass: "bg-emerald-950/50 border-emerald-500/30",
    openBtnClass: "bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600 border-emerald-500/40",
    borderAccentClass: "border-l-4 border-l-emerald-400",
  },
  {
    dotClass: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
    cardBgClass: "bg-gradient-to-r from-cyan-950/40 via-slate-800/90 to-slate-800/90 border-cyan-500/30",
    linkTextClass: "text-cyan-300 hover:text-cyan-200",
    linkBoxClass: "bg-cyan-950/50 border-cyan-500/30",
    openBtnClass: "bg-cyan-600/30 text-cyan-200 hover:bg-cyan-600 border-cyan-500/40",
    borderAccentClass: "border-l-4 border-l-cyan-400",
  },
  {
    dotClass: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
    cardBgClass: "bg-gradient-to-r from-purple-950/40 via-slate-800/90 to-slate-800/90 border-purple-500/30",
    linkTextClass: "text-purple-300 hover:text-purple-200",
    linkBoxClass: "bg-purple-950/50 border-purple-500/30",
    openBtnClass: "bg-purple-600/30 text-purple-200 hover:bg-purple-600 border-purple-500/40",
    borderAccentClass: "border-l-4 border-l-purple-400",
  },
  {
    dotClass: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    cardBgClass: "bg-gradient-to-r from-amber-950/40 via-slate-800/90 to-slate-800/90 border-amber-500/30",
    linkTextClass: "text-amber-300 hover:text-amber-200",
    linkBoxClass: "bg-amber-950/50 border-amber-500/30",
    openBtnClass: "bg-amber-600/30 text-amber-200 hover:bg-amber-600 border-amber-500/40",
    borderAccentClass: "border-l-4 border-l-amber-400",
  },
  {
    dotClass: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
    cardBgClass: "bg-gradient-to-r from-rose-950/40 via-slate-800/90 to-slate-800/90 border-rose-500/30",
    linkTextClass: "text-rose-300 hover:text-rose-200",
    linkBoxClass: "bg-rose-950/50 border-rose-500/30",
    openBtnClass: "bg-rose-600/30 text-rose-200 hover:bg-rose-600 border-rose-500/40",
    borderAccentClass: "border-l-4 border-l-rose-400",
  },
  {
    dotClass: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
    cardBgClass: "bg-gradient-to-r from-sky-950/40 via-slate-800/90 to-slate-800/90 border-sky-500/30",
    linkTextClass: "text-sky-300 hover:text-sky-200",
    linkBoxClass: "bg-sky-950/50 border-sky-500/30",
    openBtnClass: "bg-sky-600/30 text-sky-200 hover:bg-sky-600 border-sky-500/40",
    borderAccentClass: "border-l-4 border-l-sky-400",
  },
  {
    dotClass: "bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]",
    cardBgClass: "bg-gradient-to-r from-fuchsia-950/40 via-slate-800/90 to-slate-800/90 border-fuchsia-500/30",
    linkTextClass: "text-fuchsia-300 hover:text-fuchsia-200",
    linkBoxClass: "bg-fuchsia-950/50 border-fuchsia-500/30",
    openBtnClass: "bg-fuchsia-600/30 text-fuchsia-200 hover:bg-fuchsia-600 border-fuchsia-500/40",
    borderAccentClass: "border-l-4 border-l-fuchsia-400",
  },
  {
    dotClass: "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]",
    cardBgClass: "bg-gradient-to-r from-indigo-950/40 via-slate-800/90 to-slate-800/90 border-indigo-500/30",
    linkTextClass: "text-indigo-300 hover:text-indigo-200",
    linkBoxClass: "bg-indigo-950/50 border-indigo-500/30",
    openBtnClass: "bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600 border-indigo-500/40",
    borderAccentClass: "border-l-4 border-l-indigo-400",
  },
];

const getReportTheme = (id: number, index: number): ReportTheme => {
  const hash = id ? Math.abs(id * 7 + 13) : index;
  return REPORT_THEMES[hash % REPORT_THEMES.length];
};

export default function ReportLinks() {
  const { user, token } = useAuth();
  const isAdminOrOwner = user?.role === "admin" || user?.role === "owner";

  const [links, setLinks] = useState<ReportLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ReportLinkItem | null>(null);
  const [formData, setFormData] = useState({ name: "", vpn: "", link: "" });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Copy status feedback: { [id]: boolean }
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Drag & drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isAdminOrOwner) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isAdminOrOwner || draggedIndex === null || draggedIndex === index) return;

    const updatedLinks = [...links];
    const [draggedItem] = updatedLinks.splice(draggedIndex, 1);
    updatedLinks.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLinks(updatedLinks);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    setDraggedIndex(null);

    try {
      const orderedIds = links.map((item) => item.id);
      await fetch(`${API_BASE}/report-links/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (err) {
      console.error("Failed to persist reordering:", err);
    }
  };

  // Mobile Touch Reordering Handlers
  const handleMoveUp = async (index: number) => {
    if (index <= 0 || !isAdminOrOwner) return;
    const updatedLinks = [...links];
    const temp = updatedLinks[index - 1];
    updatedLinks[index - 1] = updatedLinks[index];
    updatedLinks[index] = temp;

    setLinks(updatedLinks);

    try {
      const orderedIds = updatedLinks.map((item) => item.id);
      await fetch(`${API_BASE}/report-links/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (err) {
      console.error("Failed to persist reordering:", err);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= links.length - 1 || !isAdminOrOwner) return;
    const updatedLinks = [...links];
    const temp = updatedLinks[index + 1];
    updatedLinks[index + 1] = updatedLinks[index];
    updatedLinks[index] = temp;

    setLinks(updatedLinks);

    try {
      const orderedIds = updatedLinks.map((item) => item.id);
      await fetch(`${API_BASE}/report-links/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (err) {
      console.error("Failed to persist reordering:", err);
    }
  };

  const fetchReportLinks = async (silent = false) => {
    if (!silent) setError("");
    try {
      const res = await fetch(`${API_BASE}/report-links`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!silent) throw new Error(data.error || data.message || `Server returned status ${res.status}`);
        return;
      }
      setLinks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to load report links. Please ensure backend server is running.");
    } finally {
      if (!silent) setLoading(false);
    }
  };


  useEffect(() => {
    void fetchReportLinks();
    // Live sync reordered positions across all approved users in real-time
    const timer = window.setInterval(() => void fetchReportLinks(true), 4000);
    return () => window.clearInterval(timer);
  }, [token]);

  // Form error/duplicate notice state
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const checkDuplicateWarning = () => {
    if (!formData.name.trim() && !formData.link.trim()) return null;
    const normalizeUrl = (u: string) =>
      u.toLowerCase().replace(/^https?:\/\//i, "").replace(/\/$/, "").trim();

    const nameInput = formData.name.trim().toLowerCase();
    const linkInput = normalizeUrl(formData.link);

    for (const item of links) {
      if (editingItem && item.id === editingItem.id) continue;

      if (linkInput && normalizeUrl(item.link) === linkInput) {
        return `Notice: A report form with this exact URL link already exists ("${item.name}").`;
      }
      if (nameInput && item.name.trim().toLowerCase() === nameInput) {
        return `Notice: A report form named "${item.name}" already exists in the system.`;
      }
    }
    return null;
  };

  const activeDuplicateWarning = checkDuplicateWarning();

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({ name: "", vpn: "None", link: "" });
    setFormNotice(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: ReportLinkItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, vpn: item.vpn, link: item.link });
    setFormNotice(null);
    setShowModal(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.link.trim()) return;

    setFormNotice(null);
    setFormSubmitting(true);
    try {
      const isEdit = Boolean(editingItem);
      const url = isEdit
        ? `${API_BASE}/report-links/${editingItem?.id}`
        : `${API_BASE}/report-links`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormNotice(data.error || "Failed to save report link.");
        return;
      }

      setShowModal(false);
      fetchReportLinks();
    } catch (err: any) {
      setFormNotice(err.message || "Failed to save report link.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`${API_BASE}/report-links/${deletingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to delete link");
      }
      setDeletingId(null);
      fetchReportLinks();
    } catch (err: any) {
      alert(err.message || "Delete error");
    }
  };

  const handleCopyLink = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const filteredLinks = links.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.vpn.toLowerCase().includes(q) ||
      item.link.toLowerCase().includes(q)
    );
  });

  const getVpnBadgeStyle = (vpnStr: string) => {
    const lower = vpnStr.toLowerCase();
    if (lower.includes("usa") || lower.includes("us")) {
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
    if (lower.includes("uk") || lower.includes("united kingdom")) {
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
    }
    if (lower.includes("singapore") || lower.includes("sg")) {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
    if (lower.includes("none") || lower.includes("direct") || !vpnStr) {
      return "bg-slate-700/60 text-slate-300 border-slate-600/50";
    }
    return "bg-purple-500/20 text-purple-300 border-purple-500/40";
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Section Header */}
      <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <Link2 className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                Report Links
                <span className="px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full">
                  {links.length} Available
                </span>
              </h2>
              <p className="text-blue-300/70 text-xs sm:text-sm mt-0.5 sm:mt-1">
                Official Facebook & portal reporting forms with required VPN settings
              </p>
            </div>
          </div>

          {isAdminOrOwner && (
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Report Link
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Report Name, VPN, or URL..."
              className="w-full pl-10 pr-8 py-2 sm:py-2.5 bg-slate-900/60 border border-slate-700/70 rounded-xl text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-slate-400 text-[11px] sm:text-xs flex items-center gap-1.5 self-start sm:self-center">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Visible to all approved GCS members</span>
          </div>
        </div>
      </div>

      {/* Main Form Content Container */}
      <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm">Loading Report Links...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={() => fetchReportLinks()}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-600"
            >
              Try Again
            </button>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <Globe className="w-12 h-12 text-slate-500 mx-auto" />
            <div>
              <h3 className="text-white font-semibold text-base">No Report Links Found</h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {searchTerm
                  ? "No links match your search query."
                  : "No report links have been added yet."}
              </p>
            </div>
            {isAdminOrOwner && !searchTerm && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs sm:text-sm transition-all"
              >
                + Add First Report Link
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (< md screens) */}
            <div className="md:hidden p-3 sm:p-4 space-y-3.5">
              {filteredLinks.map((item, index) => {
                const theme = getReportTheme(item.id, index);
                return (
                  <div
                    key={item.id}
                    draggable={isAdminOrOwner}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-2xl p-4 border transition-all shadow-lg space-y-3 ${theme.cardBgClass} ${theme.borderAccentClass} ${
                      draggedIndex === index ? "opacity-40 ring-2 ring-blue-500 scale-[0.98]" : ""
                    }`}
                  >
                    {/* Name & VPN Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {isAdminOrOwner && (
                          <div
                            className="cursor-grab active:cursor-grabbing p-0.5 text-slate-500 hover:text-slate-200 transition-colors shrink-0 mt-0.5"
                            title="Drag to reorder position"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${theme.dotClass}`} />
                        <h4 className="font-bold text-white text-sm leading-snug">{item.name}</h4>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shrink-0 ${getVpnBadgeStyle(
                          item.vpn
                        )}`}
                      >
                        <Globe className="w-3 h-3" />
                        {item.vpn || "None"}
                      </span>
                    </div>

                    {/* Link Box */}
                    <div className={`border rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner ${theme.linkBoxClass}`}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-mono text-xs break-all hover:underline underline-offset-2 flex-1 ${theme.linkTextClass}`}
                      >
                        {item.link}
                      </a>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg border transition-colors ${theme.openBtnClass}`}
                          title="Open link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleCopyLink(item.id, item.link)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
                          title="Copy link"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Admin Actions & Position Reorder Controls */}
                    {isAdminOrOwner && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/40">
                        {/* Position Up / Down Reorder Buttons */}
                        <div className="flex items-center gap-1 bg-slate-900/70 px-2 py-1 rounded-xl border border-slate-700/60">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mr-0.5">
                            Order
                          </span>
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 hover:text-white transition-colors border border-slate-700/60"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === filteredLinks.length - 1}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 hover:text-white transition-colors border border-slate-700/60"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-blue-600/30 border border-slate-700/60 text-blue-300 text-xs font-medium flex items-center gap-1 transition-all"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-red-600/30 border border-slate-700/60 text-red-300 text-xs font-medium flex items-center gap-1 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700/60 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    {isAdminOrOwner && <th className="py-4 px-3 w-10 text-center"></th>}
                    <th className="py-4 px-6 min-w-[240px]">Report Name</th>
                    <th className="py-4 px-6 min-w-[150px] whitespace-nowrap">VPN Location</th>
                    <th className="py-4 px-6 min-w-[350px]">Link</th>
                    {isAdminOrOwner && (
                      <th className="py-4 px-6 text-right min-w-[140px] whitespace-nowrap">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-sm">
                  {filteredLinks.map((item, index) => {
                    const theme = getReportTheme(item.id, index);
                    return (
                      <tr
                        key={item.id}
                        draggable={isAdminOrOwner}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`transition-all group ${
                          draggedIndex === index
                            ? "opacity-40 bg-blue-900/40 ring-2 ring-blue-500"
                            : "hover:bg-slate-700/30"
                        }`}
                      >
                        {/* Drag Handle Column */}
                        {isAdminOrOwner && (
                          <td className="py-4 px-3 text-center align-middle w-10">
                            <div
                              className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-500 hover:text-slate-200 transition-colors inline-flex items-center justify-center"
                              title="Drag to reorder position"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                          </td>
                        )}

                        {/* Report Name */}
                        <td className="py-4 px-6 text-white font-medium align-middle">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-2 ${theme.dotClass}`} />
                            <span className="font-semibold text-white leading-snug">{item.name}</span>
                          </div>
                        </td>

                        {/* VPN */}
                        <td className="py-4 px-6 align-middle whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getVpnBadgeStyle(
                              item.vpn
                            )}`}
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            {item.vpn || "None"}
                          </span>
                        </td>

                        {/* Full Clickable Link */}
                        <td className="py-4 px-6 align-middle">
                          <div className="flex items-center gap-2.5">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm break-all hover:underline underline-offset-2 transition-colors ${theme.linkTextClass}`}
                            >
                              <span className="break-all">{item.link}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>

                            <button
                              onClick={() => handleCopyLink(item.id, item.link)}
                              className="p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 border border-slate-600/40"
                              title="Copy link to clipboard"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Admin / Owner Actions */}
                        {isAdminOrOwner && (
                          <td className="py-4 px-6 text-right align-middle whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-2 rounded-lg bg-slate-700/50 hover:bg-blue-600/30 border border-slate-600/50 text-blue-300 hover:text-blue-200 transition-all text-xs font-medium flex items-center gap-1"
                                title="Edit Report Link"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => setDeletingId(item.id)}
                                className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-600/30 border border-slate-600/50 text-red-300 hover:text-red-200 transition-all text-xs font-medium flex items-center gap-1"
                                title="Delete Report Link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-400" />
                {editingItem ? "Edit Report Link" : "Add New Report Link"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4">
              {/* DUPLICATE / SIMILAR ENTRY NOTICE BANNER */}
              {(formNotice || activeDuplicateWarning) && (
                <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-start gap-2.5 shadow-md">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">
                    {formNotice || activeDuplicateWarning}
                  </div>
                  {formNotice && (
                    <button
                      type="button"
                      onClick={() => setFormNotice(null)}
                      className="text-amber-400 hover:text-amber-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <div>
                <label className="block text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Facebook Copyright Removal Form"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  VPN Location / Requirement
                </label>
                <input
                  type="text"
                  value={formData.vpn}
                  onChange={(e) =>
                    setFormData({ ...formData, vpn: e.target.value })
                  }
                  placeholder="e.g. USA, United Kingdom, Singapore, or None"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Report Link (URL) *
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="https://www.facebook.com/help/contact/..."
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {formSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editingItem ? (
                    "Update Link"
                  ) : (
                    "Create Link"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Delete Report Link?</h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Are you sure you want to permanently remove this report link from the database?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-600/30"
              >
                Delete Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
