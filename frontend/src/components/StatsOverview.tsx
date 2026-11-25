import React from 'react';
import { NominationRecord, getAlignmentAnalysis } from '../types';
import { Award, CheckCircle, TrendingUp, AlertTriangle, Layers, Star, Scale } from 'lucide-react';

interface StatsOverviewProps {
  nominations: NominationRecord[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ nominations }) => {
  const total = nominations.length;
  const evaluatedList = nominations.filter((n) => n.evaluation);
  const evaluatedCount = evaluatedList.length;

  const totalScoreSum = evaluatedList.reduce(
    (sum, n) => sum + (n.evaluation?.humanOverrideScore ?? n.evaluation?.overallScore ?? 0),
    0
  );
  const avgScore = evaluatedCount > 0 ? (totalScoreSum / evaluatedCount).toFixed(1) : '—';

  const topContendersCount = evaluatedList.filter(
    (n) => (n.evaluation?.humanOverrideScore ?? n.evaluation?.overallScore ?? 0) >= 90
  ).length;

  const missingAttachmentsCount = nominations.filter(
    (n) => String(n.isAttachmentUploaded).toLowerCase() === 'no' || n.isAttachmentUploaded === false
  ).length;

  // Alignment Consensus Metrics
  const decidedList = evaluatedList.filter((n) => {
    const dec = (n.internalDecision || '').trim().toLowerCase();
    return dec && !['pending', 'pending review', 'under review', 'in review', 'tbd'].includes(dec);
  });
  const alignedList = decidedList.filter((n) => getAlignmentAnalysis(n).category === 'Aligned');
  const discrepanciesList = decidedList.filter((n) => ['AI Higher', 'Human Higher'].includes(getAlignmentAnalysis(n).category));
  const alignmentRate = decidedList.length > 0 ? Math.round((alignedList.length / decidedList.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {/* Card 1: Total Nominations */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Nominations
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-bold text-slate-900">{total}</span>
            <span className="text-[11px] text-slate-400">rows</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4" />
        </div>
      </div>

      {/* Card 2: Evaluated Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            AI Evaluated
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-bold text-slate-900">{evaluatedCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              ({total > 0 ? Math.round((evaluatedCount / total) * 100) : 0}%)
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4" />
        </div>
      </div>

      {/* Card 3: Average Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Avg AI Score
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-bold text-slate-900">{avgScore}</span>
            <span className="text-[11px] text-slate-400">/ 100</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>

      {/* Card 4: Top Winners / Contenders */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Top Contenders
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-bold text-amber-600">{topContendersCount}</span>
            <span className="text-[11px] text-slate-400">&ge; 90 pts</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
      </div>

      {/* Card 5: Matched vs Not Matched (x%) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Matched vs Not Matched
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-bold text-emerald-700">
              {decidedList.length > 0 ? `${Math.round((alignedList.length / decidedList.length) * 100)}%` : '—'}
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">
              {decidedList.length > 0 ? 'Matched' : 'Pending AI'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            <span className="text-emerald-700 font-bold">{alignedList.length} Matched</span>
            <span className="mx-1">&bull;</span>
            <span className="text-rose-600 font-bold">{discrepanciesList.length} Not Matched</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4" />
        </div>
      </div>

      {/* Card 6: Discrepancy & Verification Flags */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Divergence / Not Matched
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-xl font-bold ${discrepanciesList.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {decidedList.length > 0 ? `${Math.round((discrepanciesList.length / decidedList.length) * 100)}%` : '0%'}
            </span>
            <span className="text-[11px] text-rose-500 font-medium">({discrepanciesList.length} to audit)</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            AI vs Human Discrepancies
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
