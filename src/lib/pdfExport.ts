import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import { Member, CardTemplate, Organization } from '../types';

export interface PdfExportOptions {
  layout: 'cr80' | 'single-sheet' | 'a4';
  action: 'download' | 'print';
}

let cachedRegularFontB64: string | null = null;
let cachedBoldFontB64: string | null = null;

async function loadFontAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.warn(`Font load failed for ${url}:`, err);
    return null;
  }
}

async function ensureBengaliFont(pdf: jsPDF): Promise<string> {
  try {
    if (!cachedRegularFontB64) {
      cachedRegularFontB64 = await loadFontAsBase64('/fonts/HindSiliguri-Regular.ttf');
    }
    if (!cachedBoldFontB64) {
      cachedBoldFontB64 = await loadFontAsBase64('/fonts/HindSiliguri-Bold.ttf');
    }

    if (cachedRegularFontB64) {
      pdf.addFileToVFS('HindSiliguri-Regular.ttf', cachedRegularFontB64);
      pdf.addFont('HindSiliguri-Regular.ttf', 'HindSiliguri', 'normal');
    }
    if (cachedBoldFontB64) {
      pdf.addFileToVFS('HindSiliguri-Bold.ttf', cachedBoldFontB64);
      pdf.addFont('HindSiliguri-Bold.ttf', 'HindSiliguri', 'bold');
    }

    if (cachedRegularFontB64 || cachedBoldFontB64) {
      return 'HindSiliguri';
    }
  } catch (err) {
    console.warn('Could not register HindSiliguri font in jsPDF:', err);
  }
  return 'helvetica';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = (hex || '#059669').replace('#', '');
  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16),
    };
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

async function loadImageAsDataUrl(url: string | undefined): Promise<string | null> {
  if (!url || !url.trim()) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
          return;
        }
      } catch (e) {
        console.warn('Image canvas conversion failed', e);
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function generateBarcodeDataUrl(value: string): string {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value || 'ORG-000001', {
      format: 'CODE128',
      width: 2.2,
      height: 48,
      fontSize: 14,
      margin: 4,
      displayValue: true,
      background: '#ffffff',
      lineColor: '#0f172a',
    });
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('Failed to generate barcode on canvas', e);
    return '';
  }
}

async function svgToHighResPng(svgElement: SVGElement, scale = 4): Promise<string> {
  return new Promise((resolve) => {
    try {
      const xml = new XMLSerializer().serializeToString(svgElement);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const image64 = 'data:image/svg+xml;base64,' + svg64;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = (svgElement.clientWidth || parseInt(svgElement.getAttribute('width') || '100', 10)) * scale;
          const height = (svgElement.clientHeight || parseInt(svgElement.getAttribute('height') || '100', 10)) * scale;
          canvas.width = Math.max(width, 240);
          canvas.height = Math.max(height, 240);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {
          console.warn('SVG canvas conversion error', e);
        }
        resolve(image64);
      };
      img.onerror = () => resolve('');
      img.src = image64;
    } catch (e) {
      console.warn('SVG serialization error', e);
      resolve('');
    }
  });
}

