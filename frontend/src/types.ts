export type ProofFileType = 'pdf' | 'image' | 'email' | 'document' | 'other';

export interface ProofEmailMeta {
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  bodySnippet?: string;
}

export interface ProofDocument {
  id: string;
  fileName: string;
  fileType: ProofFileType;
  fileSize: number; // in bytes
  formattedSize: string; // e.g. "145 KB"
  uploadedAt: string; // ISO string
  dataUrl?: string; // base64 or blob URL for viewing/download
  blobUrl?: string; // object URL for safe viewing/download
  extractedNominationId?: string; // e.g. "RR-90412"
  nomineeName?: string;
  notes?: string;
  rawFile?: File;
  emailMeta?: ProofEmailMeta;
  extractedContent?: string;
}

export interface NominationRecord {
  id: string; // Internal unique ID or nominationId
  nominationId: string;
  nominationType: string;
  competency: string;
  nominationCategory: string;
  nominationCitation: string;
  evaluationCriteria: string; // normalized from Evulation Criteria
  nominatedBy: string;
  pendingWith: string;
  primaryApproval: string;
  assignee: string;
  primaryApproverStatus: string;
  rrApprover: string;
  rrStatus: string;
  sharedServicesApprover: string;
  sharedServicesStatus: string;
  isAttachmentUploaded: string | boolean;
  nomineeLocation: string;
  nomineeBaseLocation: string;
  contributionFor: string;
  contributionInfo: string;
  nomineeName: string;
  nomineeId: string;
  buOfNominee: string;
  doj: string;
  practice: string;

  // Internal human decision (e.g. 'Winner', 'Shortlisted', 'Under Review', 'Rejected', etc.)
  internalDecision?: string;

  // Organizational Competency Band (C1 - C10 ladder)
  nominatorCompetency?: string; // e.g. 'C5', 'C6', 'C7'
  nomineeBand?: string; // e.g. 'C2', 'C3', 'C4'

  // Proof Documents (PDFs, Emails, Images) attached to this nomination
  proofDocuments?: ProofDocument[];

  // Evaluation metadata
  evaluation?: EvaluationResult;
  isEvaluating?: boolean;
}

export type RecommendationTier = 
  | 'Top Contender - Winner' 
  | 'Strong Nominee - Recommended' 
  | 'Satisfactory - Honorable Mention' 
  | 'Needs Improvement' 
  | 'Insufficient Citation Data';

export type AlignmentCategory = 'Aligned' | 'AI Higher' | 'Human Higher' | 'Pending';

export interface AlignmentAnalysis {
  category: AlignmentCategory;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconType: 'check' | 'alert' | 'warning' | 'clock';
  explanation: string;
}

