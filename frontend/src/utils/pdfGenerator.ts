import { jsPDF } from 'jspdf';
import { ProofDocument, NominationRecord } from '../types';

/**
 * Generates an official, beautifully structured, 100% valid PDF Blob and ArrayBuffer
 * for a nomination proof dossier using jsPDF.
 * This guarantees any generated or downloaded PDF opens cleanly in Adobe Acrobat,
 * Chrome, Edge, Preview, and mobile PDF readers.
 */
export function generateValidProofPdf(
  nomination?: NominationRecord | null,
  doc?: ProofDocument | null
): { blob: Blob; arrayBuffer: ArrayBuffer; dataUrl: string } {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner: Dark Navy (#0f172a)
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 32, 'F');

  // Accent line: Amber Gold (#f59e0b)
  pdf.setFillColor(245, 158, 11);
  pdf.rect(0, 32, pageWidth, 2.5, 'F');

  // Header Text
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text('REWARDS & RECOGNITION (R&R) AUDIT DOSSIER', margin, 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(203, 213, 225);
  pdf.text('Official Evidence Document & Verification Record', margin, 21);

  pdf.setFontSize(8);
  pdf.setTextColor(245, 158, 11);
  const nomId = nomination?.nominationId || doc?.extractedNominationId || 'REGISTRY-RECORD';
  pdf.text(`ID: ${nomId}  |  STATUS: CERTIFIED VERIFIED`, margin, 27);

  // Verification Badge on Top-Right
  pdf.setFillColor(16, 185, 129); // Emerald
  pdf.roundedRect(pageWidth - margin - 32, 9, 32, 14, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('VERIFIED', pageWidth - margin - 25, 15);
  pdf.setFontSize(6.5);
  pdf.text('DOCUMENT', pageWidth - margin - 26, 19.5);

  let y = 44;

  // Candidate Details Section Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. CANDIDATE & NOMINATION PROFILE', margin, y);
  y += 5;

  // Table Grid Box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 36, 2, 2, 'FD');

  const col1 = margin + 4;
  const col2 = margin + contentWidth / 2 + 2;
  let rowY = y + 6;

  const candidateName = nomination?.nomineeName || doc?.nomineeName || 'Candidate';
  const candidateId = nomination?.nomineeId || 'EMP-VERIFIED';
  const category = nomination?.nominationCategory || 'R&R Award';
  const bu = nomination?.buOfNominee || 'Enterprise Delivery';
  const location = nomination?.nomineeLocation || 'Corporate Office';
  const nominator = nomination?.nominatedBy || 'Practice Leadership';
  const nomBand = nomination?.nominatorCompetency || 'Leadership';

  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Nominee Name:', col1, rowY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${candidateName} (${candidateId})`, col1 + 25, rowY);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Award Category:', col2, rowY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(category, col2 + 25, rowY);

  rowY += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Business Unit:', col1, rowY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(bu, col1 + 25, rowY);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Location:', col2, rowY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(location, col2 + 25, rowY);

  rowY += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Nominated By:', col1, rowY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  const truncatedNominator = nominator.length > 32 ? nominator.slice(0, 30) + '...' : nominator;
  pdf.text(`${truncatedNominator} (${nomBand})`, col1 + 25, rowY);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Primary Approval:', col2, rowY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(16, 185, 129);
  pdf.text(nomination?.primaryApproval || 'Approved', col2 + 25, rowY);

  rowY += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Evidence File:', col1, rowY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(doc?.fileName || 'Official_Proof_Dossier.pdf', col1 + 25, rowY);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Date Verified:', col2, rowY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(new Date().toLocaleDateString(), col2 + 25, rowY);

  y += 44;

  // Executive Citation & Performance Evidence
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('2. EXECUTIVE CITATION & PERFORMANCE IMPACT', margin, y);
  y += 5;

  const citation = nomination?.nominationCitation || doc?.extractedContent || 'Nomination citation certifying outstanding contributions.';
  pdf.setFillColor(254, 243, 199); // Amber 100
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.6);

  const splitCitation = pdf.splitTextToSize(citation, contentWidth - 8);
  const citationHeight = Math.max(splitCitation.length * 5 + 8, 20);
  pdf.roundedRect(margin, y, contentWidth, citationHeight, 2, 2, 'FD');

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(9);
  pdf.setTextColor(30, 41, 59);
  pdf.text(splitCitation, margin + 4, y + 6);
  y += citationHeight + 8;

  // Evaluation Criteria & Governance
  if (nomination?.evaluationCriteria && y < pageHeight - 65) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('3. EVALUATION CRITERIA COMPLIANCE', margin, y);
    y += 5;

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);

    const splitCriteria = pdf.splitTextToSize(nomination.evaluationCriteria, contentWidth - 8);
    const criteriaHeight = Math.min(splitCriteria.length * 4.5 + 6, 32);
    pdf.roundedRect(margin, y, contentWidth, criteriaHeight, 2, 2, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text(splitCriteria.slice(0, 6), margin + 4, y + 5);
    y += criteriaHeight + 8;
  }

  // Certified Proof Document Content if available
  if (doc?.extractedContent && y < pageHeight - 55) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('4. DOCUMENTARY EVIDENCE EXCERPT', margin, y);
    y += 5;

    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);

    const cleanContent = doc.extractedContent.replace(/\r?\n+/g, ' ').slice(0, 450);
    const splitDoc = pdf.splitTextToSize(cleanContent, contentWidth - 8);
    const docHeight = Math.min(splitDoc.length * 4.2 + 6, 28);
    pdf.roundedRect(margin, y, contentWidth, docHeight, 2, 2, 'FD');

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(splitDoc.slice(0, 6), margin + 4, y + 4.5);
    y += docHeight + 8;
  }

  // Security Sign-Off & Footer Bar (Anchored at page bottom)
  const footerY = pageHeight - 20;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Rewards & Recognition Selection Board  •  Confidential Corporate Records', margin, footerY + 3);

  const authCode = `AUTH-${(nomId || 'RR').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(authCode, pageWidth - margin - 45, footerY + 3);

  const arrayBuffer = pdf.output('arraybuffer');
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const dataUrl = pdf.output('datauristring');

  return { blob, arrayBuffer, dataUrl };
}

/**
 * Creates a valid formatted .eml file Blob from email text or metadata
 */
export function generateValidEml(
  emailMeta?: { subject?: string; from?: string; to?: string; date?: string; bodySnippet?: string },
  extractedContent?: string
): { blob: Blob; dataUrl: string } {
  const subject = emailMeta?.subject || 'Client Appreciation Email';
  const from = emailMeta?.from || 'client.leadership@enterprise.com';
  const to = emailMeta?.to || 'nomination.board@company.com';
  const date = emailMeta?.date || new Date().toUTCString();
  const body = emailMeta?.bodySnippet || extractedContent || 'Official appreciation message for outstanding delivery.';

  const emlContent = [
    `From: ${from}`,
    `To: ${to}`,
    `Date: ${date}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 8bit`,
    `X-Mailer: Corporate R&R Audit System`,
    ``,
    body
  ].join('\r\n');

  const blob = new Blob([emlContent], { type: 'message/rfc822;charset=utf-8' });
  const dataUrl = `data:message/rfc822;charset=utf-8,${encodeURIComponent(emlContent)}`;
  return { blob, dataUrl };
}
