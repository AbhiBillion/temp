import React from 'react';
import { NominationRecord, getAlignmentAnalysis, getCompetencyCheckpoint } from '../types';
import { 
  BarChart2, 
  PieChart, 
  TrendingUp, 
  Building2, 
  Award, 
  CheckCircle, 
  ShieldAlert, 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Clock,
  Briefcase,
  ShieldCheck
} from 'lucide-react';

interface AnalyticsViewProps {
  nominations: NominationRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ nominations }) => {
  // 1. Category Distribution & Average Score
  const categoryStats: Record<string, { count: number; totalScore: number; evaluated: number }> = {};
  
  // 2. BU Stats
  const buStats: Record<string, { count: number; totalScore: number; evaluated: number }> = {};

  // 3. Managerial Checkpoint Stats
  const checkpointStats = {
    c10: { count: 0, totalScore: 0, evaluated: 0, winners: 0 },        // C10 CXO/EVP (+75%, Floor: 93)
    leadership: { count: 0, totalScore: 0, evaluated: 0, winners: 0 }, // C6-C9 (+35-65%)
    manager: { count: 0, totalScore: 0, evaluated: 0, winners: 0 },    // C5 (+25%)
    peer: { count: 0, totalScore: 0, evaluated: 0, winners: 0 }        // C1-C4 (1.0x-1.15x)
  };

  // 4. Recommendation Tier distribution
  const tierCounts: Record<string, number> = {
    'Top Contender - Winner': 0,
    'Strong Nominee - Recommended': 0,
    'Satisfactory - Honorable Mention': 0,
    'Needs Improvement': 0,
    'Insufficient Citation Data': 0
  };

  // 5. Alignment stats
  const alignmentStats = {
    alignedSelected: 0,
    alignedRejected: 0,
    alignedHonorable: 0,
    aiHigher: [] as NominationRecord[],
    humanHigher: [] as NominationRecord[],
    pending: 0
  };

  nominations.forEach((n) => {
    // Category
    const cat = n.nominationCategory || 'Other';
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, totalScore: 0, evaluated: 0 };
    categoryStats[cat].count += 1;

    // BU
    const bu = n.buOfNominee || 'Unassigned';
    if (!buStats[bu]) buStats[bu] = { count: 0, totalScore: 0, evaluated: 0 };
    buStats[bu].count += 1;

    // Competency & Managerial Sponsorship Checkpoint
    const cp = getCompetencyCheckpoint(n);
    const targetGroup = cp.band === 'C10'
      ? checkpointStats.c10
      : cp.isLeadership
      ? checkpointStats.leadership
      : cp.isManager
      ? checkpointStats.manager
      : checkpointStats.peer;
    targetGroup.count += 1;

    if (n.evaluation) {
      const score = n.evaluation.humanOverrideScore ?? n.evaluation.overallScore;
      categoryStats[cat].totalScore += score;
      categoryStats[cat].evaluated += 1;

      buStats[bu].totalScore += score;
      buStats[bu].evaluated += 1;

      targetGroup.totalScore += score;
      targetGroup.evaluated += 1;
      if (score >= 90 || (n.internalDecision || '').toLowerCase().includes('winner')) {
        targetGroup.winners += 1;
      }

      const tier = n.evaluation.recommendationTier;
      if (tierCounts[tier] !== undefined) {
        tierCounts[tier] += 1;
      }
    }

    // Alignment
    const analysis = getAlignmentAnalysis(n);
    if (analysis.category === 'Aligned') {
      if (analysis.label.includes('Selected')) alignmentStats.alignedSelected++;
      else if (analysis.label.includes('Rejected')) alignmentStats.alignedRejected++;
      else alignmentStats.alignedHonorable++;
    } else if (analysis.category === 'AI Higher') {
      alignmentStats.aiHigher.push(n);
    } else if (analysis.category === 'Human Higher') {
      alignmentStats.humanHigher.push(n);
    } else {
      alignmentStats.pending++;
    }
  });

  const totalDecided = nominations.length - alignmentStats.pending;
  const totalAligned = alignmentStats.alignedSelected + alignmentStats.alignedRejected + alignmentStats.alignedHonorable;
  const alignmentPercentage = totalDecided > 0 ? Math.round((totalAligned / totalDecided) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">R&R Nomination Analytics & Consensus Dashboard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Category rating distributions, BU performance benchmarks, and AI vs Human decision alignment
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-3 text-xs">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 block">Evaluated Ratio</span>
            <span className="font-bold text-amber-400 text-sm">
              {nominations.length > 0
                ? Math.round((nominations.filter((n) => n.evaluation).length / nominations.length) * 100)
                : 0}%
            </span>
          </div>

          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 block">Consensus Agreement</span>
            <span className="font-bold text-emerald-400 text-sm">
              {alignmentPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* AI vs Human Consensus Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">
              AI Evaluation vs Human Internal Decision Alignment
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-800 rounded-lg border border-purple-200">
            {alignmentPercentage}% Agreement Rate ({totalAligned} of {totalDecided} Decided)
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Overall Consensus</span>
            <span className="font-bold text-purple-700">{alignmentPercentage}% Aligned</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-3"
              style={{ width: `${totalDecided > 0 ? (totalAligned / totalDecided) * 100 : 0}%` }}
              title={`Aligned Consensus: ${totalAligned}`}
            />
            <div
              className="bg-orange-400 h-3"
              style={{ width: `${totalDecided > 0 ? (alignmentStats.aiHigher.length / totalDecided) * 100 : 0}%` }}
              title={`AI Higher: ${alignmentStats.aiHigher.length}`}
            />
            <div
              className="bg-rose-500 h-3"
              style={{ width: `${totalDecided > 0 ? (alignmentStats.humanHigher.length / totalDecided) * 100 : 0}%` }}
              title={`Human Higher: ${alignmentStats.humanHigher.length}`}
            />
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
              <span>Aligned Consensus ({totalAligned})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-orange-400 rounded-full inline-block" />
              <span>AI Higher / Human Rejected ({alignmentStats.aiHigher.length})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block" />
              <span>Human Winner / AI Low ({alignmentStats.humanHigher.length})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-slate-300 rounded-full inline-block" />
              <span>Decision Pending ({alignmentStats.pending})</span>
            </span>
          </div>
        </div>

        {/* Discrepancies Grid */}
        {(alignmentStats.aiHigher.length > 0 || alignmentStats.humanHigher.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100">
            {/* AI Higher Discrepancies */}
            <div className="p-4 bg-orange-50/70 rounded-xl border border-orange-200">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-900 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span>AI Recommended, but Human Committee Rejected ({alignmentStats.aiHigher.length})</span>
              </div>
              <p className="text-[11px] text-orange-800 mb-3">
                Candidates with high AI scores based on strong quantifiable citation metrics where the committee marked them rejected. Worth a second look:
              </p>
              <div className="space-y-2">
                {alignmentStats.aiHigher.map((nom) => (
                  <div key={nom.id} className="bg-white p-2.5 rounded-lg border border-orange-200 text-xs shadow-2xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{nom.nomineeName}</span>
                      <span className="text-orange-700">AI: {nom.evaluation?.overallScore}/100 vs &quot;{nom.internalDecision}&quot;</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{nom.nominationCitation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Human Higher Discrepancies */}
            <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-900 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Human Selected Winner, but AI Scored Low ({alignmentStats.humanHigher.length})</span>
              </div>
              <p className="text-[11px] text-rose-800 mb-3">
                Candidates chosen by the committee as Winners, but flagged by AI for missing metrics or lack of supporting attachments. Check for documentation gaps:
              </p>
              <div className="space-y-2">
                {alignmentStats.humanHigher.map((nom) => (
                  <div key={nom.id} className="bg-white p-2.5 rounded-lg border border-rose-200 text-xs shadow-2xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{nom.nomineeName}</span>
                      <span className="text-rose-700">&quot;{nom.internalDecision}&quot; vs AI: {nom.evaluation?.overallScore}/100</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{nom.nominationCitation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Nomination Category Distribution & Avg Scores</span>
          </h3>

          <div className="space-y-4">
            {Object.entries(categoryStats).map(([cat, stat]) => {
              const avg = stat.evaluated > 0 ? (stat.totalScore / stat.evaluated).toFixed(1) : 'N/A';
              const pct = Math.round((stat.count / nominations.length) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{cat} ({stat.count} nominations)</span>
                    <span className="text-amber-600 font-bold">Avg: {avg} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendation Tier Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-indigo-500" />
            <span>AI Recommendation Rating Tiers</span>
          </h3>

          <div className="space-y-3 text-xs">
            {Object.entries(tierCounts).map(([tier, count]) => {
              let color = 'bg-slate-400';
              if (tier.includes('Winner')) color = 'bg-emerald-500';
              else if (tier.includes('Recommended')) color = 'bg-blue-500';
              else if (tier.includes('Honorable')) color = 'bg-amber-500';
              else if (tier.includes('Improvement')) color = 'bg-rose-500';

              return (
                <div key={tier} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="font-semibold text-slate-800">{tier}</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{count} candidates</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Business Unit (BU) Analytics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>Business Unit (BU) Performance Matrix</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(buStats).map(([bu, stat]) => {
              const avg = stat.evaluated > 0 ? (stat.totalScore / stat.evaluated).toFixed(1) : '—';

              return (
                <div key={bu} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-900 block truncate">{bu}</span>
                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-slate-500">Nominations:</span>
                    <span className="font-bold text-slate-800">{stat.count}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs mt-1">
                    <span className="text-slate-500">Avg Score:</span>
                    <span className="font-black text-amber-600 text-sm">{avg}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Competency Ladder & Managerial Checkpoint Sponsorship Impact */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span>Organizational Competency Framework (C1–C10) &amp; Progressive Impact</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Progressive Boost: C1–C4 (1.00x Base) &bull; C5 (+5%) &bull; C6–C9 (+10%–25%) &bull; C10 (+30%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* C10 Executive Committee */}
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>EVP / CXO (C10)</span>
                </span>
                <span className="bg-emerald-200 text-emerald-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  +30% (1.30x)
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-snug">
                Supreme executive standing with Authority Floor (92+) ensuring elevated scores even for concise write-ups.
              </p>
              <div className="pt-2 border-t border-emerald-200/80 grid grid-cols-3 gap-1 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total</span>
                  <span className="font-extrabold text-slate-900">{checkpointStats.c10.count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Score</span>
                  <span className="font-extrabold text-emerald-700">
                    {checkpointStats.c10.evaluated > 0 ? (checkpointStats.c10.totalScore / checkpointStats.c10.evaluated).toFixed(1) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Winners</span>
                  <span className="font-extrabold text-emerald-700">{checkpointStats.c10.winners}</span>
                </div>
              </div>
            </div>

            {/* C6-C9 Senior Leadership */}
            <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Leadership (C6–C9)</span>
                </span>
                <span className="bg-purple-200 text-purple-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  +10% to +25%
                </span>
              </div>
              <p className="text-[11px] text-purple-800 leading-snug">
                Directors &amp; VPs with organizational P&amp;L oversight and elevated score floor (76–88+).
              </p>
              <div className="pt-2 border-t border-purple-200/80 grid grid-cols-3 gap-1 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total</span>
                  <span className="font-extrabold text-slate-900">{checkpointStats.leadership.count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Score</span>
                  <span className="font-extrabold text-purple-700">
                    {checkpointStats.leadership.evaluated > 0 ? (checkpointStats.leadership.totalScore / checkpointStats.leadership.evaluated).toFixed(1) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Winners</span>
                  <span className="font-extrabold text-emerald-700">{checkpointStats.leadership.winners}</span>
                </div>
              </div>
            </div>

            {/* C5 Line Managers */}
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>Managers (C5)</span>
                </span>
                <span className="bg-amber-200 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  +5% (1.05x)
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Direct supervisors where weightage starts, accountable for delivery &amp; SLA compliance (Floor: 72).
              </p>
              <div className="pt-2 border-t border-amber-200/80 grid grid-cols-3 gap-1 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total</span>
                  <span className="font-extrabold text-slate-900">{checkpointStats.manager.count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Score</span>
                  <span className="font-extrabold text-amber-700">
                    {checkpointStats.manager.evaluated > 0 ? (checkpointStats.manager.totalScore / checkpointStats.manager.evaluated).toFixed(1) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Winners</span>
                  <span className="font-extrabold text-emerald-700">{checkpointStats.manager.winners}</span>
                </div>
              </div>
            </div>

            {/* C1-C4 Peer / Lead */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-500" />
                  <span>Peer / Lead (C1–C4)</span>
                </span>
                <span className="bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  1.00x Base (0%)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Peer kudos, team contributor, and technical lead recognitions evaluated on standard evidence rubric.
              </p>
              <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-1 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total</span>
                  <span className="font-extrabold text-slate-900">{checkpointStats.peer.count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Score</span>
                  <span className="font-extrabold text-slate-700">
                    {checkpointStats.peer.evaluated > 0 ? (checkpointStats.peer.totalScore / checkpointStats.peer.evaluated).toFixed(1) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Winners</span>
                  <span className="font-extrabold text-emerald-700">{checkpointStats.peer.winners}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
