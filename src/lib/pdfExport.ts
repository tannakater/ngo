import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { Member, CardTemplate, Organization } from '../types';

export interface PdfExportOptions {
  layout: 'cr80' | 'single-sheet' | 'a4';
  action: 'download' | 'print';
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
  if (!frontElement) throw new Error("Front element is required for PDF generation");
  
  const isPortrait = template.orientation === 'portrait' || template.height >= template.width;
  const cardW = isPortrait ? 50 : 80;
  const cardH = isPortrait ? 80 : 50;

  // We use html-to-image with a high scale to get a crisp raster image of the exact DOM
  const scale = 5; // Ultra High quality (Full HD +)
  
  // Use toJpeg to avoid transparent background issues and keep file size smaller
  const frontImgData = await toJpeg(frontElement, { 
    pixelRatio: scale,
    backgroundColor: '#ffffff',
    style: {
      transform: 'scale(1)', // reset any scaling for rendering
      transformOrigin: 'top left'
    }
  });
  
  let backImgData = null;
  if (backElement) {
    backImgData = await toJpeg(backElement, { 
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });
  }

  let pdf: jsPDF;

  if (options.layout === 'cr80') {
    // 50mm x 80mm exact physical card bounds (1 PDF, 2 Pages: Front & Back)
    pdf = new jsPDF({
      orientation: isPortrait ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [cardW, cardH],
    });

    // Page 1: Front
    pdf.addImage(frontImgData, 'JPEG', 0, 0, cardW, cardH);

    // Page 2: Back
    if (backImgData) {
      pdf.addPage([cardW, cardH], isPortrait ? 'portrait' : 'landscape');
      pdf.addImage(backImgData, 'JPEG', 0, 0, cardW, cardH);
    }
  } else if (options.layout === 'single-sheet') {
    // Both sides side-by-side on 1 page
    const gap = 3;
    const margin = 5;
    const sheetW = cardW * 2 + gap + margin * 2;
    const sheetH = cardH + margin * 2;

    pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [sheetW, sheetH],
    });

    // Front on left
    pdf.addImage(frontImgData, 'JPEG', margin, margin, cardW, cardH);

    // Back on right
    if (backImgData) {
      pdf.addImage(backImgData, 'JPEG', margin + cardW + gap, margin, cardW, cardH);
    }
  } else {
    // A4 Standard paper sheet
    pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const gap = 12;
    const totalWidth = cardW * 2 + gap;
    const startX = (pageWidth - totalWidth) / 2;
    const startY = (pageHeight - cardH) / 2;

    // Front on left
    pdf.addImage(frontImgData, 'JPEG', startX, startY, cardW, cardH);

    // Back on right
    if (backImgData) {
      pdf.addImage(backImgData, 'JPEG', startX + cardW + gap, startY, cardW, cardH);
    }
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
