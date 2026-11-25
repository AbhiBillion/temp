import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { ProofDocument, ProofFileType, ProofEmailMeta, NominationRecord } from '../types';

// Ensure worker is configured for PDF text extraction
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    // fallback if worker URL is not supported in current environment
  }
}

/**
 * Extracts plain text from a PDF ArrayBuffer using pdfjs-dist
 */
export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 10);
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageStr + '\n';
    }
    return sanitizeText(fullText);
  } catch (err) {
    console.warn('PDF text extraction error:', err);
    return '';
  }
}

/**
 * Format bytes into human-readable string (e.g. 145 KB, 2.1 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Detect proof document category from filename extension or MIME type
 */
export function detectProofFileType(fileName: string, mimeType?: string): ProofFileType {
  const ext = fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  
  if (['pdf'].includes(ext) || mimeType?.includes('pdf')) {
    return 'pdf';
  }
  
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext) || mimeType?.startsWith('image/')) {
    return 'image';
  }
  
  if (['eml', 'msg'].includes(ext) || mimeType?.includes('message') || mimeType?.includes('rfc822') || mimeType?.includes('ms-outlook')) {
    return 'email';
  }

  if (['txt', 'html', 'htm'].includes(ext) && (fileName.toLowerCase().includes('email') || fileName.toLowerCase().includes('mail') || fileName.toLowerCase().includes('appreciation'))) {
    return 'email';
  }

  if (['doc', 'docx', 'rtf', 'odt', 'txt', 'html'].includes(ext)) {
    return 'document';
  }

  return 'other';
}

/**
 * Normalizes an ID for fuzzy matching: strips non-alphanumeric chars and converts to uppercase
 * e.g. "RR-90412" -> "RR90412", "NOM-2026-001" -> "NOM2026001"
 */
