import React, { useState, useMemo } from 'react';
import { NominationRecord, ProofDocument, ViewMode, getAlignmentAnalysis, getCompetencyCheckpoint } from './types';
import { parseSpreadsheetFile, exportEvaluatedToExcel } from './utils/excelParser';
import { SAMPLE_NOMINATIONS } from './data/sampleNominations';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { NominationFilters } from './components/NominationFilters';
import { NominationTable } from './components/NominationTable';
import { NominationDetailDrawer } from './components/NominationDetailDrawer';
import { CandidateComparisonModal } from './components/CandidateComparisonModal';
import { AnalyticsView } from './components/AnalyticsView';
import { AddNominationModal } from './components/AddNominationModal';
import { UploadLandingView } from './components/UploadLandingView';
import { ScoringDetailsModal } from './components/ScoringDetailsModal';
import { UploadProofModal } from './components/UploadProofModal';
import { ProofDocumentViewerModal } from './components/ProofDocumentViewerModal';

export default function App() {
  const [nominations, setNominations] = useState<NominationRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBU, setSelectedBU] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedApproval, setSelectedApproval] = useState('ALL');
  const [selectedAlignment, setSelectedAlignment] = useState('ALL');
  const [selectedDecision, setSelectedDecision] = useState('ALL');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('ALL');

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<NominationRecord | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState<boolean>(false);
  const [isUploadProofOpen, setIsUploadProofOpen] = useState<boolean>(false);
  const [targetNominationIdForProof, setTargetNominationIdForProof] = useState<string | undefined>(undefined);
  const [previewProofDoc, setPreviewProofDoc] = useState<ProofDocument | null>(null);
  const [previewProofNomination, setPreviewProofNomination] = useState<NominationRecord | null>(null);

  // Derived filter options
  const categories = useMemo(() => {
    return Array.from(new Set(nominations.map((n) => n.nominationCategory))).filter(Boolean);
  }, [nominations]);

  const businessUnits = useMemo(() => {
    return Array.from(new Set(nominations.map((n) => n.buOfNominee))).filter(Boolean);
  }, [nominations]);

  const internalDecisions = useMemo(() => {
    return Array.from(new Set(nominations.map((n) => n.internalDecision || 'Pending Review'))).filter(Boolean);
  }, [nominations]);

  const tiers = [
    'Top Contender - Winner',
    'Strong Nominee - Recommended',
    'Satisfactory - Honorable Mention',
    'Needs Improvement',
    'Insufficient Citation Data'
  ];

  // Filtered Nominations
  const filteredNominations = useMemo(() => {
    return nominations.filter((nom) => {
      // ViewMode filter
      if (viewMode === 'evaluated' && !nom.evaluation) return false;
      if (viewMode === 'pending_evaluation' && nom.evaluation) return false;
      if (viewMode === 'top_candidates' && (!nom.evaluation || (nom.evaluation.humanOverrideScore ?? nom.evaluation.overallScore) < 90)) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = nom.nomineeName.toLowerCase().includes(term);
        const matchNomId = nom.nominationId.toLowerCase().includes(term);
        const matchEmpId = nom.nomineeId.toLowerCase().includes(term);
        const matchCitation = nom.nominationCitation.toLowerCase().includes(term);
        const matchBU = nom.buOfNominee.toLowerCase().includes(term);
        const matchDec = (nom.internalDecision || '').toLowerCase().includes(term);
        if (!matchName && !matchNomId && !matchEmpId && !matchCitation && !matchBU && !matchDec) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && nom.nominationCategory !== selectedCategory) {
        return false;
      }

      // BU filter
      if (selectedBU !== 'ALL' && nom.buOfNominee !== selectedBU) {
        return false;
      }

      // Tier filter
      if (selectedTier !== 'ALL' && nom.evaluation?.recommendationTier !== selectedTier) {
        return false;
      }

      // Approval filter
      if (selectedApproval !== 'ALL' && nom.primaryApproval !== selectedApproval) {
        return false;
      }

      // AI vs Human Alignment filter
      if (selectedAlignment !== 'ALL') {
        const analysis = getAlignmentAnalysis(nom);
        if (selectedAlignment === 'ALIGNED' && analysis.category !== 'Aligned') return false;
        if (selectedAlignment === 'DISCREPANCY' && analysis.category !== 'AI Higher' && analysis.category !== 'Human Higher') return false;
        if (selectedAlignment === 'AI_HIGHER' && analysis.category !== 'AI Higher') return false;
        if (selectedAlignment === 'HUMAN_HIGHER' && analysis.category !== 'Human Higher') return false;
        if (selectedAlignment === 'PENDING' && analysis.category !== 'Pending') return false;
      }

      // Internal Decision filter
      if (selectedDecision !== 'ALL' && (nom.internalDecision || 'Pending Review') !== selectedDecision) {
        return false;
      }

      // Manager / Leadership Checkpoint (C1-C10) filter
      if (selectedCheckpoint !== 'ALL') {
        const cp = getCompetencyCheckpoint(nom);
        if (selectedCheckpoint === 'C10' && cp.band !== 'C10') return false;
        if (selectedCheckpoint === 'EXECUTIVE_PLUS' && !['C8', 'C9', 'C10'].includes(cp.band)) return false;
        if (selectedCheckpoint === 'LEADERSHIP_PLUS' && !['C6', 'C7', 'C8', 'C9', 'C10'].includes(cp.band)) return false;
        if (selectedCheckpoint === 'MANAGER_PLUS' && !cp.checkpointPassed) return false;
        if (selectedCheckpoint === 'MANAGER_ONLY' && !cp.isManager) return false;
        if (selectedCheckpoint === 'PEER_ONLY' && cp.checkpointPassed) return false;
      }

      return true;
    });
  }, [nominations, viewMode, searchTerm, selectedCategory, selectedBU, selectedTier, selectedApproval, selectedAlignment, selectedDecision, selectedCheckpoint]);

  // Sanitize nomination for API call to keep payload lightweight (<10KB) without huge base64 strings
  const sanitizeNominationForApi = (nom: NominationRecord) => {
    return {
      ...nom,
      proofDocuments: nom.proofDocuments?.map((p) => ({
        id: p.id,
        fileName: p.fileName,
        fileType: p.fileType,
        formattedSize: p.formattedSize,
        uploadedAt: p.uploadedAt,
        extractedNominationId: p.extractedNominationId,
        nomineeName: p.nomineeName,
        emailMeta: p.emailMeta,
        extractedContent: p.extractedContent ? p.extractedContent.slice(0, 3000) : undefined
      }))
    };
  };

  // Handle single candidate evaluation
  const handleEvaluateSingle = async (nomination: NominationRecord) => {
    setEvaluatingId(nomination.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/evaluate-nomination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomination: sanitizeNominationForApi(nomination) })
      });
      const data = await res.json();
      if (data.evaluation) {
        setNominations((prev) =>
          prev.map((n) => (n.id === nomination.id ? { ...n, evaluation: data.evaluation } : n))
        );
        // If drawer is viewing this candidate, update drawer state
        if (selectedCandidate?.id === nomination.id) {
          setSelectedCandidate({ ...nomination, evaluation: data.evaluation });
        }
      }
    } catch (err) {
      console.error('Error evaluating single candidate:', err);
    } finally {
      setEvaluatingId(null);
    }
  };

  // Handle batch evaluation for specific selected nomination IDs or all filtered nominations
  const handleBatchEvaluateSelected = async (targetIds: string[]) => {
    const targetNominations = nominations.filter((n) => targetIds.includes(n.id));
    if (targetNominations.length === 0) return;

    setIsEvaluatingBatch(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/evaluate-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nominations: targetNominations.map(sanitizeNominationForApi) })
      });
      const data = await res.json();
      if (Array.isArray(data.nominations)) {
        const resultMap = new Map(data.nominations.map((n: NominationRecord) => [n.id, n]));
        setNominations((prev) =>
          prev.map((n) => (resultMap.has(n.id) ? resultMap.get(n.id)! : n))
        );
      }
    } catch (err) {
      console.error('Error running batch evaluation on selected rows:', err);
    } finally {
      setIsEvaluatingBatch(false);
    }
  };

  const handleBatchEvaluate = async () => {
    await handleBatchEvaluateSelected(filteredNominations.map((n) => n.id));
  };

  const handleDeleteSelected = (idsToDelete: string[]) => {
    if (idsToDelete.length === 0) return;
    const confirmMessage =
      idsToDelete.length === 1
        ? 'Are you sure you want to delete this candidate record?'
        : `Are you sure you want to delete ${idsToDelete.length} selected candidate records?`;

    if (window.confirm(confirmMessage)) {
      setNominations((prev) => prev.filter((n) => !idsToDelete.includes(n.id)));
      setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      if (selectedCandidate && idsToDelete.includes(selectedCandidate.id)) {
        setSelectedCandidate(null);
      }
    }
  };

  // File Upload
  const handleFileUpload = async (file: File) => {
    try {
      const parsedRecords = await parseSpreadsheetFile(file);
      if (parsedRecords.length > 0) {
        setNominations(parsedRecords);
        setSelectedIds([]);
        alert(`Successfully imported ${parsedRecords.length} nomination records from ${file.name}!`);
      } else {
        alert('No valid nomination records found in the uploaded file.');
      }
    } catch (err: any) {
      console.error('Error parsing file:', err);
      alert('Failed to parse spreadsheet file: ' + err.message);
    }
  };

  // Export
  const handleExport = () => {
    exportEvaluatedToExcel(nominations, `RR_Nominations_Evaluated_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Human Override Score
  const handleSaveHumanOverride = (nominationId: string, overrideScore: number, notes: string) => {
    setNominations((prev) =>
      prev.map((n) => {
        if (n.id === nominationId && n.evaluation) {
          const updatedEval = {
            ...n.evaluation,
            humanOverrideScore: overrideScore,
            humanNotes: notes
          };
          if (selectedCandidate?.id === nominationId) {
            setSelectedCandidate({ ...n, evaluation: updatedEval });
          }
          return { ...n, evaluation: updatedEval };
        }
        return n;
      })
    );
  };

  // Selection toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredNominations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNominations.map((n) => n.id));
    }
  };

  const selectedCandidatesForComparison = nominations.filter((n) => selectedIds.includes(n.id));

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedBU('ALL');
    setSelectedTier('ALL');
    setSelectedApproval('ALL');
    setSelectedAlignment('ALL');
    setSelectedDecision('ALL');
    setSelectedCheckpoint('ALL');
  };

  const handleUpdateNominatorCompetency = (nominationId: string, level: string) => {
    setNominations((prev) =>
      prev.map((n) => {
        if (n.id === nominationId) {
          const updatedNom = { ...n, nominatorCompetency: level };
          const cp = getCompetencyCheckpoint(updatedNom);
          
          let updatedEval = updatedNom.evaluation;
          if (updatedEval) {
            // Update the evaluation's managerCheckpoint metadata
            updatedEval = {
              ...updatedEval,
              managerCheckpoint: {
                band: cp.band,
                title: cp.title,
                checkpointPassed: cp.checkpointPassed,
                isManager: cp.isManager,
                isLeadership: cp.isLeadership,
                multiplier: cp.weightMultiplier,
                boostPercent: cp.boostPercentage,
                rationale: cp.checkpointPassed
                  ? `Sponsorship checkpoint confirmed: Endorsed at ${cp.title} (${cp.band}) seniority level with verified supervisory accountability and certified business ROI (+${cp.boostPercentage}% weightage boost).`
                  : `Peer / Lead nomination at ${cp.title} (${cp.band}) level. Evaluated with baseline 1.0x criteria weightage.`
              }
            };
          }

          const updatedRecord = { ...updatedNom, evaluation: updatedEval };
          if (selectedCandidate?.id === nominationId) {
            setSelectedCandidate(updatedRecord);
          }
          return updatedRecord;
        }
        return n;
      })
    );
  };

  const handleUpdateInternalDecision = (nominationId: string, decision: string) => {
    setNominations((prev) =>
      prev.map((n) => {
        if (n.id === nominationId) {
          const updated = { ...n, internalDecision: decision };
          if (selectedCandidate?.id === nominationId) {
            setSelectedCandidate(updated);
          }
          return updated;
        }
        return n;
      })
    );
  };

  const handleBatchUpdateDecision = (ids: string[], decision: string) => {
    setNominations((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, internalDecision: decision } : n))
    );
    if (selectedCandidate && ids.includes(selectedCandidate.id)) {
      setSelectedCandidate((prev) => (prev ? { ...prev, internalDecision: decision } : null));
    }
  };

  const handleAddCandidate = (newCandidate: NominationRecord) => {
    setNominations((prev) => [newCandidate, ...prev]);
  };

  const totalProofCount = useMemo(() => {
    return nominations.reduce((acc, n) => acc + (n.proofDocuments?.length || 0), 0);
  }, [nominations]);

  const handleOpenUploadProof = (targetNominationId?: string) => {
    setTargetNominationIdForProof(targetNominationId);
    setIsUploadProofOpen(true);
  };

  const handlePreviewProofDoc = (doc: ProofDocument, nom: NominationRecord) => {
    setPreviewProofDoc(doc);
    setPreviewProofNomination(nom);
  };

  const handleAttachProofs = (mappings: { nominationId: string; proof: ProofDocument }[]) => {
    if (mappings.length === 0) return;

    setNominations((prev) => {
      const grouped = new Map<string, ProofDocument[]>();
      mappings.forEach(({ nominationId, proof }) => {
        const list = grouped.get(nominationId) || [];
        list.push(proof);
        grouped.set(nominationId, list);
      });

      return prev.map((nom) => {
        const matches = grouped.get(nom.id) || grouped.get(nom.nominationId);
        if (matches && matches.length > 0) {
          const existingProofs = nom.proofDocuments || [];
          const updatedProofs = [...existingProofs, ...matches];
          
          let updatedEval = nom.evaluation;
          if (updatedEval) {
            const note = `📎 Verified Proof Documents Attached: ${matches.map((m) => m.fileName).join(', ')}`;
            const strengths = updatedEval.keyStrengths || [];
            if (!strengths.some((s) => s.includes('Proof Documents Attached'))) {
              updatedEval = {
                ...updatedEval,
                citationEvidenceScore: Math.min(10.0, Math.round(((updatedEval.citationEvidenceScore || 7.0) + 0.6) * 10) / 10),
                keyStrengths: [note, ...strengths]
              };
            }
          }

          const updatedNom = {
            ...nom,
            isAttachmentUploaded: 'Yes',
            proofDocuments: updatedProofs,
            evaluation: updatedEval
          };

          if (selectedCandidate && (selectedCandidate.id === nom.id || selectedCandidate.nominationId === nom.nominationId)) {
            setSelectedCandidate(updatedNom);
          }

          return updatedNom;
        }
        return nom;
      });
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Top Navbar */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onFileUpload={handleFileUpload}
        onClearData={() => { setNominations([]); setSelectedIds([]); }}
        onExport={handleExport}
        onBatchEvaluate={handleBatchEvaluate}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenComparison={() => setIsComparisonModalOpen(true)}
        onOpenScoringDetails={() => setIsScoringModalOpen(true)}
        onOpenUploadProof={() => handleOpenUploadProof()}
        proofCount={totalProofCount}
        isEvaluatingBatch={isEvaluatingBatch}
        totalCount={nominations.length}
        evaluatedCount={nominations.filter((n) => n.evaluation).length}
        selectedCount={selectedIds.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {nominations.length === 0 ? (
          <UploadLandingView
            onFileUpload={handleFileUpload}
            onLoadSampleData={() => setNominations(SAMPLE_NOMINATIONS)}
          />
        ) : (
          <>
            {/* KPI Summary Cards */}
            <StatsOverview nominations={nominations} />

            {/* View mode switcher or analytics */}
            {viewMode === 'analytics' ? (
              <AnalyticsView nominations={nominations} />
            ) : (
              <>
                {/* Filter controls */}
                <NominationFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedBU={selectedBU}
                  setSelectedBU={setSelectedBU}
                  selectedTier={selectedTier}
                  setSelectedTier={setSelectedTier}
                  selectedApproval={selectedApproval}
                  setSelectedApproval={setSelectedApproval}
                  selectedAlignment={selectedAlignment}
                  setSelectedAlignment={setSelectedAlignment}
                  selectedDecision={selectedDecision}
                  setSelectedDecision={setSelectedDecision}
                  selectedCheckpoint={selectedCheckpoint}
                  setSelectedCheckpoint={setSelectedCheckpoint}
                  categories={categories}
                  businessUnits={businessUnits}
                  tiers={tiers}
                  internalDecisions={internalDecisions}
                  onReset={handleResetFilters}
                />

                {/* Nominations Data Table */}
                <NominationTable
                  nominations={filteredNominations}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onDeselectAll={() => setSelectedIds([])}
                  onSelectCandidate={(candidate) => setSelectedCandidate(candidate)}
                  onEvaluateSingle={handleEvaluateSingle}
                  onEvaluateSelected={handleBatchEvaluateSelected}
                  onDeleteSelected={handleDeleteSelected}
                  onOpenComparison={() => setIsComparisonModalOpen(true)}
                  onOpenScoringDetails={() => setIsScoringModalOpen(true)}
                  onOpenUploadProof={handleOpenUploadProof}
                  onPreviewProofDoc={handlePreviewProofDoc}
                  onUpdateInternalDecision={handleUpdateInternalDecision}
                  onBatchUpdateDecision={handleBatchUpdateDecision}
                  onFilterAlignment={setSelectedAlignment}
                  selectedAlignment={selectedAlignment}
                  evaluatingId={evaluatingId}
                  isEvaluatingBatch={isEvaluatingBatch}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* Drawer / Modals */}
      {selectedCandidate && (
        <NominationDetailDrawer
          nomination={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onEvaluate={handleEvaluateSingle}
          onSaveHumanOverride={handleSaveHumanOverride}
          onUpdateInternalDecision={handleUpdateInternalDecision}
          onUpdateNominatorCompetency={handleUpdateNominatorCompetency}
          onOpenScoringDetails={() => setIsScoringModalOpen(true)}
          onPreviewProofDoc={handlePreviewProofDoc}
          onOpenUploadProof={handleOpenUploadProof}
          isEvaluating={evaluatingId === selectedCandidate.id}
        />
      )}

      {isComparisonModalOpen && (
        <CandidateComparisonModal
          candidates={selectedCandidatesForComparison}
          onClose={() => setIsComparisonModalOpen(false)}
          onSelectWinner={(cand) => {
            alert(`Selected ${cand.nomineeName} (${cand.nominationCategory}) as the Category Winner!`);
            setIsComparisonModalOpen(false);
          }}
        />
      )}

      {isAddModalOpen && (
        <AddNominationModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddCandidate}
        />
      )}

      <ScoringDetailsModal
        isOpen={isScoringModalOpen}
        onClose={() => setIsScoringModalOpen(false)}
      />

      {/* Proof Documents Upload & Mapping Modal */}
      <UploadProofModal
        isOpen={isUploadProofOpen}
        nominations={nominations}
        targetNominationId={targetNominationIdForProof}
        onClose={() => {
          setIsUploadProofOpen(false);
          setTargetNominationIdForProof(undefined);
        }}
        onAttachProofs={handleAttachProofs}
      />

      {/* Proof Document Viewer / Lightbox Modal */}
      <ProofDocumentViewerModal
        document={previewProofDoc}
        nomination={previewProofNomination}
        onClose={() => {
          setPreviewProofDoc(null);
          setPreviewProofNomination(null);
        }}
        onOpenUploadProof={handleOpenUploadProof}
      />
    </div>
  );
}
