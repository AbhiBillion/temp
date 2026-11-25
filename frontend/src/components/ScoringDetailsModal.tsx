import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Sparkles, 
  Calculator, 
  BarChart3, 
  CheckCircle2, 
  Info, 
  HelpCircle, 
  TrendingUp, 
  FileText, 
  ShieldCheck,
  Zap,
  Sliders
} from 'lucide-react';
import { COMPETENCY_LADDER, CompetencyBand } from '../types';

interface ScoringDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoringDetailsModal: React.FC<ScoringDetailsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  // Live calculator state based on 3 Core Inputs
  const [calcComments, setCalcComments] = useState<number>(85); // 0-100
  const [calcProofDocs, setCalcProofDocs] = useState<number>(88); // 0-100
  const [calcNominatorLevel, setCalcNominatorLevel] = useState<CompetencyBand>('C6');
  const [isConciseComment, setIsConciseComment] = useState<boolean>(false);

  // Checkpoint meta
  const meta = COMPETENCY_LADDER[calcNominatorLevel] || COMPETENCY_LADDER['C6'];
  const checkpointBoostPoints = meta.scorePointsBoost;
  const checkpointBoostPct = meta.boostPercentage;

  // Band base standing scores
  const bandBaseScores: Record<CompetencyBand, number> = {
    'C1': 52, 'C2': 56, 'C3': 62, 'C4': 70, 'C5': 80,
    'C6': 86, 'C7': 90, 'C8': 94, 'C9': 97, 'C10': 99
  };
  const nominatorBandScore = bandBaseScores[calcNominatorLevel] || 70;

  // 3-Factor Weighted Base: 35% Comments + 35% Proof Docs + 30% Nominator Band
  const baseCalculatedScore = Math.round(
    calcComments * 0.35 +
    calcProofDocs * 0.35 +
    nominatorBandScore * 0.30
  );

  let rawWeightedScore = Math.min(baseCalculatedScore + checkpointBoostPoints, 100);
  let authorityFloorApplied = false;

  // If nominator is Manager or Senior Leader (C5-C10), enforce executive authority floor
  if (meta.isManagerLevel && rawWeightedScore < meta.authorityFloor) {
    rawWeightedScore = meta.authorityFloor;
    authorityFloorApplied = true;
  }

  const calculatedWeightedScore = rawWeightedScore;

  let calcTier = 'Satisfactory - Honorable Mention';
  let calcTierBg = 'bg-amber-100 text-amber-800 border-amber-300';
  if (calculatedWeightedScore >= 90) {
    calcTier = 'Top Contender - Winner';
    calcTierBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  } else if (calculatedWeightedScore >= 80) {
    calcTier = 'Strong Nominee - Recommended';
    calcTierBg = 'bg-blue-100 text-blue-900 border-blue-300';
  } else if (calculatedWeightedScore < 70) {
    calcTier = 'Needs Improvement';
    calcTierBg = 'bg-rose-100 text-rose-900 border-rose-300';
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>R&R 3-Factor Actual Scoring Engine & Evaluation Rubric</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-amber-500/30">
                  C1–C10 Ladder
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transparent mathematical scoring based on 1) Spreadsheet Comments, 2) Proof Docs, and 3) Nominator Band
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs flex-1">
          
          {/* Section 1: Weighted Evaluation Formula */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-amber-400 flex items-center space-x-1.5 text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Actual Score Synthesis Formula (3 Foundational Inputs)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Range: 0 - 100 Points</span>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              To eliminate false discrepancies and generate the true score, the evaluation engine synthesizes the nomination strictly from three inputs:
            </p>

            <div className="bg-slate-950 p-4 rounded-lg font-mono text-amber-300 border border-slate-800 text-xs sm:text-sm text-center tracking-tight shadow-inner overflow-x-auto">
              Actual Score = (Comments × 35%) + (Proof Docs × 35%) + (Nominator Band × 30%) + Supervisory Boost
            </div>
            <p className="text-[11px] text-slate-400 text-center italic">
              Executive Authority Floor enforced: If nominator is C5–C10, score never falls below leadership threshold (74 to 95+).
            </p>
          </div>

          {/* Section 2: 4 Core Scoring Dimensions Grid */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>4 Core Scoring Dimensions & Criteria Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Dim 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>1. Business Impact & Value</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    35% Weight (3.5x)
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Measures tangible outcomes such as revenue generated/saved, cost reduction %, process speedups, CSAT/NPS gains, system uptime, or operational scale achieved.
                </p>
                <div className="text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">High Score Indicators: </span>
                  Specific dollar figures ($), percentages (%), hours saved, zero downtime records, or client praise letters.
                </div>
              </div>

              {/* Dim 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>2. Criteria & Category Alignment</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    25% Weight (2.5x)
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Evaluates how closely the citation facts fulfill the explicitly declared Category Evaluation Criteria (e.g. Spot Award guidelines vs. Innovation Award guidelines).
                </p>
                <div className="text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">High Score Indicators: </span>
                  Direct fulfillment of category deliverables, explicit alignment with category purpose and competency expectations.
                </div>
              </div>

              {/* Dim 3 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>3. Citation Evidence & Verification</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    20% Weight (2.0x)
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Assesses clarity, citation length, specific verifiable metrics, presence of supporting attachments, and cross-functional manager approvals.
                </p>
                <div className="text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">High Score Indicators: </span>
                  Detailed write-up (&gt;150 chars), supporting attachment uploaded (Yes), and explicit stakeholder signoffs.
                </div>
              </div>

              {/* Dim 4 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>4. Competency Mastery & Effort</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    20% Weight (2.0x)
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Evaluates technical excellence, leadership, mentorship, domain expertise, and organizational influence demonstrated in the nominee&apos;s competency area.
                </p>
                <div className="text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">High Score Indicators: </span>
                  Demonstration of advanced competency skills, going beyond regular job role expectations.
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Recommendation Tier Threshold Matrix */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Recommendation Tier Threshold Matrix</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-3">Score Range</th>
                    <th className="p-3">Recommendation Tier</th>
                    <th className="p-3">R&R Committee Action / Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-emerald-700">90 - 100</td>
                    <td className="p-3 font-bold text-emerald-900">
                      <span className="bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        Top Contender - Winner
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Primary candidate for Category Award Winner. Recommended for honorarium trophy, public recognition, and leadership showcase.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-700">80 - 89</td>
                    <td className="p-3 font-bold text-blue-900">
                      <span className="bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">
                        Strong Nominee - Recommended
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      High quality submission. Recommended for Runner-Up or Special Commendation certificate.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-amber-700">70 - 79</td>
                    <td className="p-3 font-bold text-amber-900">
                      <span className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        Satisfactory - Honorable Mention
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Meets standard job expectations and category requirements. Eligible for general mention.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-rose-700">50 - 69</td>
                    <td className="p-3 font-bold text-rose-900">
                      <span className="bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">
                        Needs Improvement
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Lacks quantifiable metric evidence or detailed citation facts. Committee may request additional details.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-500">&lt; 50</td>
                    <td className="p-3 font-bold text-slate-700">
                      <span className="bg-slate-200 border border-slate-300 px-2 py-0.5 rounded">
                        Insufficient Citation Data
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Citation is too brief or vague. Deferred or sent back to nominator for rewrite.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Organizational Competency Framework (C1 - C10) & Manager Checkpoint */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-amber-400 flex items-center space-x-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Organizational Competency Framework (C1 – C10) &amp; Progressive Weightage</span>
              </h3>
              <span className="text-[11px] text-amber-300 font-semibold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                C1 – C10 Ladder Active
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Our organization evaluates competencies along a progressive career ladder from <strong className="text-white">C1 to C10</strong>.
              <strong className="text-amber-300"> Weightage and score strictly increase as nominator competency increases</strong>.
              Furthermore, when high-ranking leaders (C5 to C10) nominate someone, an <strong className="text-emerald-300">Executive Sponsorship Floor</strong> ensures the candidate receives an elevated score even if the citation write-up is concise or &quot;not so special&quot;.
            </p>

            {/* Competency Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Band</th>
                    <th className="p-2.5">Corporate Designation</th>
                    <th className="p-2.5">Leadership Tier</th>
                    <th className="p-2.5 text-right">Multiplier &amp; Boost</th>
                    <th className="p-2.5 text-right">Concise Citation Floor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {(Object.keys(COMPETENCY_LADDER) as CompetencyBand[]).map((band) => {
                    const item = COMPETENCY_LADDER[band];
                    const isHigh = item.isManagerLevel;
                    const isTop = ['C9', 'C10'].includes(band);
                    const isMid = ['C5', 'C6', 'C7', 'C8'].includes(band);

                    return (
                      <tr
                        key={band}
                        className={`hover:bg-slate-800/40 transition ${
                          isTop
                            ? 'bg-emerald-950/20 border-l-2 border-l-emerald-400'
                            : isMid
                            ? 'bg-purple-950/20 border-l-2 border-l-purple-400'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="p-2.5 font-bold font-mono text-amber-400">{band}</td>
                        <td className="p-2.5 font-semibold text-white">{item.roleTitle}</td>
                        <td className="p-2.5 text-slate-300 text-[11px]">
                          {isTop
                            ? '💎 Executive Committee / Board'
                            : isMid
                            ? '👑 Management / Leadership'
                            : '👥 Peer / Contributor'}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-right text-amber-300">
                          {item.weightageMultiplier.toFixed(2)}x (+{item.boostPercentage}%)
                        </td>
                        <td className="p-2.5 font-mono text-right font-bold text-emerald-400">
                          Floor: {item.authorityFloor} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Why is weightage higher box */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Why is Weightage and Score Higher as Competency Increases?</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300 pt-1">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-white block mb-1">1. Supervisory Accountability</span>
                  <p className="text-slate-400 leading-relaxed">
                    Managers and executives bear formal fiscal and delivery responsibility for customer SLA outcomes and annual appraisal ratings.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-white block mb-1">2. Certified Business ROI</span>
                  <p className="text-slate-400 leading-relaxed">
                    Senior leaders evaluate and verify macro business metrics: cost savings ($), contract expansions, and cross-team adoption.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-white block mb-1">3. Executive Authority Floor</span>
                  <p className="text-slate-400 leading-relaxed">
                    If citation comments are concise or &quot;not so special&quot;, high nominator standing (C5–C10) guarantees an elevated score baseline (up to 93), recognizing executive pre-screening.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Interactive Score Simulation Calculator */}
          <div className="bg-amber-50/60 rounded-xl p-5 border border-amber-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <h3 className="font-bold text-amber-950 flex items-center space-x-1.5 text-sm">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Interactive Committee Score Simulator (C1 – C10)</span>
              </h3>
              <span className="text-[11px] text-amber-800 font-medium">
                Test progressive weightage multipliers and concise citation floor
              </span>
            </div>

            {/* Nominator Competency Checkpoint Selector */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Nominator Competency Level (C1 – C10):</span>
                <span className="text-slate-500 text-[11px]">
                  Select the nominator&apos;s organizational band to test score progression
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={calcNominatorLevel}
                  onChange={(e) => setCalcNominatorLevel(e.target.value as CompetencyBand)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-slate-50 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                >
                  {(Object.keys(COMPETENCY_LADDER) as CompetencyBand[]).map((b) => {
                    const item = COMPETENCY_LADDER[b];
                    return (
                      <option key={b} value={b}>
                        {b} - {item.title} ({item.weightageMultiplier.toFixed(2)}x / +{item.boostPercentage}%)
                      </option>
                    );
                  })}
                </select>

                <label className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-300 cursor-pointer text-[11px] font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isConciseComment}
                    onChange={(e) => setIsConciseComment(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Comment is concise (&quot;not special&quot;)</span>
                </label>

                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                  meta.isSeniorLeadership ? 'bg-purple-100 text-purple-900 border-purple-300' : meta.isManagerLevel ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  +{meta.boostPercentage}% Boost (+{meta.scorePointsBoost} pts)
                </span>
              </div>
            </div>

            {authorityFloorApplied && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 text-xs text-emerald-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Executive Authority Floor Triggered ({meta.authorityFloor} pts):</strong> Because the nominator is high level ({calcNominatorLevel} - {meta.title}), the score is elevated to the minimum floor even though the comment was marked concise.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-blue-900 font-bold">1. Comments Score (35%):</span>
                  <span className="text-blue-700 font-bold">{calcComments} / 100</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="1"
                  value={calcComments}
                  onChange={(e) => setCalcComments(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Evaluates citation depth &amp; quantifiable metrics ($ saved, % speedup)
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-emerald-900 font-bold">2. Proof Docs Score (35%):</span>
                  <span className="text-emerald-700 font-bold">{calcProofDocs} / 100</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="1"
                  value={calcProofDocs}
                  onChange={(e) => setCalcProofDocs(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Client appreciation emails (95-100), signed PDFs (90-95), or registry proof
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-purple-900 font-bold">3. Nominator Band (30%):</span>
                  <span className="text-purple-700 font-bold">{nominatorBandScore} / 100</span>
                </div>
                <div className="py-2 text-xs font-semibold text-purple-900">
                  {calcNominatorLevel} - {meta.title}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  +{meta.boostPercentage}% boost &bull; Floor: {meta.authorityFloor}+ pts
                </span>
              </div>
            </div>

            {/* Simulated Result Box */}
            <div className="bg-white p-4 rounded-xl border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Simulated Weighted Score</span>
                <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                  <span>{calculatedWeightedScore}</span>
                  <span className="text-xs font-normal text-slate-500">
                    / 100 Points (Base: {baseCalculatedScore} {checkpointBoostPoints > 0 ? `+ ${checkpointBoostPoints} Checkpoint Boost` : ''})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-slate-500 text-[11px] block font-medium mb-1">Simulated Tier</span>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${calcTierBg}`}>
                  {calcTier}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 sticky bottom-0">
          <span>R&R Nomination Evaluation Platform &bull; Selection Committee Handbook</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-sm"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
