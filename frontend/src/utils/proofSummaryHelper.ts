import { NominationRecord, ProofDocument } from '../types';

export interface ProofDocumentSummary {
  primaryTitle: string;
  badgeLabel: string;
  badgeClass: string;
  sourceLabel: string;
  keyFindings: string;
  fullExcerpt: string;
  metricHighlights: string[];
  docCount: number;
  hasLocalFile: boolean;
  status: 'verified_uploaded' | 'marked_in_sheet' | 'no_proof';
}

function cleanSentence(s: string): string {
  return s
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/^(subject|from|to|date|hi\b|dear\b|hello\b|thanks\b|regards\b|best\b)[:,\s]*/i, '')
    .trim();
}

/**
 * Extracts key findings and high-impact metrics from proof text or email body
 */
export function extractHighlightsFromText(text: string): { summary: string; metrics: string[] } {
  if (!text) return { summary: '', metrics: [] };

  // Remove HTTP URLs, email headers, excessive whitespace
  const cleaned = text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Search for sentences with praise or quantitative metrics
  const rawSentences = cleaned.split(/(?<=[.!?])\s+/);
  const sentences = rawSentences
    .map(cleanSentence)
    .filter((s) => s.length >= 20);

  const metricRegex = /(\$[\d,.]+[kKmMbB]?|\d+(?:\.\d+)?%\s*(?:increase|savings|reduction|speedup|turnaround|renewal|accuracy|uptime)?|\b\d+\s*(?:hours|hrs|days|weeks|months|minutes|mins|squads|repositories|repos)\b|\bcsat\b|\barr\b|\broi\b|\bdowntime\b|\bzero\b)/i;
  const praiseRegex = /(commend|extraordinary|exceptional|exemplary|appreciated|appreciation|praise|thank you|delighted|turnaround|outstanding|promoted|congratulations|signoff|sign-off|approved|validated|endorsed|achieved|deployed)/i;

  const prioritySentence = sentences.find((s) => metricRegex.test(s) && praiseRegex.test(s)) ||
                           sentences.find((s) => metricRegex.test(s)) ||
                           sentences.find((s) => praiseRegex.test(s)) ||
                           sentences[0] ||
                           cleaned.slice(0, 180);

  // Extract isolated metric tokens
  const metricsFound: string[] = [];
  const matches = cleaned.match(/(\$[\d,.]+[kKmMbB]?|\d+(?:\.\d+)?%|\b\d+\s*(?:hours|hrs|mins|minutes|days|squads|repos|clusters)\b|\b\d+X\b|\bcsat\s*[\d./:]+|\b\d+\.\d+\/\d+\b)/gi);
  if (matches) {
    matches.slice(0, 4).forEach((m) => {
      const trimmed = m.trim();
      if (!metricsFound.includes(trimmed)) metricsFound.push(trimmed);
    });
  }

  return {
    summary: prioritySentence.length > 220 ? prioritySentence.slice(0, 215) + '…' : prioritySentence,
    metrics: metricsFound
  };
}

/**
 * Format a human-readable clean title from a filename
 */
function formatCleanTitle(fileName: string): string {
  if (!fileName) return 'Evidence Document';
  // Strip file extension
  let name = fileName.replace(/\.[^/.]+$/, '');
  // Replace underscores and multiple dashes with spaces
  name = name.replace(/[-_]+/g, ' ').trim();
  return name;
}

/**
 * Reads proof documents attached to a nomination and creates an executive overview
 */