export function getAlignmentAnalysis(nomination: NominationRecord): AlignmentAnalysis {
  const decision = (nomination.internalDecision || '').trim();
  const lowerDec = decision.toLowerCase();
  const evaluation = nomination.evaluation;

  // If no evaluation or decision is explicitly pending/unspecified
  if (!evaluation || !decision || lowerDec === 'pending' || lowerDec === 'pending review' || lowerDec === 'in review' || lowerDec === 'under review' || lowerDec === 'tbd') {
    return {
      category: 'Pending',
      label: !decision ? 'Decision Pending' : decision,
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      badgeBorder: 'border-slate-300',
      iconType: 'clock',
      explanation: !evaluation 
        ? 'AI evaluation pending; unable to compare with internal decision.'
        : 'Internal committee decision is still pending review.'
    };
  }

  const score = evaluation.humanOverrideScore ?? evaluation.overallScore;
  const tier = evaluation.recommendationTier || '';

  const isWinnerHuman = ['winner', 'selected', 'selected - winner', 'awarded', 'approved'].some(w => lowerDec.includes(w));
  const isShortlistHuman = ['shortlisted', 'shortlist', 'finalist'].some(w => lowerDec.includes(w));
  const isHonorableHuman = ['honorable mention', 'satisfactory', 'alternate', 'hold', 'waitlist'].some(w => lowerDec.includes(w));
  const isRejectedHuman = ['rejected', 'not selected', 'disqualified', 'declined', 'not recommended', 'dropped'].some(w => lowerDec.includes(w));

  // 1. Human Decision: Winner
  if (isWinnerHuman) {
    if (score >= 82 || tier.includes('Winner') || tier.includes('Recommended')) {
      return {
        category: 'Aligned',
        label: 'Aligned (Winner)',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-300',
        iconType: 'check',
        explanation: `Strong consensus: AI rated as ${tier} (${score}/100) and internal committee designated "${decision}". Actual score reflects robust comments, verified proof, and senior leadership backing.`
      };
    } else if (score >= 72) {
      return {
        category: 'Human Higher',
        label: 'Minor Divergence (Human Favored)',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-300',
        iconType: 'warning',
        explanation: `Committee designated "${decision}", while AI calculated ${score}/100 based on the 3 inputs. Additional documentary proof will boost the evidence score.`
      };
    } else {
      return {
        category: 'Human Higher',
        label: 'Discrepancy: Human Selected / AI Low',
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-300',
        iconType: 'warning',
        explanation: `Divergence: Internal committee selected "${decision}", but AI scored low (${score}/100, ${tier}) due to brief qualitative remarks without metrics, missing attachments, or peer nominator band. Committee should verify documentation.`
      };
    }
  }

  // 2. Human Decision: Shortlisted
  if (isShortlistHuman) {
    if (score >= 75) {
      return {
        category: 'Aligned',
        label: 'Aligned (Shortlisted)',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-300',
        iconType: 'check',
        explanation: `Consensus: Committee shortlisted nominee ("${decision}") and AI structured score is ${score}/100 (${tier}), confirming high qualification.`
      };
    } else {
      return {
        category: 'Human Higher',
        label: 'Discrepancy: Human Selected / AI Low',
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-300',
        iconType: 'warning',
        explanation: `Committee shortlisted candidate ("${decision}"), but AI scored ${score}/100 due to citation metrics or proof gaps.`
      };
    }
  }

  // 3. Human Decision: Honorable Mention
  if (isHonorableHuman) {
    if (score >= 68 && score <= 83) {
      return {
        category: 'Aligned',
        label: 'Aligned (Honorable)',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-300',
        iconType: 'check',
        explanation: `Consensus: AI scored ${score}/100 and committee designated "${decision}", confirming recognized solid delivery.`
      };
    } else if (score > 83) {
      return {
        category: 'AI Higher',
        label: 'Discrepancy: AI High / Human Moderate',
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-700',
        badgeBorder: 'border-orange-300',
        iconType: 'alert',
        explanation: `AI scored high (${score}/100) due to strong comments and proof, but committee marked "${decision}". Nominee could be considered for higher recognition.`
      };
    } else {
      return {
        category: 'Human Higher',
        label: 'Minor Divergence (Human Favored)',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-300',
        iconType: 'warning',
        explanation: `Committee marked "${decision}" while AI scored ${score}/100.`
      };
    }
  }

  // 4. Human Decision: Rejected
  if (isRejectedHuman) {
    if (score < 72) {
      return {
        category: 'Aligned',
        label: 'Aligned (Rejected)',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
        badgeBorder: 'border-slate-300',
        iconType: 'check',
        explanation: `Consensus: AI rated as ${tier} (${score}/100) and committee marked "${decision}". Both concur that nomination lacked required metrics or proof.`
      };
    } else {
      return {
        category: 'AI Higher',
        label: 'Discrepancy: AI High / Human Rejected',
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-700',
        badgeBorder: 'border-orange-300',
        iconType: 'alert',
        explanation: `Divergence: AI calculated an elevated score (${score}/100, ${tier}) based on comments/proof/nominator, but human decision was "${decision}". Check for unwritten context, disciplinary reasons, or quota exhaustion.`
      };
    }
  }

  // Default fallback
  return {
    category: 'Aligned',
    label: `Review (${decision})`,
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-300',
    iconType: 'clock',
    explanation: `Evaluation: ${score}/100 vs Internal Decision: "${decision}".`
  };
}