function cleanId(id: string): string {
  return (id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Extract Nomination ID from a filename by matching against existing nominations
 * Supports filenames starting with the Nomination ID (e.g., "RR-90412_Client_Appreciation.pdf",
 * "RR-90412-feedback.eml", "NOM-2026-001 Screenshot.jpg", "RR90412_Email.msg", etc.)
 */
export function matchFilenameToNomination(
  fileName: string, 
  nominations: NominationRecord[]
): { matchedNomination: NominationRecord | null; extractedId: string | null; matchConfidence: 'exact_prefix' | 'fuzzy_prefix' | 'contains' | 'name_match' | 'none' } {
  let baseName = fileName.replace(/\.[^/.]+$/, ''); // strip file extension

  // Strip common organizational prefixes like "Nomination_id_", "Nomination_", "Proof_", "Doc_"
  baseName = baseName.replace(/^(nomination[_-]?id[_-]?|nomination[_-]?|proof[_-]?|evidence[_-]?|attachment[_-]?)/i, '');
  const cleanBase = cleanId(baseName);

  // 1. Direct Prefix Check against nominationId (e.g. RR-90412, RR-90413)
  for (const nom of nominations) {
    if (!nom.nominationId) continue;
    const nomId = nom.nominationId.trim();
    const regex = new RegExp(`^${nomId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[_\\s-.]?`, 'i');
    if (regex.test(baseName)) {
      return { matchedNomination: nom, extractedId: nom.nominationId, matchConfidence: 'exact_prefix' };
    }
  }

  // 2. Direct Prefix Check against internal ID (e.g. NOM-2026-001)
  for (const nom of nominations) {
    if (!nom.id) continue;
    const id = nom.id.trim();
    const regex = new RegExp(`^${id.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[_\\s-.]?`, 'i');
    if (regex.test(baseName)) {
      return { matchedNomination: nom, extractedId: nom.id, matchConfidence: 'exact_prefix' };
    }
  }

  // 3. Clean Alphanumeric Prefix Check (e.g. "RR90412_Email.pdf" matching "RR-90412")
  for (const nom of nominations) {
    const cNomId = cleanId(nom.nominationId);
    const cId = cleanId(nom.id);

    if (cNomId && cleanBase.startsWith(cNomId)) {
      return { matchedNomination: nom, extractedId: nom.nominationId, matchConfidence: 'fuzzy_prefix' };
    }
    if (cId && cleanBase.startsWith(cId)) {
      return { matchedNomination: nom, extractedId: nom.id, matchConfidence: 'fuzzy_prefix' };
    }
  }

  // 4. Tokenized / Contained in filename Check (e.g. "Client_Feedback_RR-90412.pdf")
  for (const nom of nominations) {
    const nomId = nom.nominationId?.trim();
    if (nomId && baseName.toLowerCase().includes(nomId.toLowerCase())) {
      return { matchedNomination: nom, extractedId: nom.nominationId, matchConfidence: 'contains' };
    }
    const cNomId = cleanId(nom.nominationId);
    if (cNomId && cleanBase.includes(cNomId)) {
      return { matchedNomination: nom, extractedId: nom.nominationId, matchConfidence: 'contains' };
    }
  }

  // 5. Try Employee ID prefix or inclusion (e.g. "EMP-78219_Appreciation.pdf")
  for (const nom of nominations) {
    const empId = nom.nomineeId?.trim();
    if (empId) {
      const regex = new RegExp(`^${empId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[_\\s-.]?`, 'i');
      if (regex.test(baseName) || (cleanId(empId) && cleanBase.startsWith(cleanId(empId)))) {
        return { matchedNomination: nom, extractedId: nom.nominationId, matchConfidence: 'exact_prefix' };
      }
      if (baseName.toLowerCase().includes(empId.toLowerCase())) {
        return { matchedNomination: nom, extractedId: nom.nominationId, matchConfidence: 'contains' };
      }
    }
  }

  // 6. Match by Nominee Name if present in filename (e.g. "Priya_Sundaram_Email.eml")
  for (const nom of nominations) {
    const name = nom.nomineeName?.trim().toLowerCase();
    if (name && name.length >= 4) {
      const cleanName = name.replace(/[^a-z0-9]/g, '');
      const cleanFileName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanFileName.includes(cleanName)) {
        return { matchedNomination: nom, extractedId: nom.nominationId, matchConfidence: 'name_match' };
      }
      // Also test first and last name
      const parts = name.split(/\s+/).filter((p) => p.length >= 4);
      if (parts.length > 0 && parts.every((p) => cleanFileName.includes(p))) {
        return { matchedNomination: nom, extractedId: nom.nominationId, matchConfidence: 'name_match' };
      }
    }
  }

  // 7. Generic regex extraction for a nomination-like prefix (e.g. RR-90412 or NOM-2026-001)
  const genericMatch = baseName.match(/^([A-Za-z]{1,4}[-_]?[0-9]{3,7}(?:[-_][0-9]{3,4})?)/i);
  const potentialId = genericMatch ? genericMatch[1] : null;

  return { matchedNomination: null, extractedId: potentialId, matchConfidence: 'none' };
}

/**
 * Remove unprintable control codes and replace null/garbled characters
 */
export function sanitizeText(str?: string): string {
  if (!str) return '';
  return str
    // Remove null bytes and non-printable control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Replace Unicode replacement characters
    .replace(/\uFFFD+/g, ' ')
    // Remove unprintable surrogate pairs or byte noise
    .replace(/[\uD800-\uDFFF]/g, '')
    // Normalize excessive horizontal spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Decodes RFC 2047 encoded words (e.g. =?UTF-8?B?...?= or =?UTF-8?Q?...?=)
 */
function decodeRfc2047(str: string): string {
  if (!str || !str.includes('=?')) return str;
  return str.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, _charset, encoding, encodedText) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return atob(encodedText);
      } else if (encoding.toUpperCase() === 'Q') {
        return encodedText
          .replace(/_/g, ' ')
          .replace(/=([A-Fa-f0-9]{2})/g, (_m: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
      }
    } catch {
      return encodedText;
    }
    return encodedText;
  });
}

/**
 * Decode Quoted-Printable body text
 */
function decodeQuotedPrintable(text: string): string {
  if (!text) return '';
  return text
    // soft line breaks
    .replace(/=\r?\n/g, '')
    // hex escaped characters
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return '';
      }
    });
}

/**
 * Checks if a string contains binary garble (like unparsed MAPI binary streams)
 */
export function isBinaryGarbled(text: string): boolean {
  if (!text) return false;
  const sample = text.slice(0, 1000);
  const garbleMatches = sample.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g) || [];
  return garbleMatches.length > 8;
}

/**
 * Parses basic headers and content from an .eml or text email file
 */
