import React, { useState } from 'react';
import { NominationRecord, ProofDocument, getAlignmentAnalysis, getCompetencyCheckpoint } from '../types';
import { ProofOverviewBadge } from './ProofOverviewBadge';
import { 
  Sparkles, 
  Eye, 
  Paperclip, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Award, 
  Building2, 
  MapPin, 
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Trash2,
  Trophy,
  X,
  CheckSquare,
  Square,
  Calculator,
  Sliders,
  AlertTriangle,
  Scale,
  Mail,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface NominationTableProps {
  nominations: NominationRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectCandidate: (nomination: NominationRecord) => void;
  onEvaluateSingle: (nomination: NominationRecord) => void;
  onEvaluateSelected: (ids: string[]) => void;
  onDeleteSelected: (ids: string[]) => void;
  onOpenComparison: () => void;
  onOpenScoringDetails?: () => void;
  onOpenUploadProof?: (targetNominationId?: string) => void;
  onPreviewProofDoc?: (doc: ProofDocument, nom: NominationRecord) => void;
  onUpdateInternalDecision?: (nominationId: string, decision: string) => void;
  onBatchUpdateDecision?: (ids: string[], decision: string) => void;
  onFilterAlignment?: (alignment: string) => void;
  selectedAlignment?: string;
  evaluatingId: string | null;
  isEvaluatingBatch?: boolean;
}

type SortField = 'name' | 'category' | 'score' | 'approval' | 'bu' | 'decision' | 'alignment';

export const NominationTable: React.FC<NominationTableProps> = ({
  nominations,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDeselectAll,
  onSelectCandidate,
  onEvaluateSingle,
  onEvaluateSelected,
  onDeleteSelected,
  onOpenComparison,
  onOpenScoringDetails,
  onOpenUploadProof,
  onPreviewProofDoc,
  onUpdateInternalDecision,
  onBatchUpdateDecision,
  onFilterAlignment,
  selectedAlignment = 'ALL',
  evaluatingId,
  isEvaluatingBatch = false
}) => {
  // Sort by Internal Decision by default
  const [sortField, setSortField] = useState<SortField>('decision');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Matched vs Not Matched (x%) Alignment Statistics
  const alignmentCounts = React.useMemo(() => {
    let matched = 0;
    let notMatched = 0;
    let pending = 0;

    nominations.forEach((nom) => {
      const analysis = getAlignmentAnalysis(nom);
      if (analysis.category === 'Aligned') {
        matched++;
      } else if (analysis.category === 'AI Higher' || analysis.category === 'Human Higher') {
        notMatched++;
      } else {
        pending++;
      }
    });

    const totalDecided = matched + notMatched;
    const matchedPct = totalDecided > 0 ? Math.round((matched / totalDecided) * 100) : 0;
    const notMatchedPct = totalDecided > 0 ? Math.round((notMatched / totalDecided) * 100) : 0;

    return { matched, notMatched, pending, totalDecided, matchedPct, notMatchedPct };
  }, [nominations]);

  const totalProofsCount = React.useMemo(() => {
    return nominations.reduce((acc, n) => acc + (n.proofDocuments?.length || 0), 0);
  }, [nominations]);

  const sortedNominations = [...nominations].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'decision') {
      // Priority sorting: Winner (6) -> Shortlisted (5) -> Honorable Mention (4) -> Under Review (3) -> Pending Review (2) -> Rejected (1)
      const getPriority = (dec?: string) => {
        const l = (dec || '').toLowerCase();
        if (l.includes('winner') || l.includes('selected') || l.includes('awarded')) return 6;
        if (l.includes('shortlist') || l.includes('finalist')) return 5;
        if (l.includes('honorable') || l.includes('mention')) return 4;
        if (l.includes('under review') || l.includes('in review')) return 3;
        if (l.includes('pending') || l.includes('tbd')) return 2;
        if (l.includes('reject') || l.includes('not selected') || l.includes('declined')) return 1;
        return 0;
      };
      const prioA = getPriority(a.internalDecision);
      const prioB = getPriority(b.internalDecision);
      if (prioA !== prioB) {
        return sortAsc ? prioA - prioB : prioB - prioA;
      }
      valA = (a.internalDecision || '').toLowerCase();
      valB = (b.internalDecision || '').toLowerCase();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortField === 'score') {
      valA = a.evaluation?.humanOverrideScore ?? a.evaluation?.overallScore ?? -1;
      valB = b.evaluation?.humanOverrideScore ?? b.evaluation?.overallScore ?? -1;
    } else if (sortField === 'name') {
      valA = a.nomineeName.toLowerCase();
      valB = b.nomineeName.toLowerCase();
    } else if (sortField === 'category') {
      valA = a.nominationCategory.toLowerCase();
      valB = b.nominationCategory.toLowerCase();
    } else if (sortField === 'approval') {
      valA = a.primaryApproval.toLowerCase();
      valB = b.primaryApproval.toLowerCase();
    } else if (sortField === 'bu') {
      valA = a.buOfNominee.toLowerCase();
      valB = b.buOfNominee.toLowerCase();
    } else if (sortField === 'alignment') {
      valA = getAlignmentAnalysis(a).category;
      valB = getAlignmentAnalysis(b).category;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const allSelected = nominations.length > 0 && selectedIds.length === nominations.length;

  const handleViewEmployeeProof = (e: React.MouseEvent, nom: NominationRecord) => {
    e.stopPropagation();
    if (nom.proofDocuments && nom.proofDocuments.length > 0) {
      onPreviewProofDoc?.(nom.proofDocuments[0], nom);
      return;
    }

    // No local proof document uploaded yet - trigger upload modal for this employee
    onOpenUploadProof?.(nom.nominationId || nom.id);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      
      {/* Prominent Matched vs Not Matched (x%) Consensus Summary Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-bold text-slate-900">
              Consensus Breakdown:
            </span>
          </div>

          {/* Quick Sort Toggle Button */}
          <button
            onClick={() => {
              if (sortField === 'decision') {
                setSortAsc(!sortAsc);
              } else {
                setSortField('decision');
                setSortAsc(false);
              }
            }}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md border text-xs font-semibold transition cursor-pointer ${
              sortField === 'decision'
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Sort table by Internal Decision column"
          >
            <span>Sorted by Internal Decision</span>
            {sortField === 'decision' ? (
              sortAsc ? <ArrowUp className="w-3.5 h-3.5 text-amber-700" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
            )}
            <span className="text-[10px] text-slate-500 font-normal">
              ({sortField === 'decision' ? (sortAsc ? 'A-Z / Rejected First' : 'Winners First') : 'Click to Sort'})
            </span>
          </button>

          {/* Upload Proof Docs Button */}
          {onOpenUploadProof && (
            <button
              onClick={() => onOpenUploadProof()}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md text-xs shadow-2xs transition cursor-pointer border border-amber-600/30"
              title="Upload proof documents (.eml, .msg, .pdf, .jpg) from local system and map by Nomination ID"
            >
              <Paperclip className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Upload Proof Docs</span>
              {totalProofsCount > 0 ? (
                <span className="bg-slate-950 text-amber-300 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                  {totalProofsCount} attached
                </span>
              ) : (
                <span className="text-[10px] text-slate-900/80 font-normal hidden sm:inline">
                  (PDF, Email, JPG)
                </span>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Matched Pill */}
          <button 
            onClick={() => onFilterAlignment && onFilterAlignment(selectedAlignment === 'ALIGNED' ? 'ALL' : 'ALIGNED')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border font-bold shadow-2xs transition cursor-pointer ${
              selectedAlignment === 'ALIGNED'
                ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
            }`}
            title={`Matched: ${alignmentCounts.matched} (${alignmentCounts.matchedPct}%). Click to filter matched nominations.`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${selectedAlignment === 'ALIGNED' ? 'text-white' : 'text-emerald-700'}`} />
            <span>Matched: {alignmentCounts.matched} ({alignmentCounts.matchedPct}%)</span>
          </button>

          {/* Not Matched Pill */}
          <button 
            onClick={() => onFilterAlignment && onFilterAlignment(selectedAlignment === 'DISCREPANCY' ? 'ALL' : 'DISCREPANCY')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border font-bold shadow-2xs transition cursor-pointer ${
              selectedAlignment === 'DISCREPANCY'
                ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400'
                : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
            }`}
            title={`Not Matched: ${alignmentCounts.notMatched} (${alignmentCounts.notMatchedPct}%). Click to filter discrepancies.`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${selectedAlignment === 'DISCREPANCY' ? 'text-white' : 'text-rose-700'}`} />
            <span>Not Matched: {alignmentCounts.notMatched} ({alignmentCounts.notMatchedPct}%)</span>
          </button>

          {/* Pending Pill */}
          {alignmentCounts.pending > 0 && (
            <button 
              onClick={() => onFilterAlignment && onFilterAlignment(selectedAlignment === 'PENDING' ? 'ALL' : 'PENDING')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-full border font-medium transition cursor-pointer ${
                selectedAlignment === 'PENDING'
                  ? 'bg-slate-700 text-white border-slate-800'
                  : 'bg-slate-200/80 text-slate-700 border-slate-300 hover:bg-slate-300'
              }`}
              title={`Pending review: ${alignmentCounts.pending}`}
            >
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Pending Review: {alignmentCounts.pending}</span>
            </button>
          )}

          {/* Clear filter button if filtered */}
          {selectedAlignment !== 'ALL' && onFilterAlignment && (
            <button
              onClick={() => onFilterAlignment('ALL')}
              className="text-[11px] text-amber-700 hover:underline font-semibold ml-1 cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>
      </div>

      {/* Floating/Sticky Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3 text-xs">
            <span className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-md font-extrabold flex items-center space-x-1 shadow-sm">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedIds.length} Selected</span>
            </span>
            <span className="text-slate-400 hidden sm:inline">
              Perform batch operations on selected candidates
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              onClick={() => onEvaluateSelected(selectedIds)}
              disabled={isEvaluatingBatch}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg transition flex items-center space-x-1.5 shadow disabled:opacity-50"
              title="Run AI evaluation on selected nominations"
            >
              <Sparkles className={`w-3.5 h-3.5 text-slate-950 ${isEvaluatingBatch ? 'animate-spin' : ''}`} />
              <span>{isEvaluatingBatch ? 'Rating Selected...' : `Rate Selected (${selectedIds.length})`}</span>
            </button>

            <button
              onClick={onOpenComparison}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700 rounded-lg transition flex items-center space-x-1.5"
              title="Compare selected candidates side-by-side"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Compare Selected</span>
            </button>

            <button
              onClick={() => onDeleteSelected(selectedIds)}
              className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white font-semibold rounded-lg transition flex items-center space-x-1.5 shadow-sm"
              title="Delete selected candidates from list"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

            <button
              onClick={onDeselectAll}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Clear row selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-800"
                />
              </th>

              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-800 transition"
              >
                <div className="flex items-center space-x-1">
                  <span>Nominee & ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('category')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-800 transition"
              >
                <div className="flex items-center space-x-1">
                  <span>Category & Competency</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-4 min-w-[220px]">
                <span>Citation & Criteria</span>
              </th>

              <th
                onClick={() => handleSort('bu')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-800 transition min-w-[260px] max-w-[320px]"
              >
                <div className="flex items-center space-x-1">
                  <span>BU, Approvals &amp; Proof Overview</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('decision')}
                className={`py-3 px-3 cursor-pointer transition text-center min-w-[140px] ${
                  sortField === 'decision'
                    ? 'bg-amber-950 text-amber-300 font-bold border-b-2 border-amber-400'
                    : 'hover:bg-slate-800'
                }`}
                title="Sort by Internal Decision column (click to toggle order)"
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <span>Internal Decision</span>
                  {sortField === 'decision' ? (
                    sortAsc ? (
                      <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('score')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-800 transition text-center min-w-[140px]"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>AI Structured Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('alignment')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-800 transition text-center min-w-[150px]"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>AI vs Human Alignment</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-4 text-right">
                <span>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
            {sortedNominations.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium">No nominations match the selected filters.</p>
                    <p className="text-xs">Try clearing your search term or filter parameters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedNominations.map((nom) => {
                const isSelected = selectedIds.includes(nom.id);
                const isEvaluating = evaluatingId === nom.id;
                const score = nom.evaluation?.humanOverrideScore ?? nom.evaluation?.overallScore;
                const hasAttachment =
                  String(nom.isAttachmentUploaded).toLowerCase() === 'yes' ||
                  nom.isAttachmentUploaded === true;
                const alignment = getAlignmentAnalysis(nom);
                const checkpoint = getCompetencyCheckpoint(nom);

                // Internal decision styling
                const decision = nom.internalDecision || 'Pending Review';
                const lowerDec = decision.toLowerCase();
                let decStyle = 'bg-slate-100 text-slate-700 border-slate-300';
                if (lowerDec.includes('winner') || lowerDec.includes('selected') || lowerDec.includes('awarded')) {
                  decStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                } else if (lowerDec.includes('shortlist') || lowerDec.includes('finalist')) {
                  decStyle = 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
                } else if (lowerDec.includes('honorable') || lowerDec.includes('under review')) {
                  decStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
                } else if (lowerDec.includes('reject') || lowerDec.includes('not selected') || lowerDec.includes('declined')) {
                  decStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-medium';
                }

                // Color score pill
                let scoreBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                if (score !== undefined) {
                  if (score >= 90) {
                    scoreBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
                  } else if (score >= 80) {
                    scoreBadgeClass = 'bg-blue-50 text-blue-700 border-blue-300 font-semibold';
                  } else if (score >= 70) {
                    scoreBadgeClass = 'bg-amber-50 text-amber-700 border-amber-300 font-semibold';
                  } else {
                    scoreBadgeClass = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
                  }
                }

                return (
                  <tr
                    key={nom.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isSelected ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(nom.id)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>

                    {/* Nominee & ID */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{nom.nomineeName}</div>
                      <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{nom.nomineeId}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-slate-600">{nom.nominationId}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        <span className="text-slate-400">By:</span> <span className="text-slate-700 font-medium">{nom.nominatedBy}</span>
                      </div>
                      {/* Managerial Checkpoint Pill */}
                      <div className="mt-1">
                        <span 
                          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] border shadow-2xs ${checkpoint.badgeClass}`}
                          title={`${checkpoint.checkpointStatus}: ${checkpoint.strategicWhyExplanation}`}
                        >
                          <span>{checkpoint.badgeLabel}</span>
                          {checkpoint.boostPercentage > 0 && (
                            <span className="font-extrabold ml-0.5 text-[9px] bg-white/70 px-1 rounded">+{checkpoint.boostPercentage}%</span>
                          )}
                        </span>
                      </div>

                      {/* DOJ & Practice info */}
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                        <span>DOJ: {nom.doj}</span>
                        <span>&bull;</span>
                        <span className="truncate max-w-[120px]">{nom.practice}</span>
                      </div>
                    </td>

                    {/* Category & Competency */}
                    <td className="py-3 px-3">
                      <span className="inline-block bg-slate-900 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-800">
                        {nom.nominationCategory}
                      </span>
                      <div className="text-slate-700 text-[11px] font-medium mt-1 flex items-center flex-wrap gap-1">
                        <span>{nom.competency}</span>
                        {nom.nomineeBand && (
                          <span className="bg-slate-200 text-slate-800 font-mono font-bold text-[9px] px-1.5 py-0.2 rounded border border-slate-300">
                            {nom.nomineeBand}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Type: {nom.nominationType}
                      </div>
                    </td>

                    {/* Citation & Criteria */}
                    <td className="py-3 px-4">
                      <div
                        className="line-clamp-2 text-slate-800 text-xs cursor-pointer hover:text-amber-700 transition"
                        onClick={() => onSelectCandidate(nom)}
                        title={nom.nominationCitation}
                      >
                        {nom.nominationCitation}
                      </div>
                      <div className="line-clamp-1 text-[11px] text-slate-500 italic mt-1 bg-slate-100 p-1 rounded border border-slate-200/80">
                        Criteria: {nom.evaluationCriteria.replace(/\n/g, ' ')}
                      </div>
                    </td>

                    {/* BU, Approvals & Proof Overview */}
                    <td className="py-3 px-3 min-w-[260px] max-w-[320px]">
                      <div className="flex items-center space-x-1 text-slate-800 font-medium">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{nom.buOfNominee}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{nom.nomineeLocation}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] mt-1">
                        <span className={`inline-flex items-center space-x-0.5 ${nom.primaryApproval === 'Approved' ? 'text-emerald-700 font-medium' : 'text-amber-600'}`}>
                          {nom.primaryApproval === 'Approved' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                          <span>{nom.primaryApproval}</span>
                        </span>
                      </div>

                      {/* Read Proof Overview & Extracted Summary/Result */}
                      <ProofOverviewBadge
                        nomination={nom}
                        onPreviewProofDoc={onPreviewProofDoc}
                        onOpenUploadProof={onOpenUploadProof}
                      />
                    </td>

                    {/* Internal Decision Column - Shown as is (no dropdown) */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs border shadow-2xs ${decStyle}`}
                          title={`Internal Decision: ${nom.internalDecision || 'Pending Review'}`}
                        >
                          <span>{nom.internalDecision || 'Pending Review'}</span>
                        </span>
                      </div>
                    </td>

                    {/* AI Structured Score */}
                    <td className="py-3 px-4 text-center">
                      {nom.evaluation ? (
                        <div 
                          className="flex flex-col items-center cursor-pointer group"
                          onClick={() => onSelectCandidate(nom)}
                          title="Click to view detailed scoring breakdown and criteria evaluation"
                        >
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs border shadow-2xs transition group-hover:scale-105 ${scoreBadgeClass}`}
                          >
                            <Award className="w-3 h-3 mr-1" />
                            <span>{score} / 100</span>
                          </span>

                          <span className="text-[10px] font-medium text-slate-600 mt-1 text-center line-clamp-1">
                            {nom.evaluation.recommendationTier.split(' - ')[0]}
                          </span>

                          {/* 3 Foundational Inputs Pills Row */}
                          {nom.evaluation.threeFactorsBreakdown ? (
                            <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono">
                              <span 
                                title={`Input 1: Spreadsheet Comments (${nom.evaluation.threeFactorsBreakdown.commentsAnalysis.score100 ?? Math.round(nom.evaluation.threeFactorsBreakdown.commentsAnalysis.score * 10)}/100, 35% weight)`} 
                                className="bg-blue-100 text-blue-900 px-1 rounded font-semibold"
                              >
                                Comm:{nom.evaluation.threeFactorsBreakdown.commentsAnalysis.score100 ?? Math.round(nom.evaluation.threeFactorsBreakdown.commentsAnalysis.score * 10)}
                              </span>
                              <span 
                                title={`Input 2: Proof Docs (${nom.evaluation.threeFactorsBreakdown.proofDocsAnalysis.score100 ?? Math.round(nom.evaluation.threeFactorsBreakdown.proofDocsAnalysis.score * 10)}/100, 35% weight)`} 
                                className="bg-emerald-100 text-emerald-900 px-1 rounded font-semibold"
                              >
                                Proof:{nom.evaluation.threeFactorsBreakdown.proofDocsAnalysis.score100 ?? Math.round(nom.evaluation.threeFactorsBreakdown.proofDocsAnalysis.score * 10)}
                              </span>
                              <span 
                                title={`Input 3: Whom Nominated By (${nom.evaluation.threeFactorsBreakdown.nominatorCompetencyAnalysis.level} - ${nom.evaluation.threeFactorsBreakdown.nominatorCompetencyAnalysis.roleTitle}, 30% weight)`} 
                                className="bg-purple-100 text-purple-900 px-1 rounded font-semibold"
                              >
                                Band:{nom.evaluation.threeFactorsBreakdown.nominatorCompetencyAnalysis.level}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 mt-1 text-[9px] font-mono text-slate-500">
                              <span title="Business Impact Score (35%)" className="bg-amber-100 text-amber-800 px-1 rounded">I:{nom.evaluation.impactScore}</span>
                              <span title="Criteria Alignment Score (25%)" className="bg-blue-100 text-blue-800 px-1 rounded">C:{nom.evaluation.criteriaAlignmentScore}</span>
                              <span title="Citation Evidence Score (20%)" className="bg-emerald-100 text-emerald-800 px-1 rounded">E:{nom.evaluation.citationEvidenceScore}</span>
                              <span title="Competency Score (20%)" className="bg-purple-100 text-purple-800 px-1 rounded">M:{nom.evaluation.competencyScore}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span 
                          onClick={() => onSelectCandidate(nom)}
                          className="inline-block text-[11px] text-slate-400 bg-slate-100 hover:bg-slate-200 cursor-pointer px-2.5 py-1 rounded border border-slate-200 transition"
                        >
                          Not Rated
                        </span>
                      )}
                    </td>

                    {/* AI vs Human Alignment Column */}
                    <td className="py-3 px-3 text-center">
                      <div 
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs cursor-help transition hover:scale-105 ${alignment.badgeBg} ${alignment.badgeText} ${alignment.badgeBorder}`}
                        title={alignment.explanation}
                      >
                        {alignment.iconType === 'check' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {alignment.iconType === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                        {alignment.iconType === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        {alignment.iconType === 'clock' && <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span className="whitespace-nowrap">{alignment.label}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => onEvaluateSingle(nom)}
                        disabled={isEvaluating}
                        className="inline-flex items-center space-x-1 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2 py-1 rounded-md transition disabled:opacity-50"
                        title="Run AI Category Evaluation"
                      >
                        <Sparkles className={`w-3 h-3 text-amber-600 ${isEvaluating ? 'animate-spin' : ''}`} />
                        <span>{isEvaluating ? 'Rating...' : nom.evaluation ? 'Re-rate' : 'Evaluate'}</span>
                      </button>

                      <button
                        onClick={() => onSelectCandidate(nom)}
                        className="inline-flex items-center space-x-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2 py-1 rounded-md transition"
                        title="View Full Evaluation Rationale & Criteria Breakdown"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => onDeleteSelected([nom.id])}
                        className="inline-flex items-center p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete candidate record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          <span>
            Showing <span className="font-semibold text-slate-800">{sortedNominations.length}</span> of <span className="font-semibold text-slate-800">{nominations.length}</span> candidates
          </span>
          {onOpenScoringDetails && (
            <button
              onClick={onOpenScoringDetails}
              className="text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1 hover:underline"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>View Scoring Rubric & Formula</span>
            </button>
          )}
        </div>
        <div>
          {selectedIds.length > 0 ? (
            <span className="text-amber-700 font-semibold">{selectedIds.length} candidate(s) selected for bulk actions.</span>
          ) : (
            <span>Sub-scores: <strong className="text-amber-700">I</strong>:Impact (35%), <strong className="text-blue-700">C</strong>:Criteria (25%), <strong className="text-emerald-700">E</strong>:Evidence (20%), <strong className="text-purple-700">M</strong>:Mastery (20%)</span>
          )}
        </div>
      </div>
    </div>
  );
};

