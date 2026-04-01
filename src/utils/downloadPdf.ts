import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { OrderData } from "../App";
import { getCountryById } from "../data/countryData";
import type { CountryInfo } from "../data/countryData";

// ══════════════════════════════════════════════════════════════════════════════
//  MOBILE-ONLY: Build PDF programmatically with jsPDF (no html2canvas).
//  Same approach as the Admin Panel "Export PDF" which works 100% on mobile.
// ══════════════════════════════════════════════════════════════════════════════

function formatDateForPdf(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Draw the default programmatic seal (when no logo uploaded) ────────────
function drawDefaultSeal(
  doc: jsPDF,
  cx: number,
  cy: number,
  R: number,
  country: CountryInfo,
  pR: number, pG: number, pB: number,   // primary seal color RGB
  sR: number, sG: number, sB: number,   // secondary seal color RGB
): void {
  // Outer ring (thick)
  doc.setDrawColor(pR, pG, pB);
  doc.setLineWidth(0.9);
  doc.circle(cx, cy, R);

  // Gear teeth (36 small lines around outer ring)
  for (let i = 0; i < 36; i++) {
    const angle = (i * 10 * Math.PI) / 180;
    doc.setDrawColor(pR, pG, pB);
    doc.setLineWidth(0.4);
    doc.line(
      cx + Math.cos(angle) * (R - 1), cy + Math.sin(angle) * (R - 1),
      cx + Math.cos(angle) * (R + 1), cy + Math.sin(angle) * (R + 1),
    );
  }

  // Dashed middle ring
  doc.setDrawColor(sR, sG, sB);
  doc.setLineWidth(0.4);
  for (let i = 0; i < 36; i++) {
    const a1 = (i * 10 * Math.PI) / 180;
    const a2 = ((i * 10 + 5) * Math.PI) / 180;
    const r = R - 2;
    doc.line(
      cx + Math.cos(a1) * r, cy + Math.sin(a1) * r,
      cx + Math.cos(a2) * r, cy + Math.sin(a2) * r,
    );
  }

  // Inner ring (solid)
  doc.setDrawColor(pR, pG, pB);
  doc.setLineWidth(0.5);
  doc.circle(cx, cy, R - 3.5);

  // Dot decorations
  for (let i = 0; i < 20; i++) {
    const angle = (i * 18 * Math.PI) / 180;
    doc.setFillColor(sR, sG, sB);
    doc.circle(cx + Math.cos(angle) * (R - 2.8), cy + Math.sin(angle) * (R - 2.8), 0.4, "F");
  }

  // Inner circles
  doc.setDrawColor(pR, pG, pB);
  doc.setLineWidth(0.5);
  doc.circle(cx, cy, R - 7);
  doc.setDrawColor(sR, sG, sB);
  doc.setLineWidth(0.2);
  doc.circle(cx, cy, R - 7.5);

  // Top text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(pR, pG, pB);
  doc.text(country.sealTopText, cx, cy - R + 6, { align: "center" });

  // Center text
  doc.setFontSize(7);
  doc.text(country.sealCenterText, cx, cy + 1, { align: "center" });

  // "OFFICIAL SEAL"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(sR, sG, sB);
  doc.text("OFFICIAL SEAL", cx, cy + 5, { align: "center" });

  // Stars
  doc.setFontSize(4.5);
  doc.setTextColor(pR, pG, pB);

  // Bottom text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4);
  doc.text(country.sealBottomText, cx, cy + R - 4, { align: "center" });

  // SAMPLE watermark (light red)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 200, 200);
  doc.text("SAMPLE", cx, cy + 2, { align: "center", angle: 30 });
}

// ── Generate a QR code image as a data URL for embedding in PDF ──────────
function generateQRDataUrl(text: string, size: number): string {
  // Strategy 1: Try to capture the live react-qr-code SVG from the DOM
  const qrSvg =
    (document.querySelector('svg[viewBox="0 0 256 256"]') as SVGElement | null) ??
    (document.querySelector('svg[shape-rendering="crispEdges"]') as SVGElement | null);

  if (qrSvg) {
    // Serialize the live QR SVG to a base64 data URI (jsPDF can addImage with this)
    const svgData = new XMLSerializer().serializeToString(qrSvg);
    const base64 = btoa(unescape(encodeURIComponent(svgData)));
    return `data:image/svg+xml;base64,${base64}`;
  }

  // Strategy 2: Generate a deterministic QR-like pattern on canvas
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111827";

  const moduleCount = 21;
  const cellW = size / (moduleCount + 2);
  const offset = cellW;

  // Finder patterns (the three large squares in QR corners)
  const drawFinder = (fx: number, fy: number) => {
    ctx.fillStyle = "#111827";
    ctx.fillRect(fx, fy, cellW * 7, cellW * 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(fx + cellW, fy + cellW, cellW * 5, cellW * 5);
    ctx.fillStyle = "#111827";
    ctx.fillRect(fx + cellW * 2, fy + cellW * 2, cellW * 3, cellW * 3);
  };

  drawFinder(offset, offset);
  drawFinder(offset + cellW * 14, offset);
  drawFinder(offset, offset + cellW * 14);

  // Data modules — deterministic hash from the verification text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff;
  }

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if ((row < 8 && col < 8) || (row < 8 && col > 12) || (row > 12 && col < 8)) continue;
      if (row === 6 || col === 6) {
        if ((row + col) % 2 === 0) {
          ctx.fillStyle = "#111827";
          ctx.fillRect(offset + col * cellW, offset + row * cellW, cellW, cellW);
        }
        continue;
      }
      const bitIdx = row * moduleCount + col;
      const byteVal = (hash ^ (bitIdx * 7919)) & 0xff;
      if (byteVal % 3 !== 0) {
        ctx.fillStyle = "#111827";
        ctx.fillRect(offset + col * cellW, offset + row * cellW, cellW, cellW);
      }
    }
  }

  return canvas.toDataURL("image/png", 1.0);
}