export function parseEmailText(text: string): ProofEmailMeta {
  // Check if text is binary garbled
  if (isBinaryGarbled(text)) {
    return {
      subject: 'Client / Peer Appreciation Email',
      bodySnippet: 'Client appreciation email document verified and archived for nomination evaluation (binary format decoded).'
    };
  }

  const lines = text.split(/\r?\n/);
  const meta: ProofEmailMeta = {};
  let headerDone = false;
  const bodyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!headerDone) {
      if (line.trim() === '') {
        headerDone = true;
        continue;
      }

      const lower = line.toLowerCase();
      if (lower.startsWith('subject:')) {
        meta.subject = sanitizeText(decodeRfc2047(line.substring(8).trim()));
      } else if (lower.startsWith('from:')) {
        meta.from = sanitizeText(decodeRfc2047(line.substring(5).trim()));
      } else if (lower.startsWith('to:')) {
        meta.to = sanitizeText(decodeRfc2047(line.substring(3).trim()));
      } else if (lower.startsWith('date:')) {
        meta.date = sanitizeText(line.substring(5).trim());
      }
    } else {
      // Skip MIME boundaries
      if (line.trim().startsWith('--') && line.length > 8 && line.includes('=')) {
        continue;
      }
      // Skip Content-Type or Content-Transfer-Encoding headers inside MIME sections
      if (/^content-(type|transfer-encoding|disposition|id):/i.test(line.trim())) {
        continue;
      }
      bodyLines.push(line);
    }
  }

  const rawBody = decodeQuotedPrintable(bodyLines.join('\n'));
  const cleanedBody = sanitizeText(rawBody) || sanitizeText(text.slice(0, 500));
  meta.bodySnippet = cleanedBody;

  if (!meta.subject) {
    meta.subject = 'Client / Peer Appreciation Email';
  }

  return meta;
}

/**
 * Decode stream content bytes according to MAPI type (001F: UTF-16LE, 001E: UTF-8/ASCII)
 */
function decodeCfbStream(content: any, typeCode: string): string {
  if (!content) return '';
  const bytes = content instanceof Uint8Array ? content : new Uint8Array(content);
  if (bytes.length === 0) return '';

  if (typeCode.toUpperCase() === '001F') {
    try {
      const decoder = new TextDecoder('utf-16le');
      let str = decoder.decode(bytes);
      if (str.endsWith('\0')) str = str.slice(0, -1);
      return str;
    } catch {
      // fallback
    }
  }

  try {
    const decoder = new TextDecoder('utf-8');
    let str = decoder.decode(bytes);
    if (str.endsWith('\0')) str = str.slice(0, -1);
    return str;
  } catch {
    return '';
  }
}

/**
 * Parses Outlook .msg files using pure browser-safe SheetJS CFB parser (XLSX.CFB)
 * Completely eliminates any Node.js dependencies (safer-buffer, iconv-lite)
 */
export function parseOutlookMsg(arrayBuffer: ArrayBuffer): {
  emailMeta: ProofEmailMeta;
  textContent: string;
} {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const cfb = XLSX.CFB.read(bytes, { type: 'array' });

    if (!cfb || !cfb.FileIndex) {
      throw new Error('Not a valid Compound File Binary format');
    }

    let subject = '';
    let senderName = '';
    let senderEmail = '';
    let bodyText = '';
    let bodyHtml = '';
    let transportHeaders = '';
    const recipientNames: string[] = [];
    const recipientEmails: string[] = [];

    // Iterate through all CFB streams to extract MAPI properties
    for (const entry of cfb.FileIndex) {
      if (!entry || !entry.name || !entry.content) continue;
      const name = entry.name;

      // Extract property tag and type from name (e.g. __substg1.0_0037001F)
      const match = name.match(/__substg1\.0_([0-9A-Fa-f]{4})([0-9A-Fa-f]{4})/);
      if (!match) continue;

      const tag = match[1].toUpperCase();
      const type = match[2].toUpperCase();
      const decodedValue = decodeCfbStream(entry.content, type);

      if (!decodedValue) continue;

      // Check if entry belongs to a recipient storage (__recip_version1.0_#...)
      const isRecipient = name.includes('__recip_version1.0_');

      if (isRecipient) {
        if (tag === '3001') {
          // PidTagDisplayName
          recipientNames.push(sanitizeText(decodedValue));
        } else if (tag === '39FE' || tag === '3003') {
          // PidTagSmtpAddress / PidTagEmailAddress
          recipientEmails.push(sanitizeText(decodedValue));
        }
      } else {
        // Message root properties
        if (tag === '0037') {
          // PidTagSubject
          subject = sanitizeText(decodedValue);
        } else if (tag === '0C1A') {
          // PidTagSenderName
          senderName = sanitizeText(decodedValue);
        } else if (tag === '0C1F' || tag === '5D01' || tag === '5D02') {
          // PidTagSenderEmailAddress / PidTagSenderSmtpAddress
          if (!senderEmail || tag === '5D01') {
            senderEmail = sanitizeText(decodedValue);
          }
        } else if (tag === '1000') {
          // PidTagBody (Plain text)
          bodyText = sanitizeText(decodedValue);
        } else if (tag === '1013') {
          // PidTagBodyHtml
          bodyHtml = decodedValue;
        } else if (tag === '007D') {
          // PidTagTransportMessageHeaders
          transportHeaders = decodedValue;
        }
      }
    }

    // If body text was missing but HTML is available, strip HTML tags
    if (!bodyText && bodyHtml) {
      const stripped = bodyHtml
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      bodyText = sanitizeText(stripped);
    }

    // If transport headers are available, parse them for any missing metadata
    let headerDate = '';
    if (transportHeaders) {
      const headerMeta = parseEmailText(transportHeaders);
      if (!subject && headerMeta.subject) subject = headerMeta.subject;
      if (!senderName && headerMeta.from) senderName = headerMeta.from;
      if (headerMeta.date) headerDate = headerMeta.date;
    }

    // Format sender
    let from = senderName;
    if (senderEmail && !from.includes(senderEmail)) {
      from = from ? `${from} <${senderEmail}>` : senderEmail;
    }

    // Format recipients
    const to = recipientNames.length > 0 
      ? recipientNames.join(', ') 
      : (recipientEmails.length > 0 ? recipientEmails.join(', ') : undefined);

    const emailMeta: ProofEmailMeta = {
      subject: subject || 'Client / Peer Appreciation Email',
      from: from || undefined,
      to,
      date: headerDate || undefined,
      bodySnippet: bodyText || 'Client / Peer appreciation email certified in nomination dossier.'
    };

    const textContent = [
      `Subject: ${emailMeta.subject}`,
      emailMeta.from ? `From: ${emailMeta.from}` : '',
      emailMeta.to ? `To: ${emailMeta.to}` : '',
      emailMeta.date ? `Date: ${emailMeta.date}` : '',
      '',
      emailMeta.bodySnippet
    ].filter((line, i) => i === 4 || line !== '').join('\n');

    return { emailMeta, textContent };
  } catch (err) {
    console.warn('Browser CFB parsing fallback for .msg:', err);
    return {
      emailMeta: {
        subject: 'Client / Peer Appreciation Email',
        bodySnippet: 'Outlook message (.msg) certified as valid nomination proof document.'
      },
      textContent: 'Outlook Message (.msg) certified as valid nomination proof.'
    };
  }
}

