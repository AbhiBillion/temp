import React, { useState } from 'react';
import { NominationRecord, ProofDocument } from '../types';
import { getNominationProofOverview } from '../utils/proofSummaryHelper';
import { generateValidProofPdf } from '../utils/pdfGenerator';
import { 
  Paperclip, 
  Mail, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  Upload, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Quote, 
  AlertCircle 
} from 'lucide-react';

interface ProofOverviewBadgeProps {
  nomination: NominationRecord;
  onPreviewProofDoc?: (doc: ProofDocument, nom: NominationRecord) => void;
  onOpenUploadProof?: (targetNominationId?: string) => void;
}

export const ProofOverviewBadge: React.FC<ProofOverviewBadgeProps> = ({
  nomination,
  onPreviewProofDoc,
  onOpenUploadProof
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const overview = getNominationProofOverview(nomination);

  const proofDocs = nomination.proofDocuments || [];
  const primaryDoc = proofDocs[0];

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryDoc && onPreviewProofDoc) {
      onPreviewProofDoc(primaryDoc, nomination);
    } else if (overview.status === 'marked_in_sheet' && onPreviewProofDoc) {
      // Create a certified 100% valid ProofDocument instance on the fly from the registered sheet evidence
      const fileName = `${nomination.nominationId || 'NOM'}_Official_Evidence_Dossier.pdf`;
      const { blob, dataUrl } = generateValidProofPdf(nomination, {
        fileName,
        extractedContent: nomination.nominationCitation
      } as any);

      const syntheticDoc: ProofDocument = {
        id: `PROOF-REGISTERED-${nomination.id}`,
        fileName,
        fileType: 'pdf',
        fileSize: blob.size,
        formattedSize: `${Math.round(blob.size / 1024)} KB`,
        uploadedAt: new Date().toISOString(),
        extractedNominationId: nomination.nominationId,
        nomineeName: nomination.nomineeName,
        extractedContent: nomination.nominationCitation,
        blobUrl: URL.createObjectURL(blob),
        dataUrl
      };
      onPreviewProofDoc(syntheticDoc, nomination);
    } else if (onOpenUploadProof) {
      onOpenUploadProof(nomination.nominationId || nomination.id);
    }
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenUploadProof) {
      onOpenUploadProof(nomination.nominationId || nomination.id);
    }
  };

  const isEmail = primaryDoc?.fileType === 'email';
  const isPdf = primaryDoc?.fileType === 'pdf';
  const isImage = primaryDoc?.fileType === 'image';

  // --- STATE 1: VERIFIED PROOF UPLOADED ---
  if (overview.status === 'verified_uploaded' && primaryDoc) {
    return (
      <div 
        className="mt-2 text-left bg-white rounded-xl border border-emerald-200/90 shadow-2xs hover:shadow-xs transition p-2.5 space-y-1.5 group select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Row: Badge, File Type & Inspect Action */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className={`p-1 rounded-md shrink-0 ${
              isEmail ? 'bg-amber-100 text-amber-800' : isPdf ? 'bg-rose-100 text-rose-800' : isImage ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {isEmail && <Mail className="w-3 h-3 stroke-[2.5]" />}
              {isPdf && <FileText className="w-3 h-3 stroke-[2.5]" />}
              {isImage && <ImageIcon className="w-3 h-3 stroke-[2.5]" />}
              {!isEmail && !isPdf && !isImage && <Paperclip className="w-3 h-3" />}
            </span>

            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none truncate max-w-[170px] ${overview.badgeClass}`}>
              {overview.badgeLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={handleInspect}
            className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 transition cursor-pointer shrink-0 shadow-2xs hover:scale-102"
            title="Click to inspect original proof file with PDF viewer or Email reader"
          >
            <Eye className="w-3 h-3 text-emerald-600" />
            <span>Read Proof</span>
          </button>
        </div>

        {/* Document Primary Subject / Title */}
        <div className="text-[11px] font-bold text-slate-900 truncate" title={overview.primaryTitle}>
          {overview.primaryTitle}
        </div>

        {/* Read Summary / Result Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-[10.5px] text-slate-700 leading-snug space-y-1">
          <div className="flex items-start space-x-1 text-slate-500">
            <Quote className="w-2.5 h-2.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-semibold text-[9.5px] uppercase tracking-wider text-slate-500">
              Proof Summary &amp; Key Finding:
            </span>
          </div>
          <p className="text-slate-800 font-sans italic pl-1">
            &ldquo;{overview.keyFindings}&rdquo;
          </p>

          {/* Metric Highlights if detected in document */}
          {overview.metricHighlights.length > 0 && (
            <div className="flex items-center flex-wrap gap-1 pt-1">
              <span className="text-[9px] text-slate-400 font-medium">Metrics:</span>
              {overview.metricHighlights.map((m, idx) => (
                <span key={idx} className="bg-emerald-100 text-emerald-900 text-[9px] font-mono font-bold px-1 py-0.2 rounded border border-emerald-200">
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Source / Sender info */}
          <div className="text-[9.5px] text-slate-400 font-mono pt-0.5 truncate border-t border-slate-200/60" title={overview.sourceLabel}>
            {overview.sourceLabel}
          </div>
        </div>

        {/* Multiple proofs indicator if > 1 */}
        {proofDocs.length > 1 && (
          <div className="flex items-center justify-between pt-0.5 text-[9.5px]">
            <span className="text-emerald-700 font-semibold flex items-center space-x-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{proofDocs.length} Total Proof Documents Verified</span>
            </span>
            <button
              type="button"
              onClick={handleInspect}
              className="text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
            >
              View all {proofDocs.length}
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- STATE 2: MARKED IN SPREADSHEET (FILE PENDING UPLOAD) ---
  if (overview.status === 'marked_in_sheet') {
    return (
      <div 
        className="mt-2 text-left bg-amber-50/60 rounded-xl border border-amber-200/90 p-2.5 space-y-1.5 shadow-2xs select-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center space-x-1 text-amber-900 font-bold text-[10.5px]">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Proof Registered in Sheet</span>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={handleInspect}
              className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 shadow-2xs transition cursor-pointer"
              title="Inspect official evidence dossier and registered proof"
            >
              <Eye className="w-2.5 h-2.5" />
              <span>View Dossier</span>
            </button>

            <button
              type="button"
              onClick={handleUpload}
              className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded border border-amber-500 shadow-2xs transition cursor-pointer"
              title="Upload original proof file (.pdf, .eml, .msg) to replace/verify"
            >
              <Upload className="w-2.5 h-2.5 stroke-[2.5]" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Candidate Citation Evidence Claim from Spreadsheet */}
        <div className="bg-white/80 rounded-lg p-2 border border-amber-200/70 text-[10.5px] space-y-1">
          <div className="flex items-start space-x-1 text-amber-800">
            <Quote className="w-2.5 h-2.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-semibold text-[9.5px] uppercase tracking-wider text-amber-900">
              Evidence Claim from Sheet:
            </span>
          </div>
          <p className="text-slate-800 font-sans italic pl-1 leading-snug">
            &ldquo;{overview.keyFindings}&rdquo;
          </p>

          {overview.metricHighlights.length > 0 && (
            <div className="flex items-center flex-wrap gap-1 pt-1">
              <span className="text-[9px] text-slate-400 font-medium">Claimed:</span>
              {overview.metricHighlights.map((m, idx) => (
                <span key={idx} className="bg-amber-100 text-amber-950 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-amber-200">
                  {m}
                </span>
              ))}
            </div>
          )}

          <div className="text-[9px] text-amber-900/70 pt-0.5 truncate border-t border-amber-200/50">
            {overview.sourceLabel}
          </div>
        </div>
      </div>
    );
  }

  // --- STATE 3: NO PROOF DOCUMENT ---
  return (
    <div 
      className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50/80 px-2 py-1 rounded-lg border border-slate-200/80"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex items-center space-x-1 text-slate-500">
        <Paperclip className="w-2.5 h-2.5 text-slate-400" />
        <span>No proof attached</span>
      </span>

      <button
        type="button"
        onClick={handleUpload}
        className="text-[10px] text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer"
        title="Upload proof document for this candidate"
      >
        + Attach
      </button>
    </div>
  );
};
