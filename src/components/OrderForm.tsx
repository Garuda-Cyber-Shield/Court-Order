import { useState } from "react";
import type { OrderData } from "../App";
import { countries, getCountryById } from "../data/countryData";

interface OrderFormProps {
  onGenerate: (data: OrderData) => void;
  existingData: OrderData | null;
}

export default function OrderForm({ onGenerate, existingData }: OrderFormProps) {
  const generateOrderNo = () => {
    const now = new Date();
    return `FB-RMV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
  };

  const getTodayDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState<OrderData>(() => {
    const defaultData: OrderData = {
      orderNo: generateOrderNo(),
      date: getTodayDate(),
      country: "bd",
      complainantName: "",
      complainantId: "",
      accusedName: "",
      accusedProfileLink: "",
      postLink: "",
      reason: "Harassment / Hate Speech",
      additionalNotes: "",
      officerName: "",
      officerDesignation: "",
      department: "",
      priority: "সাধারণ",
      courtName: "",
      logoUrl: null,
      verificationCode: "",
    };
    return existingData ? { ...defaultData, ...existingData } : defaultData;
  });

  const handleChange = (field: keyof OrderData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // When country changes, auto-fill all country-specific header + officer fields
      if (field === "country") {
        const c = getCountryById(value);
        updated.officerName = c.officerName;
        updated.officerDesignation = c.officerDesignation;
        updated.department = c.departmentName;
        // reset court name so it reflects new country default
        updated.courtName = "";
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = getCountryById(formData.country);
    const finalData = {
      ...formData,
      officerName: formData.officerName || c.officerName,
      officerDesignation: formData.officerDesignation || c.officerDesignation,
      department: formData.department || c.departmentName,
    };
    onGenerate(finalData);
  };

  const reasons = [
    "Harassment / Hate Speech",
    "Defamation / Libel",
    "Personal Data Leak / Privacy Violation",
    "Communal / Religious Incitement",
    "Misinformation / Fake News",
    "Copyright Infringement",
    "Obscene / Objectionable Content",
    "National Security Threat",
    "Cyberbullying / Cyberstalking",
    "Other / অন্যান্য",
  ];

  const selectedCountry = getCountryById(formData.country);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-800/80 to-indigo-800/80 px-5 sm:px-8 py-5 border-b border-blue-700/30">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">📝</span>
            কোর্ট অর্ডার তথ্য পূরণ করুন / Fill Court Order Information
          </h2>
          <p className="text-blue-200/80 text-sm mt-1">দেশ সিলেক্ট করুন এবং ফর্ম পূরণ করুন — Select country & fill form</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">

          {/* ===== COUNTRY SELECTION ===== */}
          <div className="bg-gradient-to-r from-indigo-900/60 to-blue-900/60 rounded-xl p-5 border border-indigo-600/40">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-lg">
              দেশ নির্বাচন করুন / Select Country
            </h3>
            <select
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border-2 border-indigo-500/50 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag} {c.nameBn} — {c.nameEn}
                </option>
              ))}
            </select>

            {/* Country Preview Card */}
            <div className="mt-4 bg-slate-800/80 rounded-lg p-4 border border-slate-600/50 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4">
              <span className="text-5xl sm:text-6xl drop-shadow-md">{selectedCountry.flag}</span>
              <div className="w-full mt-1 sm:mt-0">
                <p className="text-white font-bold text-base sm:text-lg leading-tight">{selectedCountry.governmentNameLine1}</p>
                <p className="text-blue-300 text-xs sm:text-sm mt-0.5">{selectedCountry.governmentNameLine2}</p>
                <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-2 sm:gap-4 mt-2 pt-2 border-t border-slate-600/50">
                  <p className="text-slate-400 text-xs flex items-center justify-center sm:justify-start gap-1">
                    <span>🏛️</span> <span className="truncate">{selectedCountry.departmentName}</span>
                  </p>
                  <p className="text-emerald-400 text-xs flex items-center justify-center sm:justify-start gap-1">
                    <span>👤</span> <span className="truncate">{selectedCountry.officerName}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== DOCUMENT HEADER FIELDS ===== */}
          <div className="border-t border-slate-700/50 pt-5 mt-5">
            <h3 className="text-white font-semibold mb-1 flex flex-wrap items-center gap-2">
              <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">🏛️</span>
              ডকুমেন্ট হেডার / Document Header
              <span className="text-xs bg-purple-900/50 text-purple-300 px-2.5 py-1 rounded-full border border-purple-700/50">
                Auto-filled from country — override here
              </span>
            </h3>
            <p className="text-slate-400 text-xs mb-4">Leave blank to use the country default shown as placeholder</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Government Heading */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1">আদালতের নাম / Court Name</label>
                <input
                  type="text"
                  value={formData.courtName}
                  onChange={(e) => handleChange("courtName", e.target.value)}
                  placeholder={selectedCountry.governmentNameLine1}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-slate-500 text-[11px] mt-1 truncate">Default: {selectedCountry.governmentNameLine1}</p>
              </div>

              {/* Field 3: Department Name */}
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1">বিভাগ / Department Name</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder={selectedCountry.departmentName}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-slate-500 text-[11px] mt-1 truncate">Default: {selectedCountry.departmentName}</p>
              </div>


              {/* Logo upload spans full width */}
              <div className="md:col-span-2">
                <label className="block text-blue-300 text-sm font-medium mb-1.5">অফিসিয়াল লোগো / Upload Logo (optional — replaces default seal)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleChange("logoUrl", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        handleChange("logoUrl", null);
                      }
                    }}
                    className="w-full text-slate-300 px-4 py-2 border border-slate-600 rounded-lg bg-slate-700/50 focus:outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                  />
                  {formData.logoUrl && (
                    <img src={formData.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded bg-white p-1" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-1.5">অর্ডার নম্বর / Order No.</label>
              <input
                type="text"
                value={formData.orderNo}
                onChange={(e) => handleChange("orderNo", e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-1.5">তারিখ / Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-1.5">অগ্রাধিকার / Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="সাধারণ">সাধারণ / Normal</option>
                <option value="জরুরি">জরুরি / Urgent</option>
                <option value="অতি জরুরি">অতি জরুরি / Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-1.5">ভেরিফিকেশন কোড / Verif. Code</label>
              <input
                type="text"
                value={formData.verificationCode}
                onChange={(e) => handleChange("verificationCode", e.target.value)}
                placeholder="Leave empty for auto-generated code"
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Section: Complainant */}
          <div className="border-t border-slate-700/50 pt-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white">1</span>
              অভিযোগকারী / Complainant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">নাম / Name</label>
                <input
                  type="text"
                  value={formData.complainantName}
                  onChange={(e) => handleChange("complainantName", e.target.value)}
                  placeholder="Enter complainant name"
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">আইডি / ID Number</label>
                <input
                  type="text"
                  value={formData.complainantId}
                  onChange={(e) => handleChange("complainantId", e.target.value)}
                  placeholder="ID / Passport / NID"
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Accused */}
          <div className="border-t border-slate-700/50 pt-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs text-white">2</span>
              অভিযুক্ত / Accused
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">নাম / Name</label>
                <input
                  type="text"
                  value={formData.accusedName}
                  onChange={(e) => handleChange("accusedName", e.target.value)}
                  placeholder="Accused person's name"
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">ফেসবুক প্রোফাইল / Facebook Profile</label>
                <input
                  type="text"
                  value={formData.accusedProfileLink}
                  onChange={(e) => handleChange("accusedProfileLink", e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Post Details */}
          <div className="border-t border-slate-700/50 pt-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-xs text-white">3</span>
              পোস্ট তথ্য / Post Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">পোস্ট লিংক / Post Link</label>
                <input
                  type="text"
                  value={formData.postLink}
                  onChange={(e) => handleChange("postLink", e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">কারণ / Reason for Removal</label>
                <select
                  value={formData.reason}
                  onChange={(e) => handleChange("reason", e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">অতিরিক্ত মন্তব্য / Additional Notes</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => handleChange("additionalNotes", e.target.value)}
                  placeholder="Any additional details..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Officer Info (auto-filled from country) */}
          <div className="border-t border-slate-700/50 pt-6">
            <h3 className="text-white font-semibold mb-5 flex flex-wrap items-center gap-x-2 gap-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs text-white shrink-0">4</span>
                কর্মকর্তা / Signing Officer
              </div>
              <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-700/50">
                Auto-filled from country
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">নাম / Name</label>
                <input
                  type="text"
                  value={formData.officerName || selectedCountry.officerName}
                  onChange={(e) => handleChange("officerName", e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-1.5">পদবি / Designation</label>
                <input
                  type="text"
                  value={formData.officerDesignation || selectedCountry.officerDesignation}
                  onChange={(e) => handleChange("officerDesignation", e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              কোর্ট অর্ডার তৈরি করুন / Generate Court Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