function drawVectorFrontCard({
  pdf,
  x,
  y,
  member,
  organization,
  template,
  fontFamily,
  photoDataUrl,
  logoDataUrl,
}: {
  pdf: jsPDF;
  x: number;
  y: number;
  member: Member;
  organization?: Organization;
  template: CardTemplate;
  fontFamily: string;
  photoDataUrl: string | null;
  logoDataUrl: string | null;
}) {
  const primaryRgb = hexToRgb(template.primaryColor || '#059669');

  // 1. Base Card Background (50mm x 80mm with subtle border)
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, 50, 80, 2.5, 2.5, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(x, y, 50, 80, 2.5, 2.5, 'D');

  // 2. Top Header Banner
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(x, y, 50, 21, 'F');

  // 3. Organization Logo
  const hasLogo = Boolean(logoDataUrl);
  if (logoDataUrl) {
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x + 25, y + 6, 4, 'F');
    pdf.addImage(logoDataUrl, 'PNG', x + 21.25, y + 2.25, 7.5, 7.5);
  }

  // 4. Organization Name (Selectable Vector Text!)
  const orgName = organization?.name || 'Organization Name';
  pdf.setTextColor(255, 255, 255);
  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(7.8);
  pdf.text(orgName, x + 25, y + (hasLogo ? 14.5 : 11), { align: 'center', maxWidth: 46 });

  // 5. Member Photo Frame (Centered: 14mm from left)
  const frameX = x + 14;
  const frameY = y + 15.5;
  const frameW = 22;
  const frameH = 26;

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(frameX, frameY, frameW, frameH, 2, 2, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(frameX, frameY, frameW, frameH, 2, 2, 'D');

  const photoInnerX = frameX + 0.8;
  const photoInnerY = frameY + 0.8;
  const photoInnerW = frameW - 1.6;
  const photoInnerH = frameH - 1.6;

  if (photoDataUrl) {
    pdf.addImage(photoDataUrl, 'JPEG', photoInnerX, photoInnerY, photoInnerW, photoInnerH);
  } else {
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH, 1.5, 1.5, 'F');
    pdf.setTextColor(148, 163, 184);
    pdf.setFont(fontFamily, 'bold');
    pdf.setFontSize(7);
    pdf.text('PHOTO', x + 25, frameY + 14, { align: 'center' });
  }

  // 6. Member Name & Designation (Selectable Vector Text!)
  const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member Name';
  pdf.setTextColor(15, 23, 42);
  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(9.5);
  pdf.text(fullName, x + 25, y + 46, { align: 'center', maxWidth: 46 });

  const designation = member.designation || 'Member';
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(6);
  pdf.text(designation.toUpperCase(), x + 25, y + 49.5, { align: 'center', maxWidth: 46 });

  // 7. Info Details Table (Selectable Vector Text!)
  const memberId = member.memberId || 'ORG-000001';
  const phone = member.phone || '';
  const nid = member.nid || member.customFields?.nid || '';
  const bloodGroup = member.bloodGroup || member.customFields?.bloodGroup || '';

  const rows: { label: string; value: string; isBlood?: boolean }[] = [];
  if (memberId) rows.push({ label: 'ID No', value: memberId });
  if (phone) rows.push({ label: 'Phone', value: phone });
  if (nid) rows.push({ label: 'NID', value: nid });
  if (bloodGroup) rows.push({ label: 'Blood Grp', value: bloodGroup, isBlood: true });

  let curY = y + 54.5;
  for (const row of rows) {
    pdf.setFont(fontFamily, 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(row.label, x + 3.8, curY);

    pdf.setTextColor(148, 163, 184);
    pdf.text(':', x + 16, curY);

    if (row.isBlood) {
      pdf.setTextColor(220, 38, 38);
    } else {
      pdf.setTextColor(15, 23, 42);
    }
    pdf.setFont(fontFamily, 'bold');
    pdf.text(row.value, x + 18, curY);
    curY += 4.5;
  }

  // 8. Bottom Accent Strip
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(x, y + 77.5, 50, 2.5, 'F');
}

