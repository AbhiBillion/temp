import React, { useState } from 'react';
import { ProofDocument, NominationRecord } from '../types';
import { PdfViewer } from './PdfViewer';
import { getSingleDocumentSummary } from '../utils/proofSummaryHelper';
import { generateValidProofPdf, generateValidEml } from '../utils/pdfGenerator';
import { 
  X, 
  Download, 
  FileText, 
  Mail, 
  Image as ImageIcon, 
  Paperclip, 
  Award, 
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  User,
  Users,
  Quote,
  Sparkles
} from 'lucide-react';

interface ProofDocumentViewerModalProps {
  document: ProofDocument | null;
  nomination?: NominationRecord | null;
  onClose: () => void;
  onOpenUploadProof?: (targetNominationId?: string) => void;
}

export const ProofDocumentViewerModal: React.FC<ProofDocumentViewerModalProps> = ({
  document,
  nomination,
  onClose,
  onOpenUploadProof
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!document) return null;

  const handleDownload = () => {
    let downloadUrl = '';
    let shouldRevoke = false;
    let downloadFileName = document.fileName;

    if (document.fileType === 'pdf') {
      if (document.rawFile) {
        downloadUrl = URL.createObjectURL(document.rawFile);
        shouldRevoke = true;
      } else if (document.blobUrl && !document.blobUrl.startsWith('data:text')) {
        downloadUrl = document.blobUrl;
      } else if (document.dataUrl && document.dataUrl.startsWith('data:application/pdf')) {
        downloadUrl = document.dataUrl;
      } else {
        // Generate a 100% valid PDF binary using jsPDF
        const { blob } = generateValidProofPdf(nomination, document);
        downloadUrl = URL.createObjectURL(blob);
        shouldRevoke = true;
        if (!downloadFileName.toLowerCase().endsWith('.pdf')) {
          downloadFileName = `${downloadFileName}.pdf`;
        }
      }
    } else if (document.fileType === 'email') {
      if (document.rawFile) {
        downloadUrl = URL.createObjectURL(document.rawFile);
        shouldRevoke = true;
      } else {
        // Generate a 100% valid RFC 822 .eml file that opens in Outlook, Apple Mail, and Thunderbird
        const { blob } = generateValidEml(document.emailMeta, document.extractedContent);
        downloadUrl = URL.createObjectURL(blob);
        shouldRevoke = true;
        if (!downloadFileName.toLowerCase().endsWith('.eml') && !downloadFileName.toLowerCase().endsWith('.msg')) {
          downloadFileName = `${downloadFileName.replace(/\.[^/.]+$/, '')}.eml`;
        }
      }
    } else {
      // Images or other documents
      if (document.rawFile) {
        downloadUrl = URL.createObjectURL(document.rawFile);
        shouldRevoke = true;
      } else if (document.blobUrl) {
        downloadUrl = document.blobUrl;
      } else if (document.dataUrl) {
        downloadUrl = document.dataUrl;
      } else if (document.extractedContent) {
        const blob = new Blob([document.extractedContent], { type: 'text/plain;charset=utf-8' });
        downloadUrl = URL.createObjectURL(blob);
        shouldRevoke = true;
      }
    }

    if (!downloadUrl) {
      // Safe fallback
      const { blob } = generateValidProofPdf(nomination, document);
      downloadUrl = URL.createObjectURL(blob);
      shouldRevoke = true;
      downloadFileName = `${document.fileName.replace(/\.[^/.]+$/, '')}_Audit_Record.pdf`;
    }

    const a = window.document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadFileName;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);

    if (shouldRevoke) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(downloadUrl);
        } catch {
          // ignore
        }
      }, 5000);
    }
  };

  const handleCopyEmailText = () => {
    const textToCopy = document.extractedContent || 
      `Subject: ${document.emailMeta?.subject || ''}\nFrom: ${document.emailMeta?.from || ''}\nTo: ${document.emailMeta?.to || ''}\nDate: ${document.emailMeta?.date || ''}\n\n${document.emailMeta?.bodySnippet || ''}`;
    
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isImage = document.fileType === 'image';
  const isPdf = document.fileType === 'pdf';
  const isEmail = document.fileType === 'email';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`p-2 rounded-xl text-slate-950 font-bold shrink-0 ${
              isEmail ? 'bg-amber-400' : isPdf ? 'bg-rose-400' : isImage ? 'bg-emerald-400' : 'bg-blue-400'
            }`}>
              {isEmail && <Mail className="w-5 h-5" />}
              {isPdf && <FileText className="w-5 h-5" />}
              {isImage && <ImageIcon className="w-5 h-5" />}
              {!isEmail && !isPdf && !isImage && <Paperclip className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md" title={document.fileName}>
                  {document.fileName}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 uppercase font-semibold">
                  {document.fileType}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                <span>{document.formattedSize}</span>
                <span>&bull;</span>
                <span>Uploaded {new Date(document.uploadedAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-sm"
              title="Download proof document or original file"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Candidate Mapping Info Bar */}
        {(nomination || document.extractedNominationId || document.nomineeName) && (
          <div className="bg-amber-50/70 border-b border-amber-200/80 px-5 py-2 flex flex-wrap items-center justify-between text-xs text-amber-950 gap-2 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Proof Document</span>
              </span>
              <span className="font-medium">
                Candidate: <strong className="font-bold">{nomination?.nomineeName || document.nomineeName || 'Assigned Candidate'}</strong>
              </span>
              <span className="text-slate-400 hidden sm:inline">&bull;</span>
              <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] hidden sm:inline-block">
                Nomination ID: {nomination?.nominationId || document.extractedNominationId}
              </span>
            </div>

            {nomination?.nominationCategory && (
              <span className="font-semibold text-amber-800 bg-amber-100/60 px-2.5 py-0.5 rounded-full text-[11px]">
                {nomination.nominationCategory}
              </span>
            )}
          </div>
        )}

        {/* Document Reading & Extracted Summary Bar */}
        {(() => {
          const docSummary = getSingleDocumentSummary(document);
          return (
            <div className="bg-slate-900 border-b border-slate-800 px-5 py-2.5 shrink-0 text-white shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                  <div className="p-1 rounded bg-amber-400 text-slate-950 shrink-0 mt-0.5">
                    <Quote className="w-3.5 h-3.5 fill-slate-950" />
                  </div>
                  <div className="min-w-0 space-y-0.5 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Document Reading &amp; Key Finding
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${docSummary.badgeClass}`}>
                        {docSummary.badgeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 italic leading-relaxed line-clamp-2">
                      &ldquo;{docSummary.keyFindings}&rdquo;
                    </p>
                    <div className="text-[10px] text-slate-400">
                      <span>{docSummary.source}</span>
                    </div>
                  </div>
                </div>

                {docSummary.metrics && docSummary.metrics.length > 0 && (
                  <div className="flex items-center space-x-1.5 shrink-0 pl-6 sm:pl-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Corroborated Metrics:</span>
                    {docSummary.metrics.map((m, idx) => (
                      <span key={idx} className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Main Document Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50 flex flex-col items-center justify-start min-h-[350px]">
          {/* 1. Image Preview */}
          {isImage && (
            (document.dataUrl || document.blobUrl) ? (
              <div className="flex flex-col items-center justify-center max-h-[70vh] w-full my-auto">
                <img
                  src={document.blobUrl || document.dataUrl}
                  alt={document.fileName}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
                />
                <span className="text-[11px] text-slate-500 mt-2">
                  Click download to inspect original high-resolution screenshot/image
                </span>
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md space-y-4 my-auto">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{document.fileName}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Image evidence certified in nomination registry for {nomination?.nomineeName || document.nomineeName}
                  </p>
                </div>
              </div>
            )
          )}

          {/* 2. PDF Preview (Using HTML5 Canvas PdfViewer with automatic fallback to prevent Chrome iframe blocking) */}
          {isPdf && (
            <PdfViewer
              file={document.rawFile}
              dataUrl={document.dataUrl}
              blobUrl={document.blobUrl}
              fileName={document.fileName}
              nomination={nomination}
              document={document}
            />
          )}

          {/* 3. Email Preview (.eml, .msg, text) */}
          {isEmail && (
            <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col text-slate-800 my-auto">
              {/* Email Envelope Header */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                      Subject
                    </span>
                    <h4 className="font-bold text-white text-base leading-snug">
                      {document.emailMeta?.subject || document.fileName}
                    </h4>
                  </div>

                  <button
                    onClick={handleCopyEmailText}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 shrink-0 border border-slate-700"
                    title="Copy email text"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-slate-300">
                  {document.emailMeta?.from && (
                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-slate-400 text-[11px] mr-1">From:</span>
                        <span className="font-medium text-slate-100">{document.emailMeta.from}</span>
                      </div>
                    </div>
                  )}

                  {document.emailMeta?.to && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-slate-400 text-[11px] mr-1">To:</span>
                        <span className="font-medium text-slate-100">{document.emailMeta.to}</span>
                      </div>
                    </div>
                  )}

                  {document.emailMeta?.date && (
                    <div className="flex items-center space-x-2 sm:col-span-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-slate-400 text-[11px] mr-1">Date:</span>
                        <span className="text-slate-200">{document.emailMeta.date}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Body Snippet */}
              <div className="p-5 sm:p-6 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto bg-white select-text">
                {document.emailMeta?.bodySnippet || 'No email body preview available. Click download to inspect original file.'}
              </div>
            </div>
          )}

          {/* 4. Other Documents Fallback */}
          {!isImage && !isPdf && !isEmail && (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md space-y-4 my-auto">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{document.fileName}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Document formatted as {document.fileType.toUpperCase()} ({document.formattedSize})
                </p>
              </div>
              {document.extractedContent && (
                <div className="text-left bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {document.extractedContent}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-2">
            <Paperclip className="w-4 h-4 text-slate-400" />
            <span>Official Proof Document Attachment</span>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenUploadProof && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUploadProof(nomination?.nominationId || nomination?.id);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition flex items-center space-x-1"
                title="Upload additional proof file for this employee"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Upload Another File</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
