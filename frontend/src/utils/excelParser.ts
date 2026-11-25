import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { NominationRecord, getAlignmentAnalysis, detectNominatorCompetency, getCompetencyCheckpoint } from '../types';

/**
 * Normalizes header keys by lowercasing and removing non-alphanumeric chars
 */
function cleanHeader(header: string): string {
  return header.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Normalizes raw internal decision string (e.g. "🟢 Winner", "Winner", "Selected", "Rejected")
 * into standard category while preserving meaning
 */
export function normalizeDecision(rawVal: string): string {
  const clean = (rawVal || '').trim();
  if (!clean) return 'Pending Review';

  const lower = clean.toLowerCase();
  if (lower.includes('winner') || lower.includes('awarded')) return 'Winner';
  if (lower.includes('shortlist') || lower.includes('finalist')) return 'Shortlisted';
  if (lower.includes('honorable') || lower.includes('mention')) return 'Honorable Mention';
  if (lower.includes('reject') || lower.includes('not selected') || lower.includes('declined') || lower.includes('disqualified')) return 'Rejected';
  if (lower.includes('under review') || lower.includes('in review') || lower.includes('hold')) return 'Under Review';
  if (lower.includes('pending') || lower.includes('tbd')) return 'Pending Review';

  return clean;
}

/**
 * Maps arbitrary raw row object to typed NominationRecord
 */
export function mapRowToNomination(rawRow: Record<string, any>, index: number): NominationRecord {
  // Build a lookup map of cleaned headers -> original values
  const cleanedMap: Record<string, any> = {};
  Object.keys(rawRow).forEach((key) => {
    const cleaned = cleanHeader(key);
    cleanedMap[cleaned] = rawRow[key];
  });

  const getVal = (...possibleKeys: string[]): string => {
    for (const key of possibleKeys) {
      const cleanKey = cleanHeader(key);
      if (cleanedMap[cleanKey] !== undefined && cleanedMap[cleanKey] !== null) {
        return String(cleanedMap[cleanKey]).trim();
      }
    }
    return '';
  };

  const nominationId = getVal('Nomination Id', 'NominationId', 'Nomination ID', 'ID') || `NOM-${1000 + index}`;
  const nominationType = getVal('Nomination Type', 'NominationType', 'Type') || 'Individual';
  const competency = getVal('Competency', 'Competencies') || 'General Technical';
  const nominationCategory = getVal('Nomination Category', 'NominationCategory', 'Category') || 'Spot Award';
  const nominationCitation = getVal('Nomination Citation', 'NominationCitation', 'Citation') || 'No citation text provided.';
  const evaluationCriteria = getVal('Evulation Criteria', 'Evaluation Criteria', 'EvulationCriteria', 'EvaluationCriteria', 'Criteria') || 'Standard evaluation guidelines apply.';
  
  const nominatedBy = getVal('Nominated By', 'NominatedBy') || 'N/A';
  const pendingWith = getVal('Pending With', 'PendingWith') || 'R&R Board';
  const primaryApproval = getVal('Primary Approval', 'PrimaryApproval') || 'Pending';
  const assignee = getVal('Assignee') || 'Unassigned';
  const primaryApproverStatus = getVal('Primary Approver Status', 'PrimaryApproverStatus') || 'In Review';
  const rrApprover = getVal('R&R Approver', 'RR Approver', 'R&RApprover') || 'N/A';
  const rrStatus = getVal('R&R Status', 'RR Status', 'R&RStatus') || 'Pending';
  const sharedServicesApprover = getVal('Shared Services Approver', 'SharedServicesApprover') || 'N/A';
  const sharedServicesStatus = getVal('Shared Services Status', 'SharedServicesStatus') || 'Pending';
  const isAttachmentUploaded = getVal('Is Attachment Uploaded', 'IsAttachmentUploaded', 'Attachment Uploaded') || 'No';
  const nomineeLocation = getVal('NomnieeLocation', 'Nominee Location', 'NomineeLocation', 'Location') || 'Offshore';
  const nomineeBaseLocation = getVal('NomnieeBaseLocation', 'Nominee Base Location', 'NomneeBaseLocation', 'Base Location') || nomineeLocation;
  const contributionFor = getVal('Contribution For', 'ContributionFor') || 'Project Contribution';
  const contributionInfo = getVal('Contribution Info', 'ContributionInfo') || '';
  const nomineeName = getVal('Nominee Name', 'NomineeName', 'Name') || `Nominee #${index + 1}`;
  const nomineeId = getVal('Nominee ID', 'NomineeID', 'Employee ID') || `EMP-${2000 + index}`;
  const buOfNominee = getVal('BU of the nominee', 'BU of nominee', 'BU', 'Business Unit') || 'General Practice';
  const doj = getVal('DOJ', 'Date of Joining') || 'N/A';
  const practice = getVal('Practice') || 'General Practice';

  // Extract Nominator Competency Level (C1 to C9)
  const rawNominatorBand = getVal(
    'Nominator Competency',
    'NominatorCompetency',
    'Nominator Band',
    'NominatorBand',
    'Nominator Level',
    'NominatorLevel',
    'Nominator Grade',
    'Manager Level',
    'Manager Band',
    'Competency of Nominator'
  );
  const nominatorCompetency = detectNominatorCompetency(nominatedBy, rawNominatorBand);
  const rawNomineeBand = getVal('Nominee Band', 'Nominee Level', 'Band', 'Grade');
  
  // Extract and normalize Internal Human / Committee Decision if present in the spreadsheet
  const rawDecision = getVal(
    'Internal Decision',
    'InternalDecision',
    'Final Decision',
    'FinalDecision',
    'Committee Decision',
    'CommitteeDecision',
    'Award Decision',
    'Selection Status',
    'Human Decision',
    'Decision',
    'Award Status',
    'Result'
  );

  const internalDecision = normalizeDecision(rawDecision);

  return {
    id: `rec-${index}-${Date.now()}`,
    nominationId,
    nominationType,
    competency,
    nominationCategory,
    nominationCitation,
    evaluationCriteria,
    nominatedBy,
    nominatorCompetency,
    nomineeBand: rawNomineeBand || undefined,
    pendingWith,
    primaryApproval,
    assignee,
    primaryApproverStatus,
    rrApprover,
    rrStatus,
    sharedServicesApprover,
    sharedServicesStatus,
    isAttachmentUploaded,
    nomineeLocation,
    nomineeBaseLocation,
    contributionFor,
    contributionInfo,
    nomineeName,
    nomineeId,
    buOfNominee,
    doj,
    practice,
    internalDecision
  };
}

/**
 * Parses XLSX / XLS / CSV file input buffer or File object
 */
export async function parseSpreadsheetFile(file: File): Promise<NominationRecord[]> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  if (fileExt === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const records = (results.data as Record<string, any>[]).map((row, idx) =>
              mapRowToNomination(row, idx)
            );
            resolve(records);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err)
      });
    });
  } else {
    // XLSX or XLS
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
    
    return rawRows.map((row, idx) => mapRowToNomination(row, idx));
  }
}