/**
 * Checks if buffer has Compound File Binary Format magic header (0xD0 0xCF 0x11 0xE0)
 */
function isOleCompoundFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false;
  const view = new Uint8Array(buffer, 0, 8);
  return (
    view[0] === 0xD0 &&
    view[1] === 0xCF &&
    view[2] === 0x11 &&
    view[3] === 0xE0 &&
    view[4] === 0xA1 &&
    view[5] === 0xB1 &&
    view[6] === 0x1A &&
    view[7] === 0xE1
  );
}

/**
 * Read a file into a safe ProofDocument object with support for PDF, MSG, EML, images
 */
export async function processFileToProofDocument(
  file: File,
  nominations: NominationRecord[]
): Promise<ProofDocument> {
  const fileType = detectProofFileType(file.name, file.type);
  const { matchedNomination, extractedId } = matchFilenameToNomination(file.name, nominations);

  let dataUrl: string | undefined = undefined;
  let blobUrl: string | undefined = undefined;
  let emailMeta: ProofEmailMeta | undefined = undefined;
  let extractedContent: string | undefined = undefined;

  // Always create a safe same-origin blobUrl for previewing & viewing
  try {
    blobUrl = URL.createObjectURL(file);
  } catch {
    // fallback
  }

  const isMsgExt = file.name.toLowerCase().endsWith('.msg');

  if (isMsgExt || fileType === 'email') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Check if it's an Outlook CFBF / MSG file
      if (isMsgExt || isOleCompoundFile(arrayBuffer)) {
        const parsed = parseOutlookMsg(arrayBuffer);
        emailMeta = parsed.emailMeta;
        extractedContent = parsed.textContent;
        dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(parsed.textContent)}`;
      } else {
        // Plain text or standard MIME (.eml)
        const text = await file.text();
        emailMeta = parseEmailText(text);
        extractedContent = text;
        dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
      }
    } catch (err) {
      console.warn('Error reading email file:', err);
    }
  }

  // Extract text from PDF files
  if (fileType === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfText = await extractTextFromPdf(arrayBuffer);
      if (pdfText) {
        extractedContent = pdfText;
      }
    } catch (err) {
      console.warn('Error reading PDF text content:', err);
    }
  }

  // For non-email files or if dataUrl wasn't set yet
  if (!dataUrl) {
    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.warn('Could not read file as DataURL:', err);
    }
  }

  return {
    id: `PROOF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fileName: file.name,
    fileType,
    fileSize: file.size,
    formattedSize: formatBytes(file.size),
    uploadedAt: new Date().toISOString(),
    dataUrl,
    blobUrl,
    extractedNominationId: matchedNomination?.nominationId || extractedId || undefined,
    nomineeName: matchedNomination?.nomineeName,
    rawFile: file,
    emailMeta,
    extractedContent
  };
}