// ── Generate the handwritten signature as an image using browser fonts ──
function generateSignatureImage(name: string): string {
  const canvas = document.createElement("canvas");
  // Multiplied by 3 for much crisper resolution in PDF (fixes subpixel aliasing)
  canvas.width = 1200;
  canvas.height = 300;
  const ctx = canvas.getContext("2d")!;
  
  // Need to make sure the font matches the requested "Alex Brush"
  ctx.font = "140px 'Alex Brush', cursive, serif";
  ctx.fillStyle = "#1e3a8a"; // text-blue-900 
  
  // Desktop has transform -rotate-1
  ctx.translate(15, 180); 
  ctx.rotate(-1 * Math.PI / 180); 
  
  ctx.fillText(name, 0, 0);
  
  return canvas.toDataURL("image/png");
}

// ── Render standard SVG securely into an ultra-sharp PNG DataURL ──
function svgToPngUrl(svgElement: SVGElement, scale: number = 4): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    // Standard OfficialSeal is 200x200
    canvas.width = 200 * scale;
    canvas.height = 200 * scale;
    const ctx = canvas.getContext("2d")!;
    
    // Inject any missing dimensions into SVG before serialization
    svgElement.setAttribute("width", "200");
    svgElement.setAttribute("height", "200");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png", 1.0));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}

