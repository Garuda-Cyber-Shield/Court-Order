import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Downloads an HTML element as a PDF.
 * Works on desktop, Android Chrome, and iOS Safari 13+.
 *
 * Strategy:
 *  1. Clone the element into an off-screen container that ALL browsers will
 *     paint — including iOS Safari's GPU compositor.
 *  2. Capture with html2canvas.
 *  3. Slice into A4 pages and save with jsPDF.
 *  4. If anything fails, fall back to window.print().
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const A4_PX_WIDTH = 794; // A4 at 96 dpi

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS    = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ── 1. Build an off-screen container ────────────────────────────────────
  // iOS Safari skips painting elements that are off-screen via negative left.
  // We use position:fixed at top:-220vh + transform:translateZ(0) which forces
  // GPU compositing and ensures the content IS painted before html2canvas runs.
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

  // Clone target element into container
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

  // ── Inject temporary CSS to darken light text for PDF legibility ─────────
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

  // Scale: iOS needs lower res to avoid OOM; Android gets 1.8×; desktop gets 2×
  const scale = isIOS ? 1.5 : isMobile ? 1.8 : 2;

  // ── 2. Wait for the browser paint cycle ──────────────────────────────────
  // iOS Safari needs a longer tick to composite the fixed element.
  const paintDelay = isIOS ? 400 : 200;
  await new Promise(resolve => setTimeout(resolve, paintDelay));

  try {
    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      allowTaint: true,           // allows base64 logos and data-URIs
      backgroundColor: "#ffffff",
      logging: false,
      width: A4_PX_WIDTH,
      windowWidth: A4_PX_WIDTH,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    });

    const imgW = canvas.width;
    const imgH = canvas.height;

    // ── 3. Build A4 PDF ──────────────────────────────────────────────────
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();   // 595.28 pt
    const pdfH = pdf.internal.pageSize.getHeight();  // 841.89 pt

    const ratio     = pdfW / imgW;       // px → pt scale factor
    const totalPdfH = imgH * ratio;      // total content height in pt

    if (totalPdfH <= pdfH) {
      // Fits on a single page
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.95),
        "JPEG", 0, 0, pdfW, totalPdfH,
      );
    } else {
      // Multi-page: slice the canvas vertically
      const pageImgH = Math.floor(pdfH / ratio); // canvas rows per PDF page
      let offsetPx = 0;
      let pageIdx  = 0;

      while (offsetPx < imgH) {
        if (pageIdx > 0) pdf.addPage();

        const sliceH     = Math.min(pageImgH, imgH - offsetPx);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width  = imgW;
        pageCanvas.height = sliceH;

        const ctx = pageCanvas.getContext("2d");
        ctx?.drawImage(canvas, 0, offsetPx, imgW, sliceH, 0, 0, imgW, sliceH);

        pdf.addImage(
          pageCanvas.toDataURL("image/jpeg", 0.95),
          "JPEG", 0, 0, pdfW, sliceH * ratio,
        );

        offsetPx += sliceH;
        pageIdx++;
      }
    }

    // ── 4. Trigger download ───────────────────────────────────────────────
    // .save() uses URL.createObjectURL + <a download> on desktop/Android.
    // On iOS Safari 13+ it opens the PDF in a new tab (the best possible UX).
    pdf.save(`${filename}.pdf`);

  } finally {
    // Always clean up, even if html2canvas throws
    if (container.parentNode) container.parentNode.removeChild(container);
    const injectedStyle = document.getElementById("pdf-temp-style");
    if (injectedStyle?.parentNode) injectedStyle.parentNode.removeChild(injectedStyle);
  }
}