export type CompetencyBand = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9' | 'C10';

export interface CompetencyLevelMeta {
  band: CompetencyBand;
  roleTitle: string;
  title: string;
  isManagerLevel: boolean;
  isSeniorLeadership: boolean;
  isCheckpointEligible: boolean;
  weightageMultiplier: number;
  weightMultiplier: number;
  boostPercentage: number;
  boostPercent: number;
  scorePointsBoost: number;
  authorityFloor: number;
}

export const COMPETENCY_LADDER: Record<CompetencyBand, CompetencyLevelMeta> = {
  'C1': { band: 'C1', roleTitle: 'Associate / Trainee', title: 'Associate / Trainee', isManagerLevel: false, isSeniorLeadership: false, isCheckpointEligible: false, weightageMultiplier: 1.00, weightMultiplier: 1.00, boostPercentage: 0, boostPercent: 0, scorePointsBoost: 0, authorityFloor: 50 },
  'C2': { band: 'C2', roleTitle: 'Software Engineer / Consultant', title: 'Engineer / Consultant', isManagerLevel: false, isSeniorLeadership: false, isCheckpointEligible: false, weightageMultiplier: 1.00, weightMultiplier: 1.00, boostPercentage: 0, boostPercent: 0, scorePointsBoost: 0, authorityFloor: 52 },
  'C3': { band: 'C3', roleTitle: 'Senior Engineer / Senior Consultant', title: 'Senior Consultant', isManagerLevel: false, isSeniorLeadership: false, isCheckpointEligible: false, weightageMultiplier: 1.02, weightMultiplier: 1.02, boostPercentage: 2, boostPercent: 2, scorePointsBoost: 1, authorityFloor: 56 },
  'C4': { band: 'C4', roleTitle: 'Lead Engineer / Associate Manager / Specialist', title: 'Lead / Specialist', isManagerLevel: false, isSeniorLeadership: false, isCheckpointEligible: false, weightageMultiplier: 1.05, weightMultiplier: 1.05, boostPercentage: 5, boostPercent: 5, scorePointsBoost: 2, authorityFloor: 62 },
  'C5': { band: 'C5', roleTitle: 'Manager / Project / Delivery Manager', title: 'Manager / Delivery Manager', isManagerLevel: true, isSeniorLeadership: false, isCheckpointEligible: true, weightageMultiplier: 1.10, weightMultiplier: 1.10, boostPercentage: 10, boostPercent: 10, scorePointsBoost: 4, authorityFloor: 74 },
  'C6': { band: 'C6', roleTitle: 'Senior Manager / Associate Director / Principal', title: 'Senior Manager / Associate Director', isManagerLevel: true, isSeniorLeadership: true, isCheckpointEligible: true, weightageMultiplier: 1.15, weightMultiplier: 1.15, boostPercentage: 15, boostPercent: 15, scorePointsBoost: 7, authorityFloor: 80 },
  'C7': { band: 'C7', roleTitle: 'Director / Practice Head / Group Delivery Manager', title: 'Director / Practice Head', isManagerLevel: true, isSeniorLeadership: true, isCheckpointEligible: true, weightageMultiplier: 1.20, weightMultiplier: 1.20, boostPercentage: 20, boostPercent: 20, scorePointsBoost: 10, authorityFloor: 84 },
  'C8': { band: 'C8', roleTitle: 'Senior Director / Assistant Vice President (AVP)', title: 'Senior Director / AVP', isManagerLevel: true, isSeniorLeadership: true, isCheckpointEligible: true, weightageMultiplier: 1.25, weightMultiplier: 1.25, boostPercentage: 25, boostPercent: 25, scorePointsBoost: 13, authorityFloor: 88 },
  'C9': { band: 'C9', roleTitle: 'Vice President (VP) / Executive Leadership', title: 'Vice President (VP)', isManagerLevel: true, isSeniorLeadership: true, isCheckpointEligible: true, weightageMultiplier: 1.30, weightMultiplier: 1.30, boostPercentage: 30, boostPercent: 30, scorePointsBoost: 16, authorityFloor: 92 },
  'C10': { band: 'C10', roleTitle: 'Senior VP / CXO / Managing Director / Board', title: 'Executive Leadership / CXO / MD', isManagerLevel: true, isSeniorLeadership: true, isCheckpointEligible: true, weightageMultiplier: 1.35, weightMultiplier: 1.35, boostPercentage: 35, boostPercent: 35, scorePointsBoost: 18, authorityFloor: 95 }
};