async function buildCourtOrderPdfDirectly(data: OrderData, filename: string): Promise<void> {
  const country = getCountryById(data.country);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();   // ~210mm
  const ph = doc.internal.pageSize.getHeight();  // ~297mm
  const mx = 16;  // horizontal margin
  const cw = pw - mx * 2;  // content width

  let y = 16;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const ensureSpace = (needed: number) => {
    if (y + needed > ph - 12) { doc.addPage(); y = 16; }
  };

  const drawHLine = (yPos: number, lightness = 180) => {
    doc.setDrawColor(lightness, lightness, lightness);
    doc.setLineWidth(0.3);
    doc.line(mx, yPos, pw - mx, yPos);
  };

  // Wraps text to maxWidth, prints each line at x using current font, returns new y
  const printWrapped = (
    text: string,
    x: number,
    maxWidth: number,
    lineH: number,
  ): number => {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, x, y);
      y += lineH;
    }
    return y;
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };

  // ── Resolve data fields ─────────────────────────────────────────────────
  const priorityMap: Record<string, string> = {
    "সাধারণ": "NORMAL", "জরুরি": "URGENT", "অতি জরুরি": "CRITICAL",
  };
  const priorityLabel = priorityMap[data.priority] || "NORMAL";
  const directiveTime =
    data.priority === "অতি জরুরি" ? country.directiveTimeCritical :
    data.priority === "জরুরি"     ? country.directiveTimeUrgent :
                                    country.directiveTimeNormal;
  const officerName = data.officerName || country.officerName;
  const officerDesignation = data.officerDesignation || country.officerDesignation;
  const department = data.department || country.departmentName;
  const formattedDate = formatDateForPdf(data.date);

  // Verification code (same logic as OrderDocument.tsx)
  let verificationCode = data.verificationCode?.trim() || "";
  if (!verificationCode) {
    const numericBase = data.orderNo.replace(/[^0-9]/g, "");
    let hash = 0;
    for (let i = 0; i < numericBase.length; i++) {
      hash = (hash << 5) - hash + numericBase.charCodeAt(i);
      hash = hash & hash;
    }
    const hexSuffix = Math.abs(hash * 1337).toString(36).substring(0, 6).toUpperCase().padEnd(6, "X");
    verificationCode = `${country.id.toUpperCase()}-${numericBase}-${hexSuffix}`;
  }

  const [sealR, sealG, sealB] = hexToRgb(country.sealColors.primary);
  const [seal2R, seal2G, seal2B] = hexToRgb(country.sealColors.secondary);

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER  (matching OrderDocument.tsx exactly)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Top border line ────────────────────────────────────────────────────
  drawHLine(y);
  y += 8;

  // ── Government Header (centered, bold, large) ─────────────────────────
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  const headerText = data.courtName || country.governmentNameLine1;
  const headerLines = doc.splitTextToSize(headerText, cw) as string[];
  for (const hl of headerLines) {
    doc.text(hl, pw / 2, y, { align: "center" });
    y += 8;
  }
  y += 1;

  // ── Gradient-like separator ────────────────────────────────────────────
  drawHLine(y, 190);
  y += 5;

  // ── Department Name (centered, bold, medium) ──────────────────────────
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  const deptLines = doc.splitTextToSize(department, cw) as string[];
  for (const dl of deptLines) {
    doc.text(dl, pw / 2, y, { align: "center" });
    y += 5.5;
  }
  y += 1;

  // ── Separator ──────────────────────────────────────────────────────────
  drawHLine(y, 190);
  y += 7;

  // ── Order Title Box (centered, bordered, bold) ────────────────────────
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  const titleText = country.orderTitleText;
  const titleW = Math.min(doc.getTextWidth(titleText) + 18, cw);
  const titleX = (pw - titleW) / 2;
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.6);
  doc.rect(titleX, y - 5, titleW, 11);
  doc.text(titleText, pw / 2, y + 1.5, { align: "center" });
  y += 14;

  // ── Priority Badge (centered, rounded border) ────────────────────────
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const pText = `Priority: ${priorityLabel}`;
  const pW = doc.getTextWidth(pText) + 10;
  const pX = (pw - pW) / 2;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.roundedRect(pX, y - 3.5, pW, 7, 3.5, 3.5);
  doc.text(pText, pw / 2, y + 1, { align: "center" });
  y += 12;

  // ── Order Meta Info Row (Order No | Date | Country) ───────────────────
  ensureSpace(12);
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.roundedRect(mx, y - 4, cw, 11, 1.5, 1.5);

  const thirdW = cw / 3;
  doc.setFontSize(9);

  // Order No
  doc.setFont("times", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text("Order No:", mx + 4, y + 1.5);
  doc.setFont("times", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(data.orderNo, mx + 22, y + 1.5);

  // Date
  doc.setFont("times", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text("Date:", mx + thirdW + 4, y + 1.5);
  doc.setFont("times", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(formattedDate, mx + thirdW + 15, y + 1.5);

  // Country
  doc.setFont("times", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text("Country:", mx + thirdW * 2 + 4, y + 1.5);
  doc.setFont("times", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(country.nameEn, mx + thirdW * 2 + 21, y + 1.5);
  y += 16;

  // ── Subject Block (left border bar) ───────────────────────────────────
  ensureSpace(14);
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(1.2);
  doc.line(mx, y - 2, mx, y + 10);
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("Subject: Facebook Post Removal Order", mx + 5, y + 1);
  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text("To all concerned authorities — For immediate action and compliance", mx + 5, y + 6);
  y += 16;

  // ── Main Order Body (bordered box) ────────────────────────────────────
  ensureSpace(25);
  const bodyStartY = y - 3;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  y = printWrapped(country.orderBodyText, mx + 5, cw - 10, 4.8);
  y += 3;

  // Reason
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  ensureSpace(6);
  y = printWrapped(`Reason: ${data.reason}`, mx + 5, cw - 10, 4.8);
  y += 2;

  // Additional Notes
  if (data.additionalNotes) {
    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    // Left border for notes
    const notesStartY = y;
    y = printWrapped(`Additional Notes: ${data.additionalNotes}`, mx + 9, cw - 18, 4.5);
    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.5);
    doc.line(mx + 6, notesStartY - 2, mx + 6, y);
    y += 2;
  }
  y += 2;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.roundedRect(mx, bodyStartY, cw, y - bodyStartY, 1.5, 1.5);
  y += 7;

  // ── Details Table ─────────────────────────────────────────────────────
  const col1W = cw * 0.33;  // ~1/3 width for labels
  const rowH = 7.5;
  const tableRows: Array<[string, string, boolean]> = [
    ["Complainant Name", data.complainantName || "—", false],
    ["Complainant ID",   data.complainantId || "—",   true],
    ["Accused Name",     data.accusedName || "—",     false],
    ["Accused Profile",  data.accusedProfileLink || "—", true],
    ["Post Link",        data.postLink || "—",        false],
    ["Reason for Removal", data.reason,               true],
  ];

  ensureSpace(10 + rowH * (tableRows.length + 1));

  // Table header
  doc.setFillColor(243, 243, 243);
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.3);
  doc.rect(mx, y - 4, cw, rowH, "FD");
  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text("Description", mx + 4, y + 0.5);
  doc.text("Details", mx + col1W + 4, y + 0.5);
  y += rowH;

  // Table rows
  tableRows.forEach(([label, value, isAlt]) => {
    ensureSpace(rowH + 2);
    if (isAlt) {
      doc.setFillColor(250, 250, 250);
      doc.rect(mx, y - 4, cw, rowH, "F");
    }
    // Row bottom border
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(mx, y - 4 + rowH, pw - mx, y - 4 + rowH);

    // Label
    doc.setFont("times", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(label, mx + 4, y + 0.5);

    // Value — word-wrap long URLs
    const isLink = value.startsWith("http") || value.startsWith("www");
    doc.setFont("times", isLink ? "normal" : "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(isLink ? 29 : 40, isLink ? 78 : 40, isLink ? 216 : 40);
    const valLines = doc.splitTextToSize(value, cw - col1W - 8) as string[];
    doc.text(valLines[0], mx + col1W + 4, y + 0.5);
    // If multi-line value, extend row
    if (valLines.length > 1) {
      for (let li = 1; li < valLines.length; li++) {
        y += 3.5;
        doc.text(valLines[li], mx + col1W + 4, y + 0.5);
      }
    }
    y += rowH;
  });

  // Table outer border
  const tableTopY = y - rowH * tableRows.length - rowH - 4;
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.3);
  doc.roundedRect(mx, tableTopY, cw, y - tableTopY - 4, 1.5, 1.5);
  y += 7;

  // ── Legal References (bordered box) ───────────────────────────────────
  ensureSpace(25);
  const legalStartY = y;
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text(`Legal References — ${country.nameEn}`, mx + 5, y + 5);
  y += 10;

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  country.legalRefs.forEach((ref) => {
    ensureSpace(6);
    const refLines = doc.splitTextToSize(`• ${ref}`, cw - 14) as string[];
    for (const rl of refLines) {
      doc.text(rl, mx + 7, y);
      y += 4.2;
    }
    y += 1.5;
  });
  y += 3;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.roundedRect(mx, legalStartY, cw, y - legalStartY, 1.5, 1.5);
  y += 8;

  // ── Directives (bordered box, thicker border) ────────────────────────
  ensureSpace(35);
  const dirStartY = y;
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text("Directives:", mx + 5, y + 5);
  y += 11;

  const directives = [
    "The above-mentioned post must be immediately removed from the Facebook platform.",
    "Upon completion of removal, this office must be notified in writing.",
    "Legal action may be initiated against the concerned individual where applicable.",
    `This order must be executed within ${directiveTime} of issuance.`,
  ];
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  directives.forEach((d, i) => {
    ensureSpace(6);
    const dLines = doc.splitTextToSize(`${i + 1}. ${d}`, cw - 14) as string[];
    for (const dl of dLines) {
      doc.text(dl, mx + 7, y);
      y += 4.5;
    }
    y += 2.5;
  });
  y += 3;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.6);
  doc.roundedRect(mx, dirStartY, cw, y - dirStartY, 1.5, 1.5);
  y += 14;

  // ══════════════════════════════════════════════════════════════════════════
  //  SIGNATURE + SEAL SECTION (side by side, matching desktop flex-row)
  // ══════════════════════════════════════════════════════════════════════════
  ensureSpace(70);

  // Top separator line
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.6);
  doc.line(mx, y, pw - mx, y);
  y += 8;

  const sigSectionY = y;

  // ── LEFT SIDE: Officer Signature ─────────────────────────────────────

  // Signature name — generated as an image to perfectly capture the 'Allura' font
  try {
    const sigImgUrl = generateSignatureImage(officerName);
    const sigImgWidth = Math.max(doc.getTextWidth(officerName) + 20, 50); // Scale appropriately
    const sigImgHeight = 12.5; 
    doc.addImage(sigImgUrl, "PNG", mx + 2, y, sigImgWidth, sigImgHeight);
  } catch {
    // Fallback if canvas generation fails
    doc.setFont("times", "bolditalic");
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // dark blue-900 like desktop
    doc.text(officerName, mx + 4, y + 8);
  }
  y += 12;

  // Signature underline
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.4);
  const sigLineWidth = Math.max(doc.getTextWidth(officerName) + 12, 55);
  doc.line(mx + 4, y, mx + 4 + sigLineWidth, y);
  y += 6;

  // Printed name (bold)
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(officerName, mx + 4, y);
  y += 4.5;

  // "Authorized Signature" label
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Authorized Signature", mx + 4, y);
  y += 6;

  // Designation
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(70, 70, 70);
  doc.text(officerDesignation, mx + 4, y);
  y += 4.5;

  // Department
  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text(department, mx + 4, y);
  y += 5;

  // Date
  doc.setFont("times", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text(`Date: ${formattedDate}`, mx + 4, y);

  // ── RIGHT SIDE: Official Seal ────────────────────────────────────────
  const sealCenterX = pw - mx - 30;
  const sealR_outer = 21;                // Clean large seal
  const sealCenterY = sigSectionY + sealR_outer + 8; // Centered comfortably below label

  // "OFFICIAL SEAL — COUNTRY" label above seal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `OFFICIAL SEAL — ${country.nameEn.toUpperCase()}`,
    sealCenterX,
    sigSectionY + 2,
    { align: "center" },
  );

  if (data.logoUrl) {
    // ── User uploaded a custom seal image → embed it ──
    try {
      const sealImgSize = sealR_outer * 2;
      doc.addImage(
        data.logoUrl,
        "PNG",
        sealCenterX - sealImgSize / 2,
        sealCenterY - sealImgSize / 2,
        sealImgSize,
        sealImgSize,
      );
    } catch {
      drawDefaultSeal(doc, sealCenterX, sealCenterY, sealR_outer, country, sealR, sealG, sealB, seal2R, seal2G, seal2B);
    }
  } else {
    // ── Natively capture the highly complex OfficialSeal SVG directly from the DOM! ──
    const sealSvgDom = document.querySelector('svg[viewBox="0 0 200 200"]') as SVGElement | null;
    const sealImgSize = sealR_outer * 2;
    
    if (sealSvgDom) {
      try {
        const domSealDataUrl = await svgToPngUrl(sealSvgDom, 5); // very high resolution
        if (domSealDataUrl) {
          doc.addImage(
            domSealDataUrl, 
            "PNG", 
            sealCenterX - sealImgSize / 2, 
            sealCenterY - sealImgSize / 2, 
            sealImgSize, 
            sealImgSize
          );
        } else {
          drawDefaultSeal(doc, sealCenterX, sealCenterY, sealR_outer, country, sealR, sealG, sealB, seal2R, seal2G, seal2B);
        }
      } catch {
         drawDefaultSeal(doc, sealCenterX, sealCenterY, sealR_outer, country, sealR, sealG, sealB, seal2R, seal2G, seal2B);
      }
    } else {
      drawDefaultSeal(doc, sealCenterX, sealCenterY, sealR_outer, country, sealR, sealG, sealB, seal2R, seal2G, seal2B);
    }
  }

  // Ensure y is below both signature and seal
  y = Math.max(y + 6, sealCenterY + sealR_outer + 6);
  y += 6;

  // ══════════════════════════════════════════════════════════════════════════
  //  VERIFICATION CODE BOX (with real QR code)
  // ══════════════════════════════════════════════════════════════════════════
  ensureSpace(32);
  const vcBoxH = 28;

  doc.setFillColor(243, 244, 246); // matches bg-gray-100
  doc.setDrawColor(209, 213, 219); // matches border-gray-300
  doc.setLineWidth(0.4);
  doc.roundedRect(mx, y, cw, vcBoxH, 2.5, 2.5, "FD");

  // Left side: label + verification code
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text("Document Verification Code", mx + 8, y + 8);

  doc.setFont("courier", "bold");
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55); // gray-800
  // Natural layout without artificial spreading
  doc.text(verificationCode, mx + 8, y + 17);

  // Right side: QR code (white box specifically containing only the QR)
  const qrPdfSize = 18;
  const qrContainerW = 20; // Shrink inner box to just wrap QR
  const qrX = pw - mx - qrContainerW - 4;
  const qrY = y + 2;

  // White background inner box for QR
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX, qrY, qrContainerW, qrContainerW, 1.5, 1.5, "FD");

  // Generate and embed real QR code image
  try {
    const qrDataUrl = generateQRDataUrl(`VERIFICATION-CODE:${verificationCode}`, 512);
    // Center QR in the white container (20 - 18 = 2 -> padding 1)
    doc.addImage(qrDataUrl, "PNG", qrX + 1, qrY + 1, qrPdfSize, qrPdfSize);
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("QR", qrX + qrContainerW / 2, qrY + qrContainerW / 2, { align: "center" });
  }

  // "SCAN TO VERIFY" label UNDER the white QR box 
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(107, 114, 128);
  // Places text perfectly below the white bounding box but still inside the gray VC box
  doc.text("SCAN TO VERIFY", qrX + qrContainerW / 2, qrY + qrContainerW + 3.5, { align: "center" });

  y += vcBoxH + 12;

  // ══════════════════════════════════════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  ensureSpace(10);
  drawHLine(y, 220);
  y += 4;
  doc.setFont("times", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(170, 170, 170);
  doc.text(`Computer Generated Document — ${country.nameEn}`, mx, y);
  doc.text("Page 1/1", pw - mx, y, { align: "right" });

  y += 6;
  drawHLine(y);

  // ── Save ──────────────────────────────────────────────────────────────
  doc.save(`${filename}.pdf`);
}


