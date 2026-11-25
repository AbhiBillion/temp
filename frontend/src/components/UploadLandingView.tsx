import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, FileText, Info, Download, Award } from 'lucide-react';
import { downloadSampleTemplateExcel } from '../utils/excelParser';

interface UploadLandingViewProps {
  onFileUpload: (file: File) => void;
  onLoadSampleData?: () => void;
}

export const UploadLandingView: React.FC<UploadLandingViewProps> = ({
  onFileUpload,
  onLoadSampleData
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 space-y-8">
      
      {/* Primary Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-700 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>R&R Nomination Evaluation & Alignment Platform</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Upload Nomination Spreadsheet
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Upload your R&R nominations spreadsheet (.xlsx, .xls, or .csv).
          The evaluation engine automatically maps candidate details, citations, <strong>nominator competency bands (C1–C10)</strong> with progressive weightage starting from C5 (+5%) up to C10 (+30%) and <strong>executive authority floors</strong> for concise nominations.
        </p>
      </div>

      {/* Main Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-amber-500 bg-amber-50/50 shadow-lg scale-[1.01]'
            : 'border-slate-300 hover:border-amber-500 bg-white hover:bg-slate-50/80 shadow-sm'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
            <Upload className="w-8 h-8 stroke-[2]" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Drag & Drop your Nomination Spreadsheet here
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse Spreadsheet...</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                downloadSampleTemplateExcel();
              }}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm border border-slate-200 transition flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download Template (.xlsx)</span>
            </button>

            {onLoadSampleData && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadSampleData();
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 border border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load 10 Sample Nominations</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Extracted Columns Spec Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <h2 className="text-sm font-bold text-slate-900">
            Spreadsheet Columns Automatically Parsed & Mapped
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-300">
            <div className="font-bold text-amber-900 flex items-center space-x-1.5 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Nominator_competency</span>
            </div>
            <p className="text-amber-800 text-[11px]">
              Accepts <strong>C1 to C10</strong>. Weightage starts from C5 (+5%) and increases by 5% up to C10 (+30%). Applies <strong>Authority Floor</strong> if citation is concise.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span>Nominated By</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Nominator name or role. If competency column is omitted, auto-extracts bands like <em>&quot;Priya (C5)&quot;</em> or <em>&quot;Vikram (C10)&quot;</em>.
            </p>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="font-bold text-emerald-800 flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Internal Decision</span>
            </div>
            <p className="text-emerald-700 text-[11px]">Ingests committee decisions (&quot;Winner&quot;, &quot;Shortlisted&quot;, &quot;Rejected&quot;, etc.)</p>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
            <div className="font-bold text-purple-800 flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>AI vs Human Alignment</span>
            </div>
            <p className="text-purple-700 text-[11px]">Computes consensus and highlights discrepancies for committee audit</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-700 flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Nomination Category</span>
            </div>
            <p className="text-slate-500 text-[11px]">Spot Award, Star of Quarter, Innovation Champion, etc.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-700 flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Evulation Criteria</span>
            </div>
            <p className="text-slate-500 text-[11px]">Standard category guidelines and scoring rules</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-700 flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Nomination Citation</span>
            </div>
            <p className="text-slate-500 text-[11px]">Detailed contribution text and metrics write-up</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Nominee Identity &amp; Band</div>
            <p className="text-slate-500 text-[11px]">Nominee Name, Employee ID, DOJ, Nominee Band (C1–C10)</p>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-300 sm:col-span-2 lg:col-span-4">
            <div className="font-bold text-emerald-950 flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Proof Documents Auto-Mapping (.pdf, .eml, .msg, .jpg)</span>
            </div>
            <p className="text-emerald-800 text-[11px]">
              Upload proof emails, PDFs, or screenshots from your local system. Files starting with the <strong>Nomination ID</strong> (e.g. <em>&quot;RR-90412_Client_Feedback.pdf&quot;</em> or <em>&quot;RR-90412-Appreciation.eml&quot;</em>) are automatically mapped to the respective employee and displayed on the main page.
            </p>
          </div>

        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 flex items-start space-x-2 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Flexibility &amp; Progressive Weightage:</strong> Headers in your spreadsheet are case-insensitive. For the nominator&apos;s competency band, you can pass <em>&quot;Nominator_competency&quot;</em>, <em>&quot;Nominator Competency&quot;</em>, <em>&quot;Nominator Level&quot;</em>, <em>&quot;Nominator Band&quot;</em>, or <em>&quot;Manager Level&quot;</em> with values like <em>C1</em> through <em>C10</em>. High nominator levels apply elevated authority floors even if comments are concise.
          </span>
        </div>
      </div>

    </div>
  );
};