function drawVectorBackCard({
  pdf,
  x,
  y,
  member,
  organization,
  template,
  fontFamily,
  barcodeDataUrl,
  qrDataUrl,
}: {
  pdf: jsPDF;
  x: number;
  y: number;
  member: Member;
  organization?: Organization;
  template: CardTemplate;
  fontFamily: string;
  barcodeDataUrl: string;
  qrDataUrl: string;
}) {
  const primaryRgb = hexToRgb(template.primaryColor || '#059669');

  // 1. Base Card Background
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, 50, 80, 2.5, 2.5, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(x, y, 50, 80, 2.5, 2.5, 'D');

  // 2. Top Header Strip
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(x, y, 50, 4, 'F');

  // 3. Barcode
  if (barcodeDataUrl) {
    pdf.addImage(barcodeDataUrl, 'PNG', x + 4, y + 5.2, 42, 8.8);
  }

  // 4. Address Section (Selectable Vector Text!)
  pdf.setTextColor(30, 41, 59);
  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(6.5);
  pdf.text('Address Details', x + 3.8, y + 18);

  pdf.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setLineWidth(0.25);
  pdf.line(x + 3.8, y + 18.8, x + 46.2, y + 18.8);

  const village = member.village || member.customFields?.village || member.address || '';
  const postOffice = member.postOffice || member.customFields?.postOffice || '';
  const thana = member.thana || member.customFields?.thana || '';
  const district = member.district || member.customFields?.district || '';

  const addrRows: { label: string; value: string }[] = [];
  if (village) addrRows.push({ label: 'Village/Area', value: village });
  if (postOffice) addrRows.push({ label: 'Post Office', value: postOffice });
  if (thana) addrRows.push({ label: 'Thana / P.S.', value: thana });
  if (district) addrRows.push({ label: 'District', value: district });

  let addrY = y + 22.5;
  for (const row of addrRows) {
    pdf.setFont(fontFamily, 'bold');
    pdf.setFontSize(5.2);
    pdf.setTextColor(100, 116, 139);
    pdf.text(row.label, x + 3.8, addrY);

    pdf.setTextColor(148, 163, 184);
    pdf.text(':', x + 16, addrY);

    pdf.setTextColor(30, 41, 59);
    pdf.setFont(fontFamily, 'normal');
    pdf.text(row.value, x + 18, addrY, { maxWidth: 28 });
    addrY += 3.8;
  }

  // 5. Office / Contact Section (Selectable Vector Text!)
  pdf.setTextColor(30, 41, 59);
  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(6.5);
  pdf.text('Office / Contact', x + 3.8, y + 36.5);

  pdf.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setLineWidth(0.25);
  pdf.line(x + 3.8, y + 37.3, x + 46.2, y + 37.3);

  let offY = y + 41;
  pdf.setFont(fontFamily, 'normal');
  pdf.setFontSize(4.6);
  pdf.setTextColor(71, 85, 105);
  if (organization?.address) {
    pdf.text(organization.address, x + 3.8, offY, { maxWidth: 42 });
    offY += 3.3;
  }
  if (organization?.phone) {
    pdf.text(`Phone: ${organization.phone}`, x + 3.8, offY, { maxWidth: 42 });
    offY += 3.1;
  }
  if (organization?.email) {
    pdf.text(`Email: ${organization.email}`, x + 3.8, offY, { maxWidth: 42 });
    offY += 3.1;
  }

  // 6. QR Code Frame & High-Res Image
  const qrBoxX = x + 17.5;
  const qrBoxY = y + 53;
  const qrBoxSize = 15;

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 1.5, 1.5, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 1.5, 1.5, 'D');

  if (qrDataUrl) {
    pdf.addImage(qrDataUrl, 'PNG', qrBoxX + 1, qrBoxY + 1, qrBoxSize - 2, qrBoxSize - 2);
  }

  // 7. Bottom Disclaimer / Notice (Selectable Vector Text!)
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(x, y + 74.5, 50, 5.5, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont(fontFamily, 'normal');
  pdf.setFontSize(4.5);
  const notice = (organization?.noticeText && !/[\u0980-\u09FF]/.test(organization.noticeText))
    ? organization.noticeText
    : 'If found, please return this card to the central office.';
  pdf.text(notice, x + 25, y + 78, { align: 'center', maxWidth: 46 });
}