export function getNominationProofOverview(nomination: NominationRecord): ProofDocumentSummary {
  const proofDocs = Array.isArray(nomination.proofDocuments) ? nomination.proofDocuments : [];
  const hasLocalProof = proofDocs.length > 0;
  const isMarkedInSheet = String(nomination.isAttachmentUploaded).toLowerCase() === 'yes' || nomination.isAttachmentUploaded === true;

  // Case 1: Real proof files uploaded and available locally
  if (hasLocalProof) {
    const primaryDoc = proofDocs[0];
    const docCount = proofDocs.length;
    const isEmail = primaryDoc.fileType === 'email';
    const isPdf = primaryDoc.fileType === 'pdf';
    const isImage = primaryDoc.fileType === 'image';

    if (isEmail && (primaryDoc.emailMeta || primaryDoc.extractedContent)) {
      const meta = primaryDoc.emailMeta || {};
      const bodyToInspect = meta.bodySnippet || primaryDoc.extractedContent || '';
      const { summary, metrics } = extractHighlightsFromText(bodyToInspect);
      const isClient = (meta.from || '').toLowerCase().includes('client') || (meta.from || '').toLowerCase().includes('.com');
      
      const primaryTitle = meta.subject || formatCleanTitle(primaryDoc.fileName);
      const sourceLabel = meta.from ? `From: ${meta.from}${meta.date ? ` • ${meta.date}` : ''}` : `Email: ${primaryDoc.fileName} (${primaryDoc.formattedSize})`;
      const badgeLabel = isClient ? 'Client Appreciation Email' : 'Verified Email Proof';
      const badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
      const keyFindings = summary || meta.bodySnippet?.slice(0, 180) || 'Verified email communication corroborating candidate performance.';
      const fullExcerpt = bodyToInspect;

      return {
        primaryTitle,
        badgeLabel: docCount > 1 ? `${badgeLabel} (+${docCount - 1} more)` : badgeLabel,
        badgeClass,
        sourceLabel,
        keyFindings,
        fullExcerpt,
        metricHighlights: metrics,
        docCount,
        hasLocalFile: true,
        status: 'verified_uploaded'
      };
    }

    if (isPdf || primaryDoc.fileType === 'document') {
      const text = primaryDoc.extractedContent || '';
      const { summary, metrics } = extractHighlightsFromText(text || nomination.nominationCitation);
      const isIncidentSignoff = text.toLowerCase().includes('post-mortem') || text.toLowerCase().includes('signoff') || text.toLowerCase().includes('sign-off');
      const isCsatReport = text.toLowerCase().includes('csat') || text.toLowerCase().includes('renewal');

      let badgeLabel = 'Verified PDF Dossier';
      if (isIncidentSignoff) badgeLabel = 'Signed Incident Sign-off';
      else if (isCsatReport) badgeLabel = 'CSAT & Renewal Metrics';

      const primaryTitle = formatCleanTitle(primaryDoc.fileName);
      const sourceLabel = `PDF: ${primaryDoc.fileName} (${primaryDoc.formattedSize})`;
      const badgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
      const keyFindings = summary || text.slice(0, 180) || 'Certified executive evidence dossier submitted in nomination registry.';

      return {
        primaryTitle,
        badgeLabel: docCount > 1 ? `${badgeLabel} (+${docCount - 1} more)` : badgeLabel,
        badgeClass,
        sourceLabel,
        keyFindings,
        fullExcerpt: text,
        metricHighlights: metrics,
        docCount,
        hasLocalFile: true,
        status: 'verified_uploaded'
      };
    }

    if (isImage) {
      return {
        primaryTitle: formatCleanTitle(primaryDoc.fileName),
        badgeLabel: docCount > 1 ? `Visual Screenshot Proof (+${docCount - 1})` : 'Visual Screenshot Proof',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        sourceLabel: `Image: ${primaryDoc.fileName} (${primaryDoc.formattedSize})`,
        keyFindings: 'Visual screenshot artifact verifying technical deployment / client commendation.',
        fullExcerpt: primaryDoc.fileName,
        metricHighlights: [],
        docCount,
        hasLocalFile: true,
        status: 'verified_uploaded'
      };
    }

    // Generic fallback for uploaded document
    return {
      primaryTitle: formatCleanTitle(primaryDoc.fileName),
      badgeLabel: docCount > 1 ? `Verified Proof (${docCount} files)` : 'Verified Proof File',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
      sourceLabel: `File: ${primaryDoc.fileName} (${primaryDoc.formattedSize})`,
      keyFindings: primaryDoc.extractedContent?.slice(0, 180) || 'Supporting document attached in nomination registry.',
      fullExcerpt: primaryDoc.extractedContent || '',
      metricHighlights: [],
      docCount,
      hasLocalFile: true,
      status: 'verified_uploaded'
    };
  }

  // Case 2: Attachment is declared in Excel sheet, but actual file has not been loaded locally yet
  if (isMarkedInSheet) {
    const citationText = nomination.nominationCitation || nomination.contributionInfo || '';
    const { summary, metrics } = extractHighlightsFromText(citationText);

    return {
      primaryTitle: nomination.contributionFor ? `${nomination.contributionFor}` : `${nomination.nomineeName} Citation Evidence`,
      badgeLabel: 'Proof in Sheet (File Pending)',
      badgeClass: 'bg-amber-100/80 text-amber-900 border-amber-300',
      sourceLabel: `Spreadsheet Status: isAttachmentUploaded = "Yes" • By: ${nomination.nominatedBy || 'Sponsor'}`,
      keyFindings: summary || 'Attachment recorded in spreadsheet registry. Upload proof file (.eml, .msg, .pdf) to verify source.',
      fullExcerpt: citationText,
      metricHighlights: metrics,
      docCount: 0,
      hasLocalFile: false,
      status: 'marked_in_sheet'
    };
  }

  // Case 3: No attachment
  return {
    primaryTitle: 'No Proof Document Attached',
    badgeLabel: 'No Proof Attached',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    sourceLabel: 'Spreadsheet Status: isAttachmentUploaded = "No"',
    keyFindings: 'No documentary evidence or client email linked to this nomination.',
    fullExcerpt: '',
    metricHighlights: [],
    docCount: 0,
    hasLocalFile: false,
    status: 'no_proof'
  };
}