/**
 * Exports evaluated nominations to an Excel workbook with full 25 original columns + Internal Decision + AI evaluation scores + Alignment column
 */
export function exportEvaluatedToExcel(records: NominationRecord[], filename = 'Nomination_Evaluations.xlsx') {
  const exportRows = records.map((rec) => {
    const alignment = getAlignmentAnalysis(rec);
    const checkpoint = getCompetencyCheckpoint(rec);

    return {
      'Nomination Id': rec.nominationId,
      'Nomination Type': rec.nominationType,
      'Competency': rec.competency,
      'Nomination Category': rec.nominationCategory,
      'Nomination Citation': rec.nominationCitation,
      'Evulation Criteria': rec.evaluationCriteria,
      'Nominated By': rec.nominatedBy,
      'Pending With': rec.pendingWith,
      'Primary Approval': rec.primaryApproval,
      'Assignee': rec.assignee,
      'Primary Approver Status': rec.primaryApproverStatus,
      'R&R Approver': rec.rrApprover,
      'R&R Status': rec.rrStatus,
      'Shared Services Approver': rec.sharedServicesApprover,
      'Shared Services Status': rec.sharedServicesStatus,
      'Is Attachment Uploaded': rec.isAttachmentUploaded,
      'NomnieeLocation': rec.nomineeLocation,
      'NomnieeBaseLocation': rec.nomineeBaseLocation,
      'Contribution For': rec.contributionFor,
      'Contribution Info': rec.contributionInfo,
      'Nominee Name': rec.nomineeName,
      'Nominee ID': rec.nomineeId,
      'BU of the nominee': rec.buOfNominee,
      'DOJ': rec.doj,
      'Practice': rec.practice,

      // Internal Human Decision Column
      'Internal Decision (Human)': rec.internalDecision || 'Pending Review',

      // Competency & Managerial Checkpoint (C1-C9)
      'Nominator Competency Level': checkpoint.nominatorLevel,
      'Nominator Role Title': checkpoint.nominatorRole,
      'Manager Checkpoint (C5/C6+)': checkpoint.checkpointStatus,
      'Weightage Boost Multiplier': `${checkpoint.weightageMultiplier}x (+${checkpoint.boostPercentage}%)`,
      'Why Score is Higher': checkpoint.strategicWhyExplanation,

      // AI vs Human Alignment Analysis
      'AI vs Human Alignment': alignment.label,
      'Alignment Category': alignment.category,
      'Alignment Analysis Rationale': alignment.explanation,

      // AI Evaluation Columns
      'AI Overall Score (0-100)': rec.evaluation ? rec.evaluation.overallScore : 'Not Evaluated',
      'Final Override Score': rec.evaluation?.humanOverrideScore ?? (rec.evaluation ? rec.evaluation.overallScore : 'N/A'),
      'Recommendation Tier': rec.evaluation ? rec.evaluation.recommendationTier : 'Pending',
      'Business Impact Score (0-10)': rec.evaluation ? rec.evaluation.impactScore : 'N/A',
      'Criteria Alignment Score (0-10)': rec.evaluation ? rec.evaluation.criteriaAlignmentScore : 'N/A',
      'Citation Evidence Score (0-10)': rec.evaluation ? rec.evaluation.citationEvidenceScore : 'N/A',
      'Competency Score (0-10)': rec.evaluation ? rec.evaluation.competencyScore : 'N/A',
      'Key Strengths': rec.evaluation ? rec.evaluation.keyStrengths.join(' | ') : 'N/A',
      'Evaluation Rationale': rec.evaluation ? rec.evaluation.detailedRationale : 'N/A',
      'Evaluator Notes': rec.evaluation?.humanNotes || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  
  // Set column widths
  const colWidths = Object.keys(exportRows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 2, 20)
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'R&R Evaluated & Aligned');

  XLSX.writeFile(workbook, filename);
}

/**
 * Generates and downloads a clean sample Excel template with all supported columns,
 * specifically including 'Nominated By' and 'Nominator_competency' (C1 - C10).
 */
export function downloadSampleTemplateExcel(filename = 'Nomination_Template_With_Competencies.xlsx') {
  const sampleRows = [
    {
      'Nomination Id': 'RR-90412',
      'Nomination Type': 'Individual',
      'Nominee Name': 'Priya Nair',
      'Nominee ID': 'EMP-2089',
      'Nominee Band': 'C3',
      'Nominated By': 'Rajesh Sharma',
      'Nominator_competency': 'C7',
      'Nomination Category': 'Innovation Champion',
      'Competency': 'Cloud Architecture & GenAI',
      'Nomination Citation': 'Priya conceptualized and deployed an automated LLM code review pipeline across 14 active client repositories. This innovation reduced pre-prod QA cycle times from 18 hours to 45 minutes, saving $120k annually.',
      'Evulation Criteria': '1. Measurable efficiency/cost savings\n2. Technical originality and scalability\n3. Adoption across practice',
      'Internal Decision': 'Winner',
      'BU of the nominee': 'Financial Services BU',
      'Practice': 'Cloud & DevOps',
      'NomnieeLocation': 'Offshore - Bangalore',
      'NomnieeBaseLocation': 'Bangalore DC-2',
      'Contribution For': 'Enterprise LLM Automation Initiative',
      'Contribution Info': 'Q2 Delivery Excellence Milestone',
      'Primary Approval': 'Approved',
      'Assignee': 'Ananya Verma',
      'Primary Approver Status': 'Approved - High Impact Citation',
      'R&R Approver': 'Kiran Patel',
      'R&R Status': 'Pending Review',
      'Shared Services Approver': 'Meera Nair',
      'Shared Services Status': 'Verified',
      'Is Attachment Uploaded': 'Yes',
      'DOJ': '2021-03-15'
    },
    {
      'Nomination Id': 'RR-90413',
      'Nomination Type': 'Individual',
      'Nominee Name': 'Marcus Vance',
      'Nominee ID': 'EMP-3142',
      'Nominee Band': 'C4',
      'Nominated By': 'Elena Rostova',
      'Nominator_competency': 'C5',
      'Nomination Category': 'Star of the Quarter',
      'Competency': 'Fintech Core Banking',
      'Nomination Citation': 'Marcus led the emergency migration of payment settlement engine for Tier-1 banking client over Memorial Day weekend, zero customer downtime and zero settlement batch drops.',
      'Evulation Criteria': '1. Sustained excellence and client impact\n2. High urgency execution\n3. Leadership under pressure',
      'Internal Decision': 'Winner',
      'BU of the nominee': 'Banking BU',
      'Practice': 'Fintech Core Systems',
      'NomnieeLocation': 'Onsite - London',
      'NomnieeBaseLocation': 'London UK',
      'Contribution For': 'Core Payment Engine Migration',
      'Contribution Info': 'Critical client delivery',
      'Primary Approval': 'Approved',
      'Assignee': 'David Kim',
      'Primary Approver Status': 'Approved - High Priority',
      'R&R Approver': 'Sarah Jenkins',
      'R&R Status': 'Shortlisted',
      'Shared Services Approver': 'Anita Roy',
      'Shared Services Status': 'Verified',
      'Is Attachment Uploaded': 'Yes',
      'DOJ': '2019-08-12'
    },
    {
      'Nomination Id': 'RR-90414',
      'Nomination Type': 'Individual',
      'Nominee Name': 'Kavita Sundaram',
      'Nominee ID': 'EMP-5521',
      'Nominee Band': 'C2',
      'Nominated By': 'Deepak Verma',
      'Nominator_competency': 'C3',
      'Nomination Category': 'Spot Award',
      'Competency': 'Frontend Web Platforms',
      'Nomination Citation': 'Resolved critical accessibility WCAG 2.1 AAA compliance blocker within 36 hours prior to product public launch.',
      'Evulation Criteria': '1. Rapid response\n2. Overcoming high urgency\n3. Positive client feedback',
      'Internal Decision': 'Shortlisted',
      'BU of the nominee': 'Healthcare & Life Sciences',
      'Practice': 'Experience Engineering',
      'NomnieeLocation': 'Offshore - Hyderabad',
      'NomnieeBaseLocation': 'Hyderabad SEZ',
      'Contribution For': 'Patient Portal Accessibility Compliance',
      'Contribution Info': 'Pre-launch sprint blocker fix',
      'Primary Approval': 'Approved',
      'Assignee': 'David Kim',
      'Primary Approver Status': 'Approved',
      'R&R Approver': 'Sarah Jenkins',
      'R&R Status': 'Shortlisted',
      'Shared Services Approver': 'Anita Roy',
      'Shared Services Status': 'Verified',
      'Is Attachment Uploaded': 'No',
      'DOJ': '2023-01-10'
    },
    {
      'Nomination Id': 'RR-90415',
      'Nomination Type': 'Individual',
      'Nominee Name': 'Rohan Deshmukh',
      'Nominee ID': 'EMP-8812',
      'Nominee Band': 'C3',
      'Nominated By': 'Dr. Vikram Malhotra (EVP & Global Delivery Head)',
      'Nominator_competency': 'C10',
      'Nomination Category': 'Customer Excellence',
      'Competency': 'Enterprise Modernization',
      'Nomination Citation': 'Exceptional support during critical executive client steering committee deliverables.',
      'Evulation Criteria': '1. Customer retention\n2. Delivery excellence\n3. Professional responsiveness',
      'Internal Decision': 'Winner',
      'BU of the nominee': 'Enterprise Solutions BU',
      'Practice': 'Digital Transformation',
      'NomnieeLocation': 'Offshore - Pune',
      'NomnieeBaseLocation': 'Pune Tech Park',
      'Contribution For': 'Executive Steering Committee Support',
      'Contribution Info': 'High-stakes client delivery',
      'Primary Approval': 'Approved',
      'Assignee': 'Ananya Verma',
      'Primary Approver Status': 'Approved - Executive Endorsement',
      'R&R Approver': 'Kiran Patel',
      'R&R Status': 'Winner',
      'Shared Services Approver': 'Meera Nair',
      'Shared Services Status': 'Verified',
      'Is Attachment Uploaded': 'Yes',
      'DOJ': '2022-06-01'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const colWidths = Object.keys(sampleRows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 3, 20)
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Nominations Template');
  XLSX.writeFile(workbook, filename);
}