export interface CompetencyCheckpointInfo {
  nominatorLevel: CompetencyBand | string;
  band: CompetencyBand;
  nominatorRole: string;
  title: string;
  isManagerSponsored: boolean;
  checkpointPassed: boolean;
  isManager: boolean;
  isLeadership: boolean;
  isSeniorLeadership: boolean;
  weightageMultiplier: number;
  weightMultiplier: number;
  boostPercentage: number;
  boostPercent: number;
  badgeLabel: string;
  badgeClass: string;
  checkpointStatus: string;
  strategicWhyExplanation: string;
  checkpointKeyFactors: string[];
  authorityFloor: number;
}

/**
 * Detects nominator competency band (C1 to C10) from explicit field or nominator text
 */
export function detectNominatorCompetency(nominatedBy?: string, explicitBand?: string): CompetencyBand | string {
  if (explicitBand) {
    const cleanBand = explicitBand.toUpperCase().trim();
    if (['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'].includes(cleanBand)) {
      return cleanBand as CompetencyBand;
    }
  }

  const str = (nominatedBy || '').trim();
  if (!str) return 'C4'; // default middle level if completely unspecified

  // Regex check for (C10) or (C1)-(C9)
  const match = str.match(/\b(C10|C[1-9])\b/i);
  if (match) {
    return match[1].toUpperCase() as CompetencyBand;
  }

  const lower = str.toLowerCase();
  if (lower.includes('c10') || lower.includes('cxo') || lower.includes('managing director') || lower.includes('ceo') || lower.includes('cto') || lower.includes('coo') || lower.includes('svp') || lower.includes('senior vice president') || lower.includes('president')) return 'C10';
  if (lower.includes('c9') || lower.includes('vp') || lower.includes('vice president')) return 'C9';
  if (lower.includes('c8') || lower.includes('senior director') || lower.includes('sr. director') || lower.includes('avp')) return 'C8';
  if (lower.includes('c7') || lower.includes('director') || lower.includes('practice head')) return 'C7';
  if (lower.includes('c6') || lower.includes('senior manager') || lower.includes('sr. manager') || lower.includes('associate director') || lower.includes('delivery head') || lower.includes('principal architect')) return 'C6';
  if (lower.includes('c5') || lower.includes('manager') || lower.includes('delivery manager') || lower.includes('project manager') || lower.includes('scrum master')) return 'C5';
  if (lower.includes('c4') || lower.includes('lead') || lower.includes('architect') || lower.includes('specialist')) return 'C4';
  if (lower.includes('c3') || lower.includes('senior') || lower.includes('sr.')) return 'C3';
  if (lower.includes('c2') || lower.includes('engineer') || lower.includes('consultant')) return 'C2';
  if (lower.includes('c1') || lower.includes('associate') || lower.includes('trainee')) return 'C1';

  return 'C4'; // standard baseline
}

/**
 * Computes full checkpoint details and strategic rationale for a nomination
 */
