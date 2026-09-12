import { jsPDF } from 'jspdf';
import { Donation } from '../store/useNgoStore';
import { Organization } from '../store/useOrgStore';
import { formatCurrency } from '../utils';

/**
 * Generates an official, high-resolution vector PDF receipt for charitable contributions.
 */
export function generateReceiptPdf(donation: Donation, organization: Organization): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const orgCurrency = donation.currency || organization.currency || 'USD';
  const orgName = organization.name || 'Global Hope Foundation';
  const formattedDate = new Date(donation.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const approvedDate = donation.approvedAt 
    ? new Date(donation.approvedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : formattedDate;

  // 1. Outer Double Framing Border
  doc.setDrawColor(6, 78, 59); // Emerald 900
  doc.setLineWidth(0.8);
  doc.rect(10, 10, 190, 277);

  doc.setDrawColor(16, 185, 129); // Emerald 500
  doc.setLineWidth(0.25);
  doc.rect(11.5, 11.5, 187, 274);

  // 2. Organization Header Banner
  doc.setFillColor(6, 78, 59); // Deep Forest Emerald
  doc.rect(11.5, 11.5, 187, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(orgName.toUpperCase(), 105, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(organization.tagline || 'Empowering Communities, Sustaining Lives & Restoring Hope', 105, 28, { align: 'center' });

  doc.setTextColor(167, 243, 208); // Emerald 200
  doc.setFontSize(7.5);
  doc.text(
    `Registration No: ${organization.registrationNumber || 'NGO-AB-2023-09412'}  |  Tax-Exempt Humanitarian Non-Profit Organization`,
    105,
    34,
    { align: 'center' }
  );

  // 3. Organization Contact Strip
  doc.setFillColor(248, 250, 252);
  doc.rect(11.5, 41.5, 187, 10, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(11.5, 51.5, 198.5, 51.5);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.text(
    `HQ: ${organization.address}   |   Phone: ${organization.phone}   |   Email: ${organization.email}`,
    105,
    48,
    { align: 'center' }
  );

  // 4. Receipt Title & Badge
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFFICIAL CHARITABLE DONATION TAX RECEIPT', 105, 62, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Issued for official income tax deduction, statutory audit, and donor contribution records', 105, 67, { align: 'center' });

  // 5. Metadata Bar (Receipt #, Date, Status, Method)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(16, 72, 178, 24, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(16, 72, 178, 24, 2, 2, 'D');

  // Col 1: Receipt Number
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPT NUMBER', 22, 79);
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text(donation.receiptNumber, 22, 87);

  // Col 2: Date
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('RECORDED DATE', 72, 79);
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formattedDate, 72, 87);

  // Col 3: Status
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AUDIT STATUS', 122, 79);
  doc.setFontSize(9);
  if (donation.status === 'Completed') {
    doc.setTextColor(5, 150, 105);
    doc.text('APPROVED & VERIFIED', 122, 87);
  } else if (donation.status === 'Pending') {
    doc.setTextColor(217, 119, 6);
    doc.text('PENDING VERIFICATION', 122, 87);
  } else {
    doc.setTextColor(225, 29, 72);
    doc.text('UNRESOLVED / FAILED', 122, 87);
  }

  // Col 4: Gateway / Ref
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT CHANNEL', 162, 79);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(donation.paymentMethod.toUpperCase(), 162, 87);

  // 6. Donor Profile Box
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('DONOR & CONTRIBUTION PROFILE', 16, 104);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, 107, 178, 30, 2, 2, 'D');

  // Left column in donor profile
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('DONOR NAME:', 22, 114);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(donation.isAnonymous ? 'Anonymous Donor' : donation.donorName, 55, 114);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICIAL EMAIL:', 22, 122);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(donation.donorEmail, 55, 122);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CONTACT PHONE:', 22, 130);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(donation.donorPhone || 'Not specified', 55, 130);

  // Right column in donor profile
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FREQUENCY:', 116, 114);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(donation.frequency === 'monthly' ? 'Monthly Sustaining Donor' : 'One-Time Contribution', 142, 114);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TRANSACTION REF:', 116, 122);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(donation.transactionId || 'VERIFIED-GATEWAY-TXN', 142, 122);

  if (donation.dedication) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DEDICATION:', 116, 130);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`"${donation.dedication.slice(0, 30)}"`, 142, 130);
  }

  // 7. Designated Fund & Financial Ledger Table
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('CONTRIBUTION BREAKDOWN', 16, 145);

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(16, 148, 178, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(16, 148, 178, 8, 'D');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DESIGNATED PROGRAM / CAUSE', 22, 153.5);
  doc.text('CLASS', 115, 153.5);
  doc.text('CURRENCY', 142, 153.5);
  doc.text('TOTAL AMOUNT', 170, 153.5, { align: 'right' });

  // Table Row
  doc.setFillColor(255, 255, 255);
  doc.rect(16, 156, 178, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(16, 156, 178, 14, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const causeTitle = donation.campaignName || 'General Humanitarian Relief Fund';
  doc.text(causeTitle.length > 45 ? causeTitle.slice(0, 42) + '...' : causeTitle, 22, 163);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Non-Profit Program Support & Community Welfare', 22, 167);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Humanitarian', 115, 164);
  doc.text(orgCurrency, 142, 164);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatCurrency(donation.amount, orgCurrency)}`, 190, 164, { align: 'right' });

  // Table Total Row (Highlighted Emerald)
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.rect(16, 170, 178, 14, 'F');
  doc.setDrawColor(16, 185, 129); // Emerald 500
  doc.rect(16, 170, 178, 14, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 78, 59);
  doc.text('CLEARED CHARITABLE CONTRIBUTION TOTAL:', 22, 178.5);

  doc.setFontSize(13);
  doc.setTextColor(6, 78, 59);
  doc.text(`${formatCurrency(donation.amount, orgCurrency)} ${orgCurrency}`, 190, 179, { align: 'right' });

  // 8. Legal Non-Profit Tax Certification
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, 190, 178, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, 190, 178, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('STATUTORY CHARITABLE TAX CERTIFICATION', 22, 196);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const legalNotice = 
    `This certified receipt attests that the specified funds have been directly contributed to ${orgName}, a registered charitable non-profit organization. In compliance with statutory tax codes and non-profit regulations, no goods, services, personal perks, or tangible benefits were provided to the donor in whole or partial return for this voluntary contribution. The full contribution amount qualifies for official income tax deduction purposes in eligible jurisdictions.`;
  
  const splitNotice = doc.splitTextToSize(legalNotice, 166);
  doc.text(splitNotice, 22, 201);

  // 9. Digital Verification Stamp & Authorized Signatures
  // Left: Official Circular Seal
  const stampCenterX = 52;
  const stampCenterY = 244;
  
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.6);
  doc.circle(stampCenterX, stampCenterY, 17, 'D');

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.2);
  doc.circle(stampCenterX, stampCenterY, 15.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(6, 78, 59);
  doc.text('GLOBAL HOPE FOUNDATION', stampCenterX, stampCenterY - 10, { align: 'center' });
  doc.text('★  OFFICIAL SEAL  ★', stampCenterX, stampCenterY - 6.5, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text('VERIFIED', stampCenterX, stampCenterY + 1, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text('TAX EXEMPT DONATION', stampCenterX, stampCenterY + 6.5, { align: 'center' });
  doc.text(`REG. ${organization.registrationNumber?.slice(0, 14) || 'NGO-AB-2023'}`, stampCenterX, stampCenterY + 10, { align: 'center' });

  // Right: Authorized Signature & Certification Line
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(116, 246, 186, 246);

  // Dynamic Approving Officer / Moderator Name & Role
  const rawApprover = (donation.approvedBy && donation.approvedBy.trim()) || 'Authorized Officer';
  const approverRole = donation.approverRole || 
    (rawApprover.toLowerCase().includes('moderator') || rawApprover.toLowerCase().includes('mod') 
      ? 'Authorized Moderator' 
      : 'Authorized Finance & Treasury Officer');

  // Handwritten cursive/italic signature style representation
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  // Center signature directly above the certification line (x: 116 to 186, center is 151)
  doc.text(rawApprover, 151, 243, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(approverRole, 116, 251);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Directorate of Financial Auditing & Donor Relations`, 116, 255.5);
  doc.text(`Approved: ${approvedDate}  |  Officer: ${rawApprover}`, 116, 260);

  // 10. Footer Authentication & Verification Bar
  doc.setDrawColor(226, 232, 240);
  doc.line(16, 269, 194, 269);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const verifyUrl = `${window.location.origin}/verify?receipt=${donation.receiptNumber}`;
  doc.text(`Document Reference: ${donation.receiptNumber}   •   Authenticity Verification: ${verifyUrl}`, 105, 273, { align: 'center' });
  doc.text(`Official electronic tax receipt generated on ${new Date().toLocaleString()}   •   ${orgName}`, 105, 277, { align: 'center' });

  return doc;
}

/**
 * Directly downloads the official PDF receipt for a donation.
 */
export function downloadReceiptPdf(donation: Donation, organization: Organization): void {
  const doc = generateReceiptPdf(donation, organization);
  doc.save(`${donation.receiptNumber || 'Donation-Receipt'}.pdf`);
}

/**
 * Opens the generated PDF receipt in a new browser tab for immediate viewing or printing.
 */
export function openReceiptPdfInNewTab(donation: Donation, organization: Organization): void {
  const doc = generateReceiptPdf(donation, organization);
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank');
}