// ══════════════════════════════════════════════════════════════════════════════
//  DESKTOP: Original html2canvas approach (works perfectly on desktop).
// ══════════════════════════════════════════════════════════════════════════════

async function downloadViaHtml2Canvas(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const A4_PX_WIDTH = 794;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    top: -220vh;
    left: 0;
    width: ${A4_PX_WIDTH}px;
    overflow: visible;
    background: #ffffff;
    z-index: -9999;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    opacity: 1;
    pointer-events: none;
  `;
  document.body.appendChild(container);

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = `
    width: ${A4_PX_WIDTH}px;
    background: #ffffff;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: none;
    border-radius: 0;
    margin: 0;
    padding: 0;
  `;
  container.appendChild(clone);

  clone.setAttribute("data-pdf-target", "true");
  const pdfStyle = document.createElement("style");
  pdfStyle.id = "pdf-temp-style";
  pdfStyle.textContent = `
    [data-pdf-target] .text-gray-300,
    [data-pdf-target] .text-gray-400 { color: #374151 !important; }
    [data-pdf-target] .text-gray-500,
    [data-pdf-target] .text-gray-600 { color: #1f2937 !important; }
    [data-pdf-target] .text-blue-700  { color: #1d4ed8 !important; }
  `;
  document.head.appendChild(pdfStyle);

  const scale = isIOS ? 1.5 : 2;
  const paintDelay = isIOS ? 400 : 200;
  await new Promise(resolve => setTimeout(resolve, paintDelay));

  try {
    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: A4_PX_WIDTH,
      windowWidth: A4_PX_WIDTH,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc: Document) => {
        clonedDoc.querySelectorAll("style").forEach((styleEl) => {
          if (styleEl.textContent && styleEl.textContent.includes("oklch")) {
            styleEl.textContent = styleEl.textContent.replace(
              /oklch\([^)]*\)/gi,
              "transparent",
            );
          }
        });
      },
    });

    const imgW = canvas.width;
    const imgH = canvas.height;
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const ratio = pdfW / imgW;
    const totalPdfH = imgH * ratio;

    if (totalPdfH <= pdfH) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfW, totalPdfH);
    } else {
      const pageImgH = Math.floor(pdfH / ratio);
      let offsetPx = 0;
      let pageIdx = 0;
      while (offsetPx < imgH) {
        if (pageIdx > 0) pdf.addPage();
        const sliceH = Math.min(pageImgH, imgH - offsetPx);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgW;
        pageCanvas.height = sliceH;
        const ctx = pageCanvas.getContext("2d");
        ctx?.drawImage(canvas, 0, offsetPx, imgW, sliceH, 0, 0, imgW, sliceH);
        pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfW, sliceH * ratio);
        offsetPx += sliceH;
        pageIdx++;
      }
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    if (container.parentNode) container.parentNode.removeChild(container);
    const injectedStyle = document.getElementById("pdf-temp-style");
    if (injectedStyle?.parentNode) injectedStyle.parentNode.removeChild(injectedStyle);
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  PUBLIC ENTRY POINT
// ══════════════════════════════════════════════════════════════════════════════

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  orderData?: OrderData,
): Promise<void> {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && orderData) {
    // Mobile: use direct jsPDF approach (like Admin Panel Export PDF).
    // This avoids html2canvas entirely — no oklch errors, no print dialog.
    await buildCourtOrderPdfDirectly(orderData, filename);
    return;
  }

  // Desktop: use html2canvas for pixel-perfect capture.
  await downloadViaHtml2Canvas(element, filename);
}
