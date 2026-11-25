import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';

interface NominationFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedBU: string;
  setSelectedBU: (bu: string) => void;
  selectedTier: string;
  setSelectedTier: (tier: string) => void;
  selectedApproval: string;
  setSelectedApproval: (approval: string) => void;
  selectedAlignment: string;
  setSelectedAlignment: (align: string) => void;
  selectedDecision: string;
  setSelectedDecision: (dec: string) => void;
  selectedCheckpoint?: string;
  setSelectedCheckpoint?: (checkpoint: string) => void;
  categories: string[];
  businessUnits: string[];
  tiers: string[];
  internalDecisions: string[];
  onReset: () => void;
}

export const NominationFilters: React.FC<NominationFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedBU,
  setSelectedBU,
  selectedTier,
  setSelectedTier,
  selectedApproval,
  setSelectedApproval,
  selectedAlignment,
  setSelectedAlignment,
  selectedDecision,
  setSelectedDecision,
  selectedCheckpoint = 'ALL',
  setSelectedCheckpoint,
  categories,
  businessUnits,
  tiers,
  internalDecisions,
  onReset
}) => {
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'ALL' ||
    selectedBU !== 'ALL' ||
    selectedTier !== 'ALL' ||
    selectedApproval !== 'ALL' ||
    selectedAlignment !== 'ALL' ||
    selectedDecision !== 'ALL' ||
    selectedCheckpoint !== 'ALL';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Nominee Name, ID, Nomination ID, BU, Citation, or Decision..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2 text-xs">
          {/* Manager & Leadership Checkpoint Filter (C1-C10) */}
          {setSelectedCheckpoint && (
            <select
              value={selectedCheckpoint}
              onChange={(e) => setSelectedCheckpoint(e.target.value)}
              className="px-2.5 py-2 border border-amber-300 rounded-lg bg-amber-50/70 text-slate-800 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              title="Filter by Organizational Competency & Progressive Checkpoint (C1–C10)"
            >
              <option value="ALL">All Nominator Bands (C1–C10)</option>
              <option value="C10">💎 C10 CXO / EVP (+75%)</option>
              <option value="EXECUTIVE_PLUS">👑 C8–C10 Executive (+55-75%)</option>
              <option value="LEADERSHIP_PLUS">👑 C6–C10 Leadership (+35-75%)</option>
              <option value="MANAGER_PLUS">👔 C5–C10 Sponsored (+25-75%)</option>
              <option value="MANAGER_ONLY">👔 C5 Manager (+25%)</option>
              <option value="PEER_ONLY">👥 C1–C4 Peer / Lead (1.0x–1.15x)</option>
            </select>
          )}

          {/* AI vs Human Alignment Filter */}
          <select
            value={selectedAlignment}
            onChange={(e) => setSelectedAlignment(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg bg-emerald-50/50 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            title="Filter by consensus between AI evaluation and Human decision"
          >
            <option value="ALL">All Alignments</option>
            <option value="ALIGNED">🟢 Aligned (Consensus)</option>
            <option value="DISCREPANCY">⚠️ All Discrepancies</option>
            <option value="AI_HIGHER">🟠 AI High / Human Rejected</option>
            <option value="HUMAN_HIGHER">🔴 Human Winner / AI Low</option>
            <option value="PENDING">⚪ Decision Pending</option>
          </select>

          {/* Internal Decision Dropdown */}
          <select
            value={selectedDecision}
            onChange={(e) => setSelectedDecision(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            title="Filter by Human/Committee Decision"
          >
            <option value="ALL">All Internal Decisions</option>
            {internalDecisions.map((dec) => (
              <option key={dec} value={dec}>
                {dec}
              </option>
            ))}
          </select>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* BU Dropdown */}
          <select
            value={selectedBU}
            onChange={(e) => setSelectedBU(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">All Business Units</option>
            {businessUnits.map((bu) => (
              <option key={bu} value={bu}>
                {bu}
              </option>
            ))}
          </select>

          {/* Recommendation Tier */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">All AI Tiers</option>
            {tiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Primary Approval Filter */}
          <select
            value={selectedApproval}
            onChange={(e) => setSelectedApproval(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">All Approvals</option>
            <option value="Approved">Primary Approved</option>
            <option value="Pending">Primary Pending</option>
          </select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1.5 rounded hover:bg-rose-50 transition self-end lg:self-center shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