/**
 * Extracts a concise executive summary and findings for a single proof document
 */
export function getSingleDocumentSummary(doc: ProofDocument): {
  title: string;
  badgeLabel: string;
  badgeClass: string;
  keyFindings: string;
  metrics: string[];
  source: string;
} {
  const isEmail = doc.fileType === 'email';
  const isPdf = doc.fileType === 'pdf';
  const isImage = doc.fileType === 'image';

  if (isEmail && (doc.emailMeta || doc.extractedContent)) {
    const body = doc.emailMeta?.bodySnippet || doc.extractedContent || '';
    const { summary, metrics } = extractHighlightsFromText(body);
    return {
      title: doc.emailMeta?.subject || formatCleanTitle(doc.fileName),
      badgeLabel: 'Client / Peer Appreciation Email',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      keyFindings: summary || doc.emailMeta?.bodySnippet?.slice(0, 200) || 'Verified email communication corroborating performance.',
      metrics,
      source: doc.emailMeta?.from ? `From: ${doc.emailMeta.from}` : `Email: ${doc.fileName}`
    };
  }

  if (isPdf || doc.fileType === 'document') {
    const text = doc.extractedContent || '';
    const { summary, metrics } = extractHighlightsFromText(text);
    return {
      title: formatCleanTitle(doc.fileName),
      badgeLabel: 'Verified PDF Dossier & Sign-off',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      keyFindings: summary || text.slice(0, 200) || 'Certified executive evidence dossier corroborating claims.',
      metrics,
      source: `PDF File: ${doc.fileName} (${doc.formattedSize})`
    };
  }

  if (isImage) {
    return {
      title: formatCleanTitle(doc.fileName),
      badgeLabel: 'Visual Screenshot Evidence',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      keyFindings: 'Visual evidence screenshot validating technical completion or client feedback.',
      metrics: [],
      source: `Image: ${doc.fileName} (${doc.formattedSize})`
    };
  }

  return {
    title: formatCleanTitle(doc.fileName),
    badgeLabel: 'Supporting Evidence Document',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    keyFindings: doc.extractedContent?.slice(0, 200) || 'Supporting document attached in nomination registry.',
    metrics: [],
    source: `File: ${doc.fileName} (${doc.formattedSize})`
  };
}