export async function generateIdCardPdf({
  frontElement,
  backElement,
  member,
  template,
  organization,
  options = { layout: 'cr80', action: 'download' },
}: {
  frontElement?: HTMLElement | null;
  backElement?: HTMLElement | null;
  member: Member;
  template: CardTemplate;
  organization?: Organization;
  options?: PdfExportOptions;
}): Promise<jsPDF> {
  const isPortrait = template.orientation === 'portrait' || template.height >= template.width;
  const cardW = isPortrait ? 50 : 80;
  const cardH = isPortrait ? 80 : 50;

  // Preload external assets for synchronous vector PDF rendering
  const [photoDataUrl, logoDataUrl] = await Promise.all([
    loadImageAsDataUrl(member.photoUrl),
    loadImageAsDataUrl(organization?.logoUrl),
  ]);

  const barcodeDataUrl = generateBarcodeDataUrl(member.memberId || 'ORG-000001');

  let qrDataUrl = '';
  if (backElement) {
    const svgs = backElement.querySelectorAll('svg');
    if (svgs.length > 1) {
      qrDataUrl = await svgToHighResPng(svgs[svgs.length - 1] as SVGElement);
    } else if (svgs.length === 1) {
      qrDataUrl = await svgToHighResPng(svgs[0] as SVGElement);
    }
  }

  let pdf: jsPDF;

  if (options.layout === 'cr80') {
    // 50mm x 80mm exact physical card bounds (1 PDF, 2 Pages: Front & Back)
    pdf = new jsPDF({
      orientation: isPortrait ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [cardW, cardH],
    });

    const fontFamily = await ensureBengaliFont(pdf);

    // Page 1: Front
    drawVectorFrontCard({
      pdf,
      x: 0,
      y: 0,
      member,
      organization,
      template,
      fontFamily,
      photoDataUrl,
      logoDataUrl,
    });

    // Page 2: Back
    pdf.addPage([cardW, cardH], isPortrait ? 'portrait' : 'landscape');
    drawVectorBackCard({
      pdf,
      x: 0,
      y: 0,
      member,
      organization,
      template,
      fontFamily,
      barcodeDataUrl,
      qrDataUrl,
    });
  } else if (options.layout === 'single-sheet') {
    // Both sides side-by-side on 1 page for PVC card printer / laminator
    const gap = 3;
    const margin = 5;
    const sheetW = cardW * 2 + gap + margin * 2;
    const sheetH = cardH + margin * 2;

    pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [sheetW, sheetH],
    });

    const fontFamily = await ensureBengaliFont(pdf);

    // Front on left
    drawVectorFrontCard({
      pdf,
      x: margin,
      y: margin,
      member,
      organization,
      template,
      fontFamily,
      photoDataUrl,
      logoDataUrl,
    });

    // Back on right
    drawVectorBackCard({
      pdf,
      x: margin + cardW + gap,
      y: margin,
      member,
      organization,
      template,
      fontFamily,
      barcodeDataUrl,
      qrDataUrl,
    });
  } else {
    // A4 Standard paper sheet
    pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const fontFamily = await ensureBengaliFont(pdf);

    const pageWidth = 210;
    const pageHeight = 297;
    const gap = 12;
    const totalWidth = cardW * 2 + gap;
    const startX = (pageWidth - totalWidth) / 2;
    const startY = (pageHeight - cardH) / 2;

    // Front on left
    drawVectorFrontCard({
      pdf,
      x: startX,
      y: startY,
      member,
      organization,
      template,
      fontFamily,
      photoDataUrl,
      logoDataUrl,
    });

    // Back on right
    drawVectorBackCard({
      pdf,
      x: startX + cardW + gap,
      y: startY,
      member,
      organization,
      template,
      fontFamily,
      barcodeDataUrl,
      qrDataUrl,
    });
  }

  const filename = `${member.memberId || 'ID_Card'}_${member.firstName || ''}_${member.lastName || ''}.pdf`.replace(
    /\s+/g,
    '_'
  );

  if (options.action === 'download') {
    pdf.save(filename);
  } else {
    try {
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        pdf.save(filename);
      }
    } catch {
      pdf.save(filename);
    }
  }

  return pdf;
}
