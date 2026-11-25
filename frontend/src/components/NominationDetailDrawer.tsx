import React, { useState } from 'react';
import { 
  NominationRecord, 
  ProofDocument,
  getAlignmentAnalysis, 
  getCompetencyCheckpoint, 
  COMPETENCY_LADDER, 
  CompetencyBand 
} from '../types';
import { getSingleDocumentSummary } from '../utils/proofSummaryHelper';
import { 
  X, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Paperclip, 
  ThumbsUp, 
  Edit3, 
  Save, 
  Building2, 
  MapPin, 
  Calendar, 
  UserCheck, 
  TrendingUp, 
  ShieldCheck, 
  Info, 
  Scale, 
  Clock,
  Briefcase,
  ChevronRight,
  Mail,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Eye,
  MessageSquare
} from 'lucide-react';

interface NominationDetailDrawerProps {
  nomination: NominationRecord | null;
  onClose: () => void;
  onEvaluate: (nomination: NominationRecord) => void;
  onSaveHumanOverride: (nominationId: string, overrideScore: number, notes: string) => void;
  onUpdateInternalDecision?: (nominationId: string, decision: string) => void;
  onUpdateNominatorCompetency?: (nominationId: string, level: string) => void;
  onOpenScoringDetails?: () => void;
  onPreviewProofDoc?: (doc: ProofDocument, nom: NominationRecord) => void;
  onOpenUploadProof?: (targetNominationId?: string) => void;
  isEvaluating: boolean;
}

