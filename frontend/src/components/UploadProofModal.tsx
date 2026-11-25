import React, { useState, useRef } from 'react';
import { NominationRecord, ProofDocument } from '../types';
import { processFileToProofDocument } from '../utils/proofParser';
import { generateValidProofPdf, generateValidEml } from '../utils/pdfGenerator';
import { 
  X, 
  Upload, 
  Paperclip, 
  FileText, 
  Mail, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Sparkles,
  Info,
  RefreshCw,
  Files
} from 'lucide-react';

interface StagedProofFile {
  doc: ProofDocument;
  selectedNominationId: string; // The target nomination ID to attach to
  matchedNomineeName: string;
  isAutoMatched: boolean;
}

interface UploadProofModalProps {
  isOpen: boolean;
  nominations: NominationRecord[];
  targetNominationId?: string; // If opened for a specific candidate
  onClose: () => void;
  onAttachProofs: (mappings: { nominationId: string; proof: ProofDocument }[]) => void;
}

export const UploadProofModal: React.FC<UploadProofModalProps> = ({
  isOpen,
  nominations,
  targetNominationId,
  onClose,
  onAttachProofs
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedProofFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    setIsProcessing(true);
    setProcessingCount(filesArray.length);

    try {
      // Process all files in parallel with Promise.all
      const processedResults = await Promise.all(
        filesArray.map(async (file) => {
          try {
            const doc = await processFileToProofDocument(file, nominations);

            // Determine target nomination ID: prioritize individual file match first
            let targetId = '';
            let matchedName = '';
            let isAuto = false;

            if (doc.extractedNominationId) {
              const matchedNom = nominations.find(
                (n) => n.nominationId === doc.extractedNominationId || n.id === doc.extractedNominationId
              );
              if (matchedNom) {
                targetId = matchedNom.nominationId || matchedNom.id;
                matchedName = matchedNom.nomineeName;
                isAuto = true;
              }
            }

            // Fallback match by nominee name in document
            if (!targetId && doc.nomineeName) {
              const nameNom = nominations.find(
                (n) => n.nomineeName.toLowerCase() === doc.nomineeName?.toLowerCase()
              );
              if (nameNom) {
                targetId = nameNom.nominationId || nameNom.id;
                matchedName = nameNom.nomineeName;
                isAuto = true;
              }
            }

            // Fallback: if only 1 file or no file-specific match was found, use clicked target candidate
            if (!targetId && targetNominationId && (filesArray.length === 1 || !doc.extractedNominationId)) {
              const targetNom = nominations.find((n) => n.id === targetNominationId || n.nominationId === targetNominationId);
              if (targetNom) {
                targetId = targetNom.nominationId || targetNom.id;
                matchedName = targetNom.nomineeName;
                isAuto = false;
              }
            }

            return {
              doc,
              selectedNominationId: targetId,
              matchedNomineeName: matchedName,
              isAutoMatched: isAuto
            } as StagedProofFile;
          } catch (err) {
            console.error('Error processing file:', file.name, err);
            return null;
          }
        })
      );

      const validNewStaged = processedResults.filter((item): item is StagedProofFile => item !== null);
      setStagedFiles((prev) => [...prev, ...validNewStaged]);
    } finally {
      setIsProcessing(false);
      setProcessingCount(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // reset to allow re-uploading same filenames
  };

  const handleRemoveStaged = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllStaged = () => {
    setStagedFiles([]);
  };

  const handleAutoRemapAll = () => {
    setStagedFiles((prev) =>
      prev.map((item) => {
        if (item.selectedNominationId) return item;
        // Try to match again
        const candidate = nominations.find((n) => {
          const nomId = (n.nominationId || '').toLowerCase();
          const cleanNom = nomId.replace(/[^a-z0-9]/g, '');
          const fn = item.doc.fileName.toLowerCase();
          const cleanFn = fn.replace(/[^a-z0-9]/g, '');
          return fn.includes(nomId) || (cleanNom && cleanFn.includes(cleanNom));
        });

        if (candidate) {
          return {
            ...item,
            selectedNominationId: candidate.nominationId || candidate.id,
            matchedNomineeName: candidate.nomineeName,
            isAutoMatched: true
          };
        }
        return item;
      })
    );
  };

  const handleTargetChange = (index: number, newNomId: string) => {
    const targetNom = nominations.find((n) => n.nominationId === newNomId || n.id === newNomId);
    setStagedFiles((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              selectedNominationId: newNomId,
              matchedNomineeName: targetNom?.nomineeName || '',
              isAutoMatched: false
            }
          : item
      )
    );
  };

  const handleLoadDemoProofs = () => {
    const targetNom1 = nominations.find((n) => n.nominationId === 'RR-90412' || n.id.includes('001')) || nominations[0];
    const targetNom2 = nominations.find((n) => n.nominationId === 'RR-90413' || n.id.includes('002')) || nominations[1] || nominations[0];
    const targetNom3 = nominations.find((n) => n.nominationId === 'RR-90414' || n.id.includes('003')) || nominations[2] || nominations[0];

    const demoDocs: StagedProofFile[] = [];

    if (targetNom1) {
      const emailMeta = {
        subject: 'Commendation: Automation & Architecture Delivery',
        from: 'client.vp@fintechcorp.com',
        to: 'leadership@company.com',
        date: 'Mon, 28 Jul 2026 14:22:10 -0400',
        bodySnippet: `Dear Leadership,\n\nWe would like to formally commend ${targetNom1.nomineeName} for extraordinary delivery. The automated review pipeline cut release cycle times drastically from 18 hours to 45 minutes, saving our teams dozens of hours and preventing 3 critical production downtime incidents during Q2 releases.\n\nBest regards,\nVP of Engineering`
      };
      const fileName = `${targetNom1.nominationId || 'RR-90412'}_Client_Commendation.eml`;
      const { blob: emlBlob, dataUrl: emlDataUrl } = generateValidEml(emailMeta, emailMeta.bodySnippet);
      const emlFile = new File([emlBlob], fileName, { type: 'message/rfc822' });

      demoDocs.push({
        doc: {
          id: `DEMO-${Date.now()}-1`,
          fileName,
          fileType: 'email',
          fileSize: emlBlob.size,
          formattedSize: `${(emlBlob.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toISOString(),
          extractedNominationId: targetNom1.nominationId,
          nomineeName: targetNom1.nomineeName,
          emailMeta,
          rawFile: emlFile,
          blobUrl: URL.createObjectURL(emlBlob),
          dataUrl: emlDataUrl,
          extractedContent: emailMeta.bodySnippet
        },
        selectedNominationId: targetNom1.nominationId || targetNom1.id,
        matchedNomineeName: targetNom1.nomineeName,
        isAutoMatched: true
      });
    }

    if (targetNom2) {
      const fileName = `${targetNom2.nominationId || 'RR-90413'}_Circuit_Breaker_Signoff.pdf`;
      const extractedContent = `INCIDENT POST-MORTEM & EXECUTIVE SIGNOFF REPORT\n\nIncident Ref: INC-BF-2026-9921\nProject: Global E-Commerce Omnichannel Platform\nEngineer: ${targetNom2.nomineeName} (${targetNom2.nomineeId})\n\nSummary:\nDuring the peak sales event, payment gateway third-party API crashed. Fallback circuit breaker authored and deployed within 3 hours, preserving $450K in transaction throughput with zero ledger corruption.\n\nDelivery Head Sign-off: Vikram Sethi (Delivery Head - C6)\nStatus: Formally Commended & Approved`;
      
      const { blob: pdfBlob, dataUrl: pdfDataUrl } = generateValidProofPdf(targetNom2, {
        fileName,
        extractedContent
      } as any);
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      demoDocs.push({
        doc: {
          id: `DEMO-${Date.now()}-2`,
          fileName,
          fileType: 'pdf',
          fileSize: pdfBlob.size,
          formattedSize: `${Math.round(pdfBlob.size / 1024)} KB`,
          uploadedAt: new Date().toISOString(),
          extractedNominationId: targetNom2.nominationId,
          nomineeName: targetNom2.nomineeName,
          extractedContent,
          rawFile: pdfFile,
          blobUrl: URL.createObjectURL(pdfBlob),
          dataUrl: pdfDataUrl
        },
        selectedNominationId: targetNom2.nominationId || targetNom2.id,
        matchedNomineeName: targetNom2.nomineeName,
        isAutoMatched: true
      });
    }

    if (targetNom3) {
      const fileName = `${targetNom3.nominationId || 'RR-90414'}_CSAT_Renewal_Metrics.pdf`;
      const extractedContent = `EXECUTIVE COMMENDATION & RENEWAL CONFIRMATION\n\nAccount: Healthcare Analytics Modernization\nLead: ${targetNom3.nomineeName} (${targetNom3.nomineeId})\n\nMetrics Achieved:\n- CSAT Turnaround: 4.2/10 -> 9.6/10 (+128%)\n- Renewal: 2-Year Contract Extension ($1.8M ARR)\n\nClient Endorsement:\n"${targetNom3.nomineeName} turned around our account with extraordinary transparency and delivery discipline."\n- Mark Robinson, COO, HealthTech Partners`;

      const { blob: pdfBlob, dataUrl: pdfDataUrl } = generateValidProofPdf(targetNom3, {
        fileName,
        extractedContent
      } as any);
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      demoDocs.push({
        doc: {
          id: `DEMO-${Date.now()}-3`,
          fileName,
          fileType: 'pdf',
          fileSize: pdfBlob.size,
          formattedSize: `${Math.round(pdfBlob.size / 1024)} KB`,
          uploadedAt: new Date().toISOString(),
          extractedNominationId: targetNom3.nominationId,
          nomineeName: targetNom3.nomineeName,
          extractedContent,
          rawFile: pdfFile,
          blobUrl: URL.createObjectURL(pdfBlob),
          dataUrl: pdfDataUrl
        },
        selectedNominationId: targetNom3.nominationId || targetNom3.id,
        matchedNomineeName: targetNom3.nomineeName,
        isAutoMatched: true
      });
    }

    setStagedFiles((prev) => [...prev, ...demoDocs]);
  };

  const handleConfirmAttach = () => {
    const mappings: { nominationId: string; proof: ProofDocument }[] = [];

    stagedFiles.forEach((staged) => {
      if (staged.selectedNominationId) {
        const nom = nominations.find(
          (n) => n.nominationId === staged.selectedNominationId || n.id === staged.selectedNominationId
        );
        const targetId = nom?.id || staged.selectedNominationId;
        mappings.push({
          nominationId: targetId,
          proof: {
            ...staged.doc,
            extractedNominationId: nom?.nominationId || staged.selectedNominationId,
            nomineeName: nom?.nomineeName || staged.matchedNomineeName
          }
        });
      }
    });

    onAttachProofs(mappings);
    setStagedFiles([]);
    onClose();
  };

  const totalValidMapped = stagedFiles.filter((s) => Boolean(s.selectedNominationId)).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-inner">
              <Files className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Batch Upload &amp; Map Proof Documents
              </h3>
              <p className="text-xs text-slate-400">
                Upload all proof documents at once (.pdf, .eml, .msg, .jpg, .png) &amp; map to Nomination IDs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          
          {/* Naming Pattern Info Box */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3.5 text-xs text-amber-950 flex items-start space-x-2.5 shadow-2xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-amber-900 block mb-0.5">
                Automatic Nomination ID Mapping:
              </strong>
              Files starting with the <strong>Nomination ID</strong> (from Excel) will automatically link to the corresponding employee.
              <span className="block mt-1 text-[11px] text-amber-800 font-mono">
                Examples: <em>RR-90412_Client_Appreciation_Email.eml</em> &bull; <em>RR-90413-Migration_Signoff.pdf</em> &bull; <em>RR-90415_Screenshot.jpg</em>
              </span>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-50/70 shadow-md scale-[1.01]'
                : 'border-slate-300 hover:border-amber-500 bg-white hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.eml,.msg,.txt,.doc,.docx"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                <Upload className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">
                Click or drag &amp; drop all proof files at once
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Select <strong>all files at once</strong> (hold Shift/Ctrl/⌘ Cmd to multi-select). Supports <strong>Emails</strong> (.eml, .msg), <strong>PDFs</strong> (.pdf), and <strong>Images</strong> (.jpg, .png).
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold shadow-xs">
                  <Files className="w-3.5 h-3.5" />
                  <span>Select All Files (Batch)</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadDemoProofs();
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition"
                  title="Load 3 sample proof files to test batch mapping"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Load Demo Proof Files</span>
                </button>
              </div>
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="p-3 text-center text-xs text-amber-800 font-semibold bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4 animate-spin text-amber-700" />
              <span>Concurrently processing {processingCount} files at once and auto-matching to nomination IDs...</span>
            </div>
          )}

          {/* Staged Files List */}
          {stagedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                  <span>Staged Proof Documents ({stagedFiles.length})</span>
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAutoRemapAll}
                    className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200"
                    title="Re-run prefix mapping against nominations"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Map</span>
                  </button>
                  <button
                    onClick={handleClearAllStaged}
                    className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200"
                    title="Clear all staged files"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {totalValidMapped} / {stagedFiles.length} Mapped
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 shadow-sm max-h-[300px] overflow-y-auto">
                {stagedFiles.map((item, idx) => {
                  const isEmail = item.doc.fileType === 'email';
                  const isPdf = item.doc.fileType === 'pdf';
                  const isImage = item.doc.fileType === 'image';

                  return (
                    <div key={item.doc.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition text-xs">
                      {/* File Icon & Info */}
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isEmail ? 'bg-amber-100 text-amber-800' : isPdf ? 'bg-rose-100 text-rose-800' : isImage ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isEmail && <Mail className="w-4 h-4" />}
                          {isPdf && <FileText className="w-4 h-4" />}
                          {isImage && <ImageIcon className="w-4 h-4" />}
                          {!isEmail && !isPdf && !isImage && <Paperclip className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate max-w-xs" title={item.doc.fileName}>
                            {item.doc.fileName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.doc.formattedSize} &bull; {item.doc.fileType.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Mapping Target Selector */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="flex flex-col items-end">
                          <select
                            value={item.selectedNominationId}
                            onChange={(e) => handleTargetChange(idx, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer max-w-[240px] ${
                              item.selectedNominationId
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                                : 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                            }`}
                          >
                            <option value="">-- Select Candidate to Link --</option>
                            {nominations.map((nom) => (
                              <option key={nom.id} value={nom.nominationId || nom.id}>
                                {nom.nominationId}: {nom.nomineeName} ({nom.nominationCategory})
                              </option>
                            ))}
                          </select>

                          {item.isAutoMatched && (
                            <span className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center space-x-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Auto-matched by Nomination ID prefix</span>
                            </span>
                          )}
                          {!item.selectedNominationId && (
                            <span className="text-[10px] text-rose-600 font-medium mt-0.5">
                              Please select a candidate
                            </span>
                          )}
                        </div>

                        {/* Remove item */}
                        <button
                          onClick={() => handleRemoveStaged(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {stagedFiles.length > 0
              ? `${totalValidMapped} of ${stagedFiles.length} ready to attach`
              : 'Select files to preview mapping'}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmAttach}
              disabled={totalValidMapped === 0}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attach All ({totalValidMapped}) Proof Documents</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
