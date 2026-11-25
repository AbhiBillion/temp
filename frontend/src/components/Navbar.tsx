import React, { useRef } from 'react';
import { 
  Award, 
  Upload, 
  Download, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  BarChart2, 
  Sliders, 
  Layers, 
  Users,
  CheckCircle2,
  Trash2,
  Calculator,
  Paperclip
} from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onFileUpload: (file: File) => void;
  onClearData: () => void;
  onExport: () => void;
  onBatchEvaluate: () => void;
  onOpenAddModal: () => void;
  onOpenComparison: () => void;
  onOpenScoringDetails: () => void;
  onOpenUploadProof?: () => void;
  proofCount?: number;
  isEvaluatingBatch: boolean;
  totalCount: number;
  evaluatedCount: number;
  selectedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  onFileUpload,
  onClearData,
  onExport,
  onBatchEvaluate,
  onOpenAddModal,
  onOpenComparison,
  onOpenScoringDetails,
  onOpenUploadProof,
  proofCount = 0,
  isEvaluatingBatch,
  totalCount,
  evaluatedCount,
  selectedCount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = ''; // reset
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-300 p-2 rounded-lg text-slate-950 shadow-inner">
              <Award className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  R&R Nomination Evaluator
                </h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
                  AI Scoring Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Category criteria rating & candidate selection dashboard
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'all'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Nominations ({totalCount})</span>
            </button>

            <button
              onClick={() => setViewMode('evaluated')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'evaluated'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Evaluated ({evaluatedCount})</span>
            </button>

            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'analytics'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition shadow-sm"
              title="Upload Nomination Excel or CSV spreadsheet"
            >
              <Upload className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span className="hidden sm:inline">Upload Spreadsheet</span>
            </button>

            {onOpenUploadProof && totalCount > 0 && (
              <button
                onClick={onOpenUploadProof}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg shadow-sm transition"
                title="Upload proof documents (PDF, Email, JPG) from local system"
              >
                <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Upload Proofs</span>
                {proofCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                    {proofCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onOpenScoringDetails}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg shadow-sm transition"
              title="View Evaluation Criteria, Weights & Scoring Rubric"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Scoring Details</span>
            </button>

            {selectedCount > 1 && (
              <button
                onClick={onOpenComparison}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Compare ({selectedCount})</span>
              </button>
            )}

            <button
              onClick={onBatchEvaluate}
              disabled={isEvaluatingBatch || totalCount === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg shadow transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isEvaluatingBatch ? 'animate-spin' : ''}`} />
              <span>{isEvaluatingBatch ? 'Evaluating...' : 'Rate All (AI)'}</span>
            </button>

            {totalCount > 0 && (
              <button
                onClick={onClearData}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg transition"
                title="Clear loaded nominations and return to upload screen"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Clear List</span>
              </button>
            )}

            <button
              onClick={onExport}
              disabled={totalCount === 0}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50"
              title="Export evaluated report to Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
              title="Add single nomination"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