export const NominationDetailDrawer: React.FC<NominationDetailDrawerProps> = ({
  nomination,
  onClose,
  onEvaluate,
  onSaveHumanOverride,
  onUpdateInternalDecision,
  onUpdateNominatorCompetency,
  onOpenScoringDetails,
  onPreviewProofDoc,
  onOpenUploadProof,
  isEvaluating
}) => {
  if (!nomination) return null;

  const [overrideScore, setOverrideScore] = useState<number>(
    nomination.evaluation?.humanOverrideScore ?? nomination.evaluation?.overallScore ?? 85
  );
  const [humanNotes, setHumanNotes] = useState<string>(
    nomination.evaluation?.humanNotes || ''
  );
  const [isEditingScore, setIsEditingScore] = useState<boolean>(false);

  const evalResult = nomination.evaluation;
  const alignment = getAlignmentAnalysis(nomination);
  const checkpoint = getCompetencyCheckpoint(nomination);
  const hasAttachment =
    String(nomination.isAttachmentUploaded).toLowerCase() === 'yes' ||
    nomination.isAttachmentUploaded === true;

  const handleSaveScore = () => {
    onSaveHumanOverride(nomination.id, overrideScore, humanNotes);
    setIsEditingScore(false);
  };

  const handleCompetencyLevelChange = (level: string) => {
    if (onUpdateNominatorCompetency) {
      onUpdateNominatorCompetency(nomination.id, level);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-y-auto">
        
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-6 sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {nomination.nominationCategory}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {nomination.nominationId}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-2">
                {nomination.nomineeName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {nomination.nomineeId} &bull; {nomination.buOfNominee} &bull; {nomination.practice}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Nominated By</span>
              <span className="text-slate-800 font-semibold">{nomination.nominatedBy}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Competency</span>
              <span className="text-slate-800 font-semibold">{nomination.competency}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Location</span>
              <span className="text-slate-800 font-semibold">{nomination.nomineeLocation}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Date of Joining</span>
              <span className="text-slate-800 font-semibold">{nomination.doj}</span>
            </div>
          </div>

          {/* AI Score Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Category Evaluation Outcome
                </span>
                <div className="text-3xl font-extrabold mt-1 text-white flex items-baseline gap-2">
                  <span>{evalResult ? (evalResult.humanOverrideScore ?? evalResult.overallScore) : 'Unrated'}</span>
                  <span className="text-sm font-normal text-slate-400">/ 100 Weighted Score</span>
                </div>
                {evalResult && (
                  <div className="mt-1">
                    <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-md font-medium">
                      {evalResult.recommendationTier}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEvaluate(nomination)}
                  disabled={isEvaluating}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
                  <span>{isEvaluating ? 'Evaluating...' : evalResult ? 'Re-Evaluate (AI)' : 'Run AI Evaluation'}</span>
                </button>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            {evalResult && (
              <div className="space-y-3 mt-5 pt-4 border-t border-slate-700/60">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold text-amber-300">4-Dimension Weighted Formula breakdown</span>
                  {onOpenScoringDetails && (
                    <button
                      onClick={onOpenScoringDetails}
                      className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                    >
                      View Full Rubric & Matrix
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  {/* Impact */}
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-medium">1. Business Impact</span>
                      <div className="flex items-center space-x-1">
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded">35% Wt</span>
                        <span className="text-amber-400 font-bold">{evalResult.impactScore} / 10</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(evalResult.impactScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Criteria Alignment */}
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-medium">2. Criteria Alignment</span>
                      <div className="flex items-center space-x-1">
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] px-1.5 py-0.2 rounded">25% Wt</span>
                        <span className="text-blue-400 font-bold">{evalResult.criteriaAlignmentScore} / 10</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(evalResult.criteriaAlignmentScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Citation Evidence */}
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-medium">3. Citation Evidence</span>
                      <div className="flex items-center space-x-1">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded">20% Wt</span>
                        <span className="text-emerald-400 font-bold">{evalResult.citationEvidenceScore} / 10</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(evalResult.citationEvidenceScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Competency Mastery */}
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-medium">4. Competency Mastery</span>
                      <div className="flex items-center space-x-1">
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 py-0.2 rounded">20% Wt</span>
                        <span className="text-purple-400 font-bold">{evalResult.competencyScore} / 10</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(evalResult.competencyScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* AI vs Human Committee Alignment Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>AI vs Human Committee Alignment</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparing internal committee decision with AI structured score
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${alignment.badgeBg} ${alignment.badgeText} ${alignment.badgeBorder}`}>
                  {alignment.iconType === 'check' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {alignment.iconType === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-orange-600" />}
                  {alignment.iconType === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  {alignment.iconType === 'clock' && <Clock className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{alignment.label}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">
                  Human Committee Decision
                </span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {nomination.internalDecision || 'Decision Pending Review'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">
                  AI Structured Rating
                </span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {evalResult ? `${evalResult.humanOverrideScore ?? evalResult.overallScore}/100 (${evalResult.recommendationTier.split(' - ')[0]})` : 'Not Rated Yet'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-200/80">
              <strong className="text-amber-950 font-semibold">Alignment Rationale: </strong>
              {alignment.explanation}
            </p>
          </div>

          {/* 3-Factor AI Evaluation Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>3-Factor AI Evaluation Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rating synthesized strictly from Spreadsheet Comments, Proof Docs, and Nominator Competency
                  </p>
                </div>
              </div>

              {evalResult && (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full">
                  Score: {evalResult.humanOverrideScore ?? evalResult.overallScore} / 100
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              {/* Factor 1: Comments */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-blue-900 font-bold">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>1. Spreadsheet Comments (35%)</span>
                  </div>
                  {evalResult?.threeFactorsBreakdown && (
                    <span className="bg-blue-200/70 text-blue-950 font-bold px-2 py-0.5 rounded text-[10px]">
                      {evalResult.threeFactorsBreakdown.commentsAnalysis.score100 ?? Math.round(evalResult.threeFactorsBreakdown.commentsAnalysis.score * 10)}/100
                    </span>
                  )}
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {evalResult?.threeFactorsBreakdown?.commentsAnalysis.summary ||
                    `Citation length: ${nomination.nominationCitation.length} chars. Evaluated against ${nomination.nominationCategory} criteria for quantifiable outcomes.`}
                </p>

                {/* Show extracted metrics tags if present */}
                {evalResult?.threeFactorsBreakdown?.commentsAnalysis.extractedMetricsList && evalResult.threeFactorsBreakdown.commentsAnalysis.extractedMetricsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {evalResult.threeFactorsBreakdown.commentsAnalysis.extractedMetricsList.slice(0, 4).map((m: string, idx: number) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 border border-blue-200 font-mono text-[9px] px-1.5 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-1 text-[10px] text-slate-500 font-mono">
                  {nomination.nominationCitation.length} characters &bull; {nomination.nominationCategory}
                </div>
              </div>

              {/* Factor 2: Proof Docs */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-emerald-900 font-bold">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <span>2. Proof Documents (35%)</span>
                  </div>
                  {evalResult?.threeFactorsBreakdown && (
                    <span className="bg-emerald-200/70 text-emerald-950 font-bold px-2 py-0.5 rounded text-[10px]">
                      {evalResult.threeFactorsBreakdown.proofDocsAnalysis.score100 ?? Math.round(evalResult.threeFactorsBreakdown.proofDocsAnalysis.score * 10)}/100
                    </span>
                  )}
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {evalResult?.threeFactorsBreakdown?.proofDocsAnalysis.summary ||
                    (nomination.proofDocuments && nomination.proofDocuments.length > 0
                      ? `${nomination.proofDocuments.length} verified proof file(s) attached (${nomination.proofDocuments.map(p => p.fileName).join(', ')}). Corroborates claims with documentary evidence.`
                      : 'No proof documents uploaded. Uploading client emails (.eml/.msg) or PDF dossiers will corroborate spreadsheet claims and boost evidence score.')}
                </p>

                {/* Proof details pill tags */}
                {evalResult?.threeFactorsBreakdown?.proofDocsAnalysis.proofDetails && evalResult.threeFactorsBreakdown.proofDocsAnalysis.proofDetails.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {evalResult.threeFactorsBreakdown.proofDocsAnalysis.proofDetails.slice(0, 2).map((d: string, idx: number) => (
                      <span key={idx} className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium text-[9px] px-1.5 py-0.5 rounded line-clamp-1">
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-800 font-semibold font-mono">
                    {nomination.proofDocuments?.length || 0} proof(s) attached
                  </span>
                  {(!nomination.proofDocuments || nomination.proofDocuments.length === 0) && onOpenUploadProof && (
                    <button
                      onClick={() => onOpenUploadProof(nomination.nominationId || nomination.id)}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                    >
                      + Attach Proof
                    </button>
                  )}
                </div>
              </div>

              {/* Factor 3: Whom Nominated By (Nominator Band) */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-purple-900 font-bold">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span>3. Whom Nominated By (30%)</span>
                  </div>
                  {evalResult?.threeFactorsBreakdown && (
                    <span className="bg-purple-200/70 text-purple-950 font-bold px-2 py-0.5 rounded text-[10px]">
                      {evalResult.threeFactorsBreakdown.nominatorCompetencyAnalysis.score100 ?? Math.round(evalResult.threeFactorsBreakdown.nominatorCompetencyAnalysis.score * 10)}/100
                    </span>
                  )}
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {evalResult?.threeFactorsBreakdown?.nominatorCompetencyAnalysis.summary ||
                    `Nominator Band: ${checkpoint.band} (${checkpoint.title}). Multiplier ${checkpoint.weightMultiplier.toFixed(2)}x (+${checkpoint.boostPercentage}% progressive boost).`}
                </p>
                <div className="pt-1 text-[10px] text-purple-900 font-mono font-medium">
                  Band {checkpoint.band} &bull; Floor: {checkpoint.authorityFloor}+ &bull; {checkpoint.weightMultiplier.toFixed(2)}x
                </div>
              </div>
            </div>
          </div>

          {/* Organizational Competency Framework & Managerial Checkpoint Card (C1-C9) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl ${
                  checkpoint.isLeadership
                    ? 'bg-purple-100 text-purple-700'
                    : checkpoint.isManager
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Organizational Competency & Leadership Checkpoint</span>
                    <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      C1 – C10
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sponsorship weightage boost based on nominator management seniority
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${checkpoint.badgeClass}`}>
                  <span>{checkpoint.badgeLabel}</span>
                  {checkpoint.boostPercentage > 0 && (
                    <span className="bg-white/80 px-1.5 py-0.2 rounded-full font-extrabold text-[10px]">
                      +{checkpoint.boostPercentage}%
                    </span>
                  )}
                </span>
                {onOpenScoringDetails && (
                  <button
                    onClick={onOpenScoringDetails}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline cursor-pointer"
                  >
                    View Matrix
                  </button>
                )}
              </div>
            </div>

            {/* Level Comparison & Interactive Band Switcher */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 text-xs">
              
              {/* Nominee Band */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Nominee Career Band
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-base font-extrabold text-slate-800 font-mono">
                    {nomination.nomineeBand || 'C2'}
                  </span>
                  <span className="text-slate-600 text-xs font-medium truncate">
                    {COMPETENCY_LADDER[nomination.nomineeBand as CompetencyBand]?.title || 'Software Engineer / Contributor'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Assigned candidate operational level
                </span>
              </div>

              {/* Nominator Competency Level (Editable Dropdown) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Nominator Level
                  </span>
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                    C1 – C10
                  </span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <select
                    value={checkpoint.band}
                    onChange={(e) => handleCompetencyLevelChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {(Object.keys(COMPETENCY_LADDER) as CompetencyBand[]).map((b) => {
                      const item = COMPETENCY_LADDER[b];
                      return (
                        <option key={b} value={b}>
                          {b} - {item.title} (+{item.boostPercent}% Boost | Floor: {item.authorityFloor})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Select to adjust nominator leadership seniority
                </span>
              </div>

              {/* Weightage Boost Outcome */}
              <div className={`p-3 rounded-lg border shadow-2xs ${
                checkpoint.checkpointPassed
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Applied Checkpoint Boost
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className={`text-base font-extrabold font-mono ${
                    checkpoint.checkpointPassed ? 'text-amber-800' : 'text-slate-700'
                  }`}>
                    {checkpoint.weightMultiplier.toFixed(2)}x
                  </span>
                  <span className={`text-xs font-bold ${
                    checkpoint.checkpointPassed ? 'text-amber-700' : 'text-slate-500'
                  }`}>
                    (+{checkpoint.boostPercentage}% Multiplier)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Authority Score Floor: <strong className="text-slate-800">{checkpoint.authorityFloor}/100</strong>
                </span>
              </div>

            </div>

            {/* Strategic Rationale: Why Managerial Weightage is Higher */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Why is score &amp; weightage higher as nominator competency increases?</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] text-amber-800">
                    1. Supervisory Accountability
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Line managers (C5) and executives (C6–C10) bear direct formal accountability for project delivery milestones, financial budgets, and appraisals.
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] text-purple-800">
                    2. Certified Business ROI
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Leaders verify macro business outcomes ($ saved, contract renewals, SLA protection) rather than localized routine assistance.
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] text-emerald-800">
                    3. Authority Floor for Concise Comments
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Even when citations are concise or not elaborately worded (&quot;not so special&quot;), high-ranking sponsors guarantee high score floors ({checkpoint.authorityFloor}+), recognizing executive oversight.
                  </p>
                </div>
              </div>

              {/* Active Evaluation Checkpoint Determination */}
              {evalResult?.managerCheckpoint && (
                <div className="mt-2 pt-2.5 border-t border-slate-200 flex items-start space-x-2 text-[11px] text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Evaluation Finding: </span>
                    <span>{evalResult.managerCheckpoint.rationale}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Citation vs Evaluation Criteria Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Citation Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center space-x-1">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Nomination Citation</span>
              </h3>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {nomination.nominationCitation}
              </p>
              {nomination.contributionInfo && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Contribution Info: </span>
                  {nomination.contributionInfo}
                </div>
              )}
            </div>

            {/* Evaluation Criteria Card */}
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center space-x-1">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Evaluation Criteria Applied</span>
              </h3>
              <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap font-sans">
                {nomination.evaluationCriteria}
              </p>
            </div>
          </div>

          {/* AI Rationale & Strengths */}
          {evalResult && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center space-x-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Evaluation Rationale & Criteria Match</span>
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  {evalResult.detailedRationale}
                </p>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Criteria Match Summary: </span>
                  {evalResult.criteriaMatchSummary}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                  <h4 className="text-xs font-bold text-emerald-900 mb-2 flex items-center space-x-1">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <span>Key Citation Strengths</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-emerald-900 list-disc list-inside">
                    {evalResult.keyStrengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Areas of Improvement / Missing Details</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
                    {evalResult.areasOfImprovement.map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Approval Pipeline Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Governance & Approval Pipeline</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block">Primary Approval</span>
                <span className={`font-semibold ${nomination.primaryApproval === 'Approved' ? 'text-emerald-700' : 'text-amber-600'}`}>
                  {nomination.primaryApproval} ({nomination.primaryApproverStatus})
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block">R&R Approver</span>
                <span className="font-semibold text-slate-800">
                  {nomination.rrApprover} ({nomination.rrStatus})
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block">Shared Services</span>
                <span className="font-semibold text-slate-800">
                  {nomination.sharedServicesApprover} ({nomination.sharedServicesStatus})
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block">Attachment Uploaded</span>
                <span className={`font-semibold flex items-center gap-1 ${hasAttachment ? 'text-emerald-700' : 'text-rose-600'}`}>
                  <Paperclip className="w-3.5 h-3.5" />
                  {hasAttachment ? 'Yes (Verified)' : 'No Attachment'}
                </span>
              </div>
            </div>
          </div>

          {/* Verified Proof Documents & Artifact Evidence */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Verified Proof Documents &amp; Artifact Evidence
                </h3>
              </div>

              {onOpenUploadProof && (
                <button
                  onClick={() => onOpenUploadProof(nomination.nominationId || nomination.id)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Proof</span>
                </button>
              )}
            </div>

            {nomination.proofDocuments && nomination.proofDocuments.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {nomination.proofDocuments.map((doc) => {
                  const isEmail = doc.fileType === 'email';
                  const isPdf = doc.fileType === 'pdf';
                  const isImg = doc.fileType === 'image';
                  const docSum = getSingleDocumentSummary(doc);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => onPreviewProofDoc?.(doc, nomination)}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition group"
                    >
                      <div className="flex items-start space-x-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isEmail ? 'bg-amber-100 text-amber-800' : isPdf ? 'bg-rose-100 text-rose-800' : isImg ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isEmail && <Mail className="w-4 h-4" />}
                          {isPdf && <FileText className="w-4 h-4" />}
                          {isImg && <ImageIcon className="w-4 h-4" />}
                          {!isEmail && !isPdf && !isImg && <Paperclip className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0 space-y-1 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-bold text-slate-900 text-xs block truncate group-hover:text-amber-700 transition" title={doc.fileName}>
                              {docSum.title || doc.fileName}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${docSum.badgeClass}`}>
                              {docSum.badgeLabel}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {doc.formattedSize}
                            </span>
                          </div>

                          {/* Read summary / excerpt from actual document */}
                          <p className="text-[11px] text-slate-600 line-clamp-2 italic leading-relaxed">
                            &ldquo;{docSum.keyFindings}&rdquo;
                          </p>

                          {docSum.metrics && docSum.metrics.length > 0 && (
                            <div className="flex items-center space-x-1.5 pt-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Extracted Metrics:</span>
                              {docSum.metrics.map((m, idx) => (
                                <span key={idx} className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-center shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewProofDoc?.(doc, nomination);
                          }}
                          className="px-3 py-1.5 bg-white group-hover:bg-amber-500 text-slate-700 group-hover:text-slate-950 font-bold text-xs rounded-lg border border-slate-200 group-hover:border-amber-500 transition shadow-2xs flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Proof</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-2">
                <Paperclip className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">
                  {hasAttachment 
                    ? 'Attachment is marked "Yes" in the spreadsheet, but no proof file (.pdf, .eml, .jpg) has been uploaded yet.' 
                    : 'No proof documents attached for this nomination yet.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Upload client appreciation emails (.eml, .msg), signed approval PDFs, or screenshots to view them here.
                </p>
                {onOpenUploadProof && (
                  <button
                    onClick={() => onOpenUploadProof(nomination.nominationId || nomination.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-2xs mt-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Upload Proof File for {nomination.nomineeName}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Internal Decision & AI Alignment Consensus Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Internal Decision vs AI Alignment Analysis
                </h3>
              </div>

              {/* Alignment Badge */}
              <div 
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${alignment.badgeBg} ${alignment.badgeText} ${alignment.badgeBorder}`}
              >
                {alignment.iconType === 'check' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {alignment.iconType === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-orange-600" />}
                {alignment.iconType === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                {alignment.iconType === 'clock' && <Clock className="w-3.5 h-3.5 text-slate-400" />}
                <span>{alignment.label}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Internal Decision Display - Shown as is */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Internal Human / Committee Decision:
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-2xs ${
                    (nomination.internalDecision || '').toLowerCase().includes('winner') || (nomination.internalDecision || '').toLowerCase().includes('selected')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : (nomination.internalDecision || '').toLowerCase().includes('shortlist') || (nomination.internalDecision || '').toLowerCase().includes('finalist')
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : (nomination.internalDecision || '').toLowerCase().includes('reject') || (nomination.internalDecision || '').toLowerCase().includes('not selected')
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : (nomination.internalDecision || '').toLowerCase().includes('honorable')
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-800 border-slate-300'
                  }`}>
                    <span>{nomination.internalDecision || 'Pending Review'}</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  Recorded in spreadsheet column <em>Internal Decision</em>.
                </span>
              </div>

              {/* AI Evaluation Summary */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  AI Evaluation Recommendation:
                </span>
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tier:</span>
                    <span className="font-bold text-slate-800">
                      {evalResult ? evalResult.recommendationTier : 'Not Evaluated'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Structured Score:</span>
                    <span className="font-bold text-amber-700">
                      {evalResult ? `${evalResult.humanOverrideScore ?? evalResult.overallScore} / 100` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alignment Analysis Detail Note */}
            <div className={`p-3 rounded-lg border text-xs ${
              alignment.category === 'Aligned'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : alignment.category === 'AI Higher'
                ? 'bg-orange-50 border-orange-200 text-orange-900'
                : alignment.category === 'Human Higher'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-current" />
                <div>
                  <span className="font-bold block">Consensus Finding:</span>
                  <p className="mt-0.5 leading-relaxed">{alignment.explanation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Committee Override & Remarks */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                <Edit3 className="w-4 h-4" />
                <span>R&R Selection Committee Score & Notes Override</span>
              </h3>

              {!isEditingScore ? (
                <button
                  onClick={() => setIsEditingScore(true)}
                  className="text-xs text-amber-300 hover:underline font-medium"
                >
                  Edit Committee Score
                </button>
              ) : (
                <button
                  onClick={handleSaveScore}
                  className="inline-flex items-center space-x-1 text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded hover:bg-amber-400 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Committee Final Score</span>
                </button>
              )}
            </div>

            {isEditingScore ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Adjust Committee Final Score (0 - 100):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Committee Selection Remarks & Rationales:
                  </label>
                  <textarea
                    rows={3}
                    value={humanNotes}
                    onChange={(e) => setHumanNotes(e.target.value)}
                    placeholder="Add jury remarks or notes regarding final selection decision..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs space-y-1 text-slate-300">
                <p>
                  <span className="text-slate-400 font-semibold">Committee Score: </span>
                  <span className="font-bold text-amber-400 text-sm">
                    {nomination.evaluation?.humanOverrideScore ?? nomination.evaluation?.overallScore ?? 'Unrated'}
                  </span>
                </p>
                {nomination.evaluation?.humanNotes && (
                  <p className="bg-slate-800 p-2 rounded border border-slate-700 text-slate-300 italic mt-2">
                    &quot;{nomination.evaluation.humanNotes}&quot;
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