export function getCompetencyCheckpoint(nomination: NominationRecord): CompetencyCheckpointInfo {
  const level = detectNominatorCompetency(nomination.nominatedBy, nomination.nominatorCompetency);
  const band = (['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'].includes(level) ? level : 'C4') as CompetencyBand;
  const meta = COMPETENCY_LADDER[band] || COMPETENCY_LADDER['C4'];

  const isManager = meta.isManagerLevel;
  const isSenior = meta.isSeniorLeadership;

  let badgeLabel = `👥 Peer (${band})`;
  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
  let checkpointStatus = `Progressive Weightage: ${meta.weightageMultiplier.toFixed(2)}x (+${meta.boostPercentage}%)`;
  let strategicWhyExplanation = `Peer / collaborator level (${band}) reflecting direct team collaboration and technical delivery.`;
  const keyFactors = [
    `Nominator band ${band}: ${meta.weightageMultiplier.toFixed(2)}x weightage multiplier`,
    'Task-level technical completion and operational delivery validation'
  ];

  if (band === 'C10') {
    badgeLabel = '💎 CXO / EVP Elite (C10)';
    badgeClass = 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold shadow-sm';
    checkpointStatus = '✓ Enterprise Leadership Checkpoint (C10): +30% Boost (1.30x) | Floor: 92';
    strategicWhyExplanation = 'Executive Committee / CXO / Senior VP (C10) endorsement carries supreme organizational standing. Even if citation is brief or concise, high executive authority ensures an elevated score floor (92+) recognizing enterprise-level sponsorship.';
    keyFactors.push(
      'Enterprise Governance Authority: CXO/EVP endorsement pre-screens candidates across entire business divisions',
      'Concise Citation Authority Floor (92+): Executive endorsement inherently verifies strategic impact even with brief remarks',
      'Highest Corporate Weightage: +30% weight multiplier (1.30x)'
    );
  } else if (band === 'C9') {
    badgeLabel = '🌟 VP Executive (C9)';
    badgeClass = 'bg-purple-100 text-purple-950 border-purple-400 font-extrabold shadow-sm';
    checkpointStatus = '✓ Executive Leadership Checkpoint (C9): +25% Boost (1.25x) | Floor: 88';
    strategicWhyExplanation = 'Vice President (C9) endorsement reflects macro BU business impact (+25% multiplier, 1.25x). Concise or brief citations are elevated to a minimum score floor (88+) reflecting executive sponsorship.';
    keyFactors.push(
      'Executive P&L Alignment: Directly validated against business unit goals and major customer commitments',
      'Concise Citation Authority Floor (88+): Executive credibility guarantees significance even without elaborate prose'
    );
  } else if (band === 'C8') {
    badgeLabel = '👑 Sr Director / AVP (C8)';
    badgeClass = 'bg-indigo-100 text-indigo-950 border-indigo-400 font-bold';
    checkpointStatus = '✓ Senior Leadership Checkpoint (C8): +20% Boost (1.20x) | Floor: 84';
    strategicWhyExplanation = 'Senior Director / AVP (C8) endorsement provides high leadership credibility, applying a +20% weightage multiplier (1.20x) and an elevated authority floor (84+).';
    keyFactors.push(
      'Senior Practice Leadership: Certified impact across multiple customer accounts and squads',
      'Concise Citation Authority Floor (84+): Elevated baseline prevents unfair penalties for busy senior nominators'
    );
  } else if (band === 'C7') {
    badgeLabel = '👑 Director Endorsed (C7)';
    badgeClass = 'bg-purple-100 text-purple-900 border-purple-400 font-bold';
    checkpointStatus = '✓ Practice Leadership Checkpoint (C7): +15% Boost (1.15x) | Floor: 80';
    strategicWhyExplanation = 'Director / Practice Head (C7) endorsement certifies practice-wide technical excellence and business value (+15% multiplier, 1.15x, floor 80+).';
    keyFactors.push(
      'Practice-Wide Oversight: Evaluated against domain benchmarks and practice objectives',
      'Concise Citation Authority Floor (80+): Director-level endorsement ensures strong contender rating'
    );
  } else if (band === 'C6') {
    badgeLabel = '👑 Sr Manager Endorsed (C6)';
    badgeClass = 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
    checkpointStatus = '✓ Senior Management Checkpoint (C6): +10% Boost (1.10x) | Floor: 76';
    strategicWhyExplanation = 'Senior Manager / Associate Director (C6) sponsorship verifies cross-squad delivery leadership (+10% multiplier, 1.10x, floor 76+).';
    keyFactors.push(
      'Cross-Team Delivery Leadership: Supervisory validation across multiple squads',
      'Concise Citation Authority Floor (76+): Elevated score floor guarantees solid honorable recognition'
    );
  } else if (band === 'C5') {
    badgeLabel = '👔 Manager Sponsored (C5)';
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
    checkpointStatus = '✓ Manager Checkpoint (C5): +5% Boost (1.05x) | Floor: 72';
    strategicWhyExplanation = 'Manager (C5) sponsorship activates the managerial weightage checkpoint (+5% multiplier, 1.05x, floor 72+), carrying verified project-level delivery oversight, SLA ownership, and appraisal accountability.';
    keyFactors.push(
      'Supervisory accountability: Manager validates client SLA impact and project milestones',
      'Weightage starts at C5: Baseline managerial checkpoint applying +5% (1.05x) progressive boost',
      'Concise Citation Authority Floor (72+): Guarantees minimum passing recognition even with concise citations'
    );
  } else if (band === 'C4') {
    badgeLabel = '👥 Tech Lead (C4)';
    badgeClass = 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
  } else if (band === 'C3') {
    badgeLabel = '👥 Sr Consultant (C3)';
    badgeClass = 'bg-slate-100 text-slate-800 border-slate-300 font-medium';
  } else if (band === 'C2') {
    badgeLabel = '👥 Engineer (C2)';
    badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
  }

  return {
    nominatorLevel: band,
    band,
    nominatorRole: meta.roleTitle,
    title: meta.roleTitle,
    isManagerSponsored: isManager,
    checkpointPassed: isManager,
    isManager: isManager && !isSenior,
    isLeadership: isSenior,
    isSeniorLeadership: isSenior,
    weightageMultiplier: meta.weightageMultiplier,
    weightMultiplier: meta.weightageMultiplier,
    boostPercentage: meta.boostPercentage,
    boostPercent: meta.boostPercentage,
    badgeLabel,
    badgeClass,
    checkpointStatus,
    strategicWhyExplanation,
    checkpointKeyFactors: keyFactors,
    authorityFloor: meta.authorityFloor
  };
}

