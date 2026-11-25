import React from 'react';
import { NominationRecord, getCompetencyCheckpoint } from '../types';
import { X, Award, CheckCircle, ThumbsUp, FileText, Star, Trophy, Briefcase } from 'lucide-react';

interface CandidateComparisonModalProps {
  candidates: NominationRecord[];
  onClose: () => void;
  onSelectWinner: (candidate: NominationRecord) => void;
}

export const CandidateComparisonModal: React.FC<CandidateComparisonModalProps> = ({
  candidates,
  onClose,
  onSelectWinner
}) => {
  if (candidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">
                Selection Committee Candidate Comparison
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side evaluation criteria and score matrix for {candidates.length} shortlisted nominees
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Matrix */}
        <div className="p-6 overflow-x-auto overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-[700px]">
            {candidates.map((cand) => {
              const score = cand.evaluation?.humanOverrideScore ?? cand.evaluation?.overallScore ?? 0;
              const isWinner = score >= 90;
              const checkpoint = getCompetencyCheckpoint(cand);

              return (
                <div
                  key={cand.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                    isWinner ? 'border-amber-400 bg-amber-50/20 shadow-md' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    {/* Top Ribbon */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                        {cand.nominationCategory}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{cand.nominationId}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{cand.nomineeName}</h3>
                    <p className="text-xs text-slate-500 mb-1.5">
                      {cand.buOfNominee} &bull; {cand.practice}
                    </p>

                    {/* Competency & Managerial Checkpoint Badge */}
                    <div className="mb-3">
                      <span 
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] border shadow-2xs ${checkpoint.badgeClass}`}
                        title={checkpoint.strategicWhyExplanation}
                      >
                        <span>{checkpoint.badgeLabel}</span>
                        {checkpoint.boostPercentage > 0 && (
                          <span className="font-extrabold ml-1 bg-white/70 px-1 rounded">+{checkpoint.boostPercentage}%</span>
                        )}
                      </span>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="bg-slate-900 text-white p-3 rounded-lg text-center mb-4">
                      <div className="text-2xl font-black text-amber-400">
                        {score} <span className="text-xs font-normal text-slate-300">/ 100</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-200 mt-0.5">
                        {cand.evaluation?.recommendationTier || 'Not Rated'}
                      </div>
                    </div>

                    {/* Dimensions Breakdown */}
                    {cand.evaluation && (
                      <div className="space-y-2 mb-4 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                            <span>Business Impact</span>
                            <span className="font-semibold text-slate-900">{cand.evaluation.impactScore}/10</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full"
                              style={{ width: `${(cand.evaluation.impactScore / 10) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                            <span>Criteria Alignment</span>
                            <span className="font-semibold text-slate-900">{cand.evaluation.criteriaAlignmentScore}/10</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${(cand.evaluation.criteriaAlignmentScore / 10) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                            <span>Citation Evidence</span>
                            <span className="font-semibold text-slate-900">{cand.evaluation.citationEvidenceScore}/10</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${(cand.evaluation.citationEvidenceScore / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Citation Snippet */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs mb-4">
                      <span className="font-bold text-slate-800 block mb-1">Citation Excerpt:</span>
                      <p className="text-slate-700 line-clamp-3 italic">
                        &quot;{cand.nominationCitation}&quot;
                      </p>
                    </div>

                    {/* Key Strengths */}
                    {cand.evaluation?.keyStrengths && (
                      <div className="mb-4">
                        <span className="font-bold text-slate-800 text-xs block mb-1">Top Strengths:</span>
                        <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                          {cand.evaluation.keyStrengths.slice(0, 2).map((st, i) => (
                            <li key={i} className="line-clamp-2">{st}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Select Winner Button */}
                  <button
                    onClick={() => onSelectWinner(cand)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1 shadow"
                  >
                    <Trophy className="w-3.5 h-3.5 text-slate-950" />
                    <span>Select as Category Winner</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Comparing {candidates.length} candidates for final selection committee signoff.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
};
