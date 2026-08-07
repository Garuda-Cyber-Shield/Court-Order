import { useMemo } from "react";
import QRCode from "react-qr-code";
import type { OrderData } from "../App";
import { getCountryById } from "../data/countryData";
import OfficialSeal from "./OfficialSeal";

interface Props {
  data: OrderData;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function OrderDocument({ data }: Props) {
  const country = getCountryById(data.country);

  const priorityLabels: Record<string, { label: string; color: string }> = {
    "সাধারণ": { label: "NORMAL", color: "bg-green-100 text-green-800 border-green-300" },
    "জরুরি": { label: "URGENT", color: "bg-amber-100 text-amber-800 border-amber-300" },
    "অতি জরুরি": { label: "CRITICAL", color: "bg-red-100 text-red-800 border-red-300" },
  };

  // Create a persistent, reproducible verification code bound strictly to the order ID
  const verificationCode = useMemo(() => {
    // If user provided a verification code, use it
    if (data.verificationCode && data.verificationCode.trim()) {
      return data.verificationCode;
    }

    // Otherwise, we use a deterministic approach based on the order numbers
    const numericBase = data.orderNo.replace(/[^0-9]/g, "");
    
    // Create a pseudo-random 6-character hex hash from the numbers
    let hash = 0;
    for (let i = 0; i < numericBase.length; i++) {
      hash = (hash << 5) - hash + numericBase.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const hexSuffix = Math.abs(hash * 1337).toString(36).substring(0, 6).toUpperCase().padEnd(6, 'X');
    
    return `${country.id.toUpperCase()}-${numericBase}-${hexSuffix}`;
  }, [country.id, data.orderNo, data.verificationCode]);

  const priorityInfo = priorityLabels[data.priority] || priorityLabels["সাধারণ"];

  const getDirectiveTime = () => {
    if (data.priority === "অতি জরুরি") return country.directiveTimeCritical;
    if (data.priority === "জরুরি") return country.directiveTimeUrgent;
    return country.directiveTimeNormal;
  };

  const officerName = data.officerName || country.officerName;
  const officerDesignation = data.officerDesignation || country.officerDesignation;
  const department = data.department || country.departmentName;

  // Generate a proper signature for each officer name
  const renderSignature = () => {
    const signName = officerName;
    
    // Detect if the name contains Bengali characters (Unicode range: U+0980-U+09FF)
    const isBengaliName = /[\u0980-\u09FF]/.test(signName);
    
    // Use separate fonts for handwritten signature and typed name label
    const signatureFont = isBengaliName
      ? "'Noto Sans Bengali', 'Hind Siliguri', sans-serif"
      : "'Great Vibes', 'Dancing Script', cursive";
    const nameFont = isBengaliName
      ? "'Noto Sans Bengali', 'Hind Siliguri', sans-serif"
      : "'Times New Roman', Times, serif";
    
    return (
      <div className="relative w-52">
        {/* Signature with handwriting-like font (must appear above line) */}
        <p 
          className={`text-2xl mb-1 leading-none ${isBengaliName ? "font-medium" : "font-normal italic"}`}
          style={{ fontFamily: signatureFont, fontWeight: 500, color: "#3f2a7d" }}
        >
          {signName}
        </p>
        {/* Formal signature line */}
        <div className="border-b-2 border-gray-800 w-full"></div>
        {/* Printed name under the line */}
        <p className="text-base text-gray-900 mt-1.5 font-semibold" style={{ fontFamily: nameFont }}>
          {signName}
        </p>
        <p className="text-xs text-gray-600">Authorized Signature</p>
      </div>
    );
  };

  return (
    <div
      className="court-order-document bg-white w-full max-w-[210mm] mx-auto"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
      }}
    >

      <div className="relative z-10 p-8 md:p-12 print:p-5">
        {/* Top Border Design */}
        <div className="pb-2 mb-6 border-t border-gray-300"></div>

        {/* Header */}
        <div className="text-center mb-8 print:mb-4">
          <div className="flex items-center justify-center gap-4 mb-3">
            {/* Country Flag + Emblem Area */}
            <div className="hidden">
              <span className="text-4xl mb-1">{country.flag}</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-wider">
                {data.courtName || country.governmentNameLine1}
              </h1>
            </div>
          </div>

          <div className="bg-gradient-to-r from-transparent via-gray-300 to-transparent h-px my-3"></div>

          <h2 className="text-lg font-bold text-gray-900 tracking-wide">
            {department}
          </h2>

          <div className="bg-gradient-to-r from-transparent via-gray-300 to-transparent h-px my-4"></div>

          {/* Order Title */}
          <div className="inline-block mt-2">
            <div
              className="text-gray-900 px-8 py-2.5 rounded-sm border-2 border-gray-800"
            >
              <h3 className="text-xl font-bold tracking-wider">
                {country.orderTitleText}
              </h3>
            </div>
          </div>

          {/* Priority Badge */}
          <div className="mt-3">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-bold border border-gray-500 text-gray-800 bg-white">
              Priority: {priorityInfo.label}
            </span>
          </div>
        </div>

          {/* Order Meta Info */}
          <div className="flex flex-wrap justify-between items-center bg-white border border-gray-400 rounded-lg px-6 py-3 mb-8 text-sm print:mb-4 print:py-2">
            <div>
              <span className="text-gray-500">Order No:</span>{" "}
              <span className="font-bold text-gray-800">{data.orderNo}</span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>{" "}
              <span className="font-bold text-gray-800">{formatDate(data.date)}</span>
            </div>
            <div>
              <span className="text-gray-500">Country:</span>{" "}
              <span className="font-bold text-gray-800">{country.nameEn}</span>
            </div>
          </div>

          {/* Order Body */}
          <div className="space-y-6 text-gray-800 leading-relaxed print:space-y-4">
            {/* Reference & Subject */}
            <div className="border-l-4 pl-4 border-gray-700">
              <p className="font-bold text-gray-900 mb-1">Subject: Facebook Post Removal Order</p>
              <p className="text-sm text-gray-600">
                To all concerned authorities — For immediate action and compliance
              </p>
            </div>

            {/* Main Order Text */}
            <div className="pdf-section bg-white border border-gray-400 rounded-lg p-6 print:p-4">
              <p className="mb-4 text-justify">{country.orderBodyText}</p>
              <p className="font-semibold mb-3 text-gray-900">
                Reason: {data.reason}
              </p>
              {data.additionalNotes && (
                <p className="text-gray-700 italic border-l-2 border-gray-300 pl-3">
                  Additional Notes: {data.additionalNotes}
                </p>
              )}
            </div>

            {/* Details Table */}
            <div className="pdf-section overflow-hidden rounded-lg border border-gray-300">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2.5 text-left text-gray-900 w-1/3">Description</th>
                    <th className="px-4 py-2.5 text-left text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-4 py-3 font-semibold text-gray-600">Complainant Name</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{data.complainantName || "—"}</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-600">Complainant ID</td>
                    <td className="px-4 py-3 text-gray-800">{data.complainantId || "—"}</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-4 py-3 font-semibold text-gray-600">Accused Name</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{data.accusedName || "—"}</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-600">Accused Profile</td>
                    <td className="px-4 py-3 text-blue-700 break-all">{data.accusedProfileLink || "—"}</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-4 py-3 font-semibold text-gray-600">Post Link</td>
                    <td className="px-4 py-3 text-blue-700 break-all font-medium">{data.postLink || "—"}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-600">Reason for Removal</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{data.reason}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legal References */}
            <div className="pdf-section bg-white border border-gray-400 rounded-lg p-5 print:p-4">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                Legal References — {country.nameEn}
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                {country.legalRefs.map((ref, i) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            </div>

            {/* Directive */}
            <div className="pdf-section border-2 rounded-lg p-5 bg-white border-gray-400 print:p-4">
              <h4 className="font-bold mb-2 text-gray-900">Directives:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-900">
                <li>The above-mentioned post must be immediately removed from the Facebook platform.</li>
                <li>Upon completion of removal, this office must be notified in writing.</li>
                <li>Legal action may be initiated against the concerned individual where applicable.</li>
                <li>This order must be executed within <strong>{getDirectiveTime()}</strong> of issuance.</li>
              </ol>
            </div>

            {/* ========== SIGNATURE AND SEAL SECTION ========== */}
            <div className="pdf-section mt-12 pt-6 border-t-2 border-gray-200 print:mt-6 print:pt-4 print:break-inside-avoid">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 print:flex-row print:items-end print:gap-6 print:justify-between">
                {/* Officer Signature Area */}
                <div className="text-center md:text-left print:text-left print:w-1/2">
                  <div className="mb-2">
                    {renderSignature()}
                  </div>
                  <p className="text-gray-600">{officerDesignation}</p>
                  <p className="text-gray-500 text-sm">{department}</p>
                  <p className="text-gray-400 text-xs mt-1">Date: {formatDate(data.date)}</p>
                </div>

                {/* Official Seal */}
                <div className="flex flex-col items-center print:items-center print:w-1/2">
                  <p className="text-xs text-gray-400 mb-2 tracking-wider uppercase">Official Seal — {country.nameEn}</p>
                  <div className="opacity-85">
                    {data.logoUrl ? (
                      <img src={data.logoUrl} alt="Official Seal" className="w-44 h-44 object-contain" />
                    ) : (
                      <OfficialSeal country={country} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Code Box */}
            <div className="pdf-section mt-8 bg-gray-100 border border-gray-300 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 print:mt-4 print:p-3 print:break-inside-avoid">
              <div>
                <p className="text-xs text-gray-500 mb-1">Document Verification Code</p>
                <p className="font-mono font-bold text-gray-800 text-lg tracking-widest">
                  {verificationCode}
                </p>
              </div>
              <div className="text-center shrink-0">
                {/* Real Live QR Code mapped to verification data */}
                <div className="w-36 h-36 sm:w-40 sm:h-40 p-3 bg-white border border-gray-300 rounded-md flex items-center justify-center">
                  <QRCode
                    value={`VERIFICATION-CODE:${verificationCode}`}
                    size={128}
                    bgColor="#ffffff"
                    fgColor="#111827"
                    level="M"
                    aria-label={`Verification QR code for ${verificationCode}`}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 font-semibold">SCAN TO VERIFY</p>
              </div>
            </div>

            {/* Footer */}
            <div className="pdf-section mt-6 pt-4 border-t border-gray-200 print:mt-3 print:pt-2">
              <div className="flex flex-wrap justify-between items-center text-xs text-gray-400">
                <p>Computer Generated Document — {country.nameEn}</p>
                <p>Page 1/1</p>
              </div>
            </div>
          </div>

          {/* Bottom Border Design */}
          <div className="mt-8 border-b border-gray-300"></div>
        </div>
    </div>
  );
}