export interface ThreeFactorsBreakdown {
  commentsAnalysis: {
    score: number; // 0 - 10
    summary: string;
    hasMetrics: boolean;
    metricsCount: number;
    charCount: number;
  };
  proofDocsAnalysis: {
    score: number; // 0 - 10
    summary: string;
    attachedCount: number;
    proofTypes: string[];
    verifiedCorroboration: boolean;
  };
  nominatorCompetencyAnalysis: {
    score: number; // 0 - 10
    level: string; // C1 - C10
    roleTitle: string;
    weightMultiplier: number;
    boostPercentage: number;
    authorityFloor: number;
    authorityFloorApplied: boolean;
    summary: string;
  };
}

export interface EvaluationResult {
  overallScore: number; // 0 - 100
  impactScore: number; // 0 - 10
  criteriaAlignmentScore: number; // 0 - 10
  citationEvidenceScore: number; // 0 - 10
  competencyScore: number; // 0 - 10
  recommendationTier: RecommendationTier;
  keyStrengths: string[];
  areasOfImprovement: string[];
  detailedRationale: string;
  criteriaMatchSummary: string;
  attachmentWarning?: boolean;
  approvalWarning?: string;
  humanOverrideScore?: number;
  humanNotes?: string;
  evaluatedAt?: string;
  managerCheckpoint?: {
    isManagerSponsored: boolean;
    nominatorLevel: string;
    boostPercentage: number;
    rationale: string;
    appliedBoostScore?: number;
  };
  threeFactorsBreakdown?: ThreeFactorsBreakdown;
}

export interface CategoryCriteriaConfig {
  category: string;
  description: string;
  defaultWeights: {
    impact: number;
    alignment: number;
    evidence: number;
    competency: number;
  };
  keyFocusAreas: string[];
}

export type ViewMode = 'all' | 'evaluated' | 'pending_evaluation' | 'top_candidates' | 'analytics' | 'config';

