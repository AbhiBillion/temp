import React, { useState } from 'react';
import { NominationRecord, COMPETENCY_LADDER, CompetencyBand } from '../types';
import { X, Plus, Save, Briefcase, Award } from 'lucide-react';

interface AddNominationModalProps {
  onClose: () => void;
  onAdd: (nomination: NominationRecord) => void;
}

export const AddNominationModal: React.FC<AddNominationModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState<Partial<NominationRecord>>({
    nominationId: `RR-${Math.floor(10000 + Math.random() * 90000)}`,
    nominationType: 'Individual',
    competency: 'Digital Engineering',
    nominationCategory: 'Spot Award',
    nominationCitation: '',
    evaluationCriteria: '1. Measurable efficiency/cost savings\n2. Technical originality\n3. Evidence attached',
    nominatedBy: '',
    nominatorCompetency: 'C5',
    nomineeBand: 'C2',
    pendingWith: 'Primary Approver',
    primaryApproval: 'Pending',
    assignee: 'HR Manager',
    primaryApproverStatus: 'In Review',
    rrApprover: 'R&R Committee Lead',
    rrStatus: 'Pending',
    sharedServicesApprover: 'Shared Services Lead',
    sharedServicesStatus: 'Pending',
    isAttachmentUploaded: 'Yes',
    nomineeLocation: 'Bengaluru',
    nomineeBaseLocation: 'Bengaluru (IN-BLR-01)',
    contributionFor: 'Project Vanguard',
    contributionInfo: '',
    nomineeName: '',
    nomineeId: `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
    buOfNominee: 'AI & Cloud Solutions',
    doj: '2023-01-15',
    practice: 'Generative AI'
  });

  const handleChange = (field: keyof NominationRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomineeName || !formData.nominationCitation) {
      alert('Please fill in required fields: Nominee Name and Citation.');
      return;
    }

    const newRecord: NominationRecord = {
      id: `rec-${Date.now()}`,
      nominationId: formData.nominationId || `RR-${Date.now()}`,
      nominationType: formData.nominationType || 'Individual',
      competency: formData.competency || 'General',
      nominationCategory: formData.nominationCategory || 'Spot Award',
      nominationCitation: formData.nominationCitation || '',
      evaluationCriteria: formData.evaluationCriteria || '',
      nominatedBy: formData.nominatedBy || 'N/A',
      nominatorCompetency: formData.nominatorCompetency || 'C5',
      nomineeBand: formData.nomineeBand || 'C2',
      pendingWith: formData.pendingWith || 'R&R Committee',
      primaryApproval: formData.primaryApproval || 'Pending',
      assignee: formData.assignee || 'Unassigned',
      primaryApproverStatus: formData.primaryApproverStatus || 'Pending',
      rrApprover: formData.rrApprover || 'N/A',
      rrStatus: formData.rrStatus || 'Pending',
      sharedServicesApprover: formData.sharedServicesApprover || 'N/A',
      sharedServicesStatus: formData.sharedServicesStatus || 'Pending',
      isAttachmentUploaded: formData.isAttachmentUploaded || 'Yes',
      nomineeLocation: formData.nomineeLocation || 'Offshore',
      nomineeBaseLocation: formData.nomineeBaseLocation || 'Offshore',
      contributionFor: formData.contributionFor || 'Project Impact',
      contributionInfo: formData.contributionInfo || '',
      nomineeName: formData.nomineeName || 'Nominee',
      nomineeId: formData.nomineeId || `EMP-${Date.now()}`,
      buOfNominee: formData.buOfNominee || 'General',
      doj: formData.doj || '2023-01-01',
      practice: formData.practice || 'General'
    };

    onAdd(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add New R&R Nomination Record</span>
            </h2>
            <p className="text-xs text-slate-400">
              Enter candidate details, category, evaluation criteria, and citation text
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nominee Name *</label>
              <input
                type="text"
                required
                value={formData.nomineeName}
                onChange={(e) => handleChange('nomineeName', e.target.value)}
                placeholder="e.g. Priya Sundaram"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nominee Employee ID *</label>
              <input
                type="text"
                required
                value={formData.nomineeId}
                onChange={(e) => handleChange('nomineeId', e.target.value)}
                placeholder="EMP-12345"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nomination ID</label>
              <input
                type="text"
                value={formData.nominationId}
                onChange={(e) => handleChange('nominationId', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nomination Category</label>
              <select
                value={formData.nominationCategory}
                onChange={(e) => handleChange('nominationCategory', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="Spot Award">Spot Award</option>
                <option value="Star of the Quarter">Star of the Quarter</option>
                <option value="Innovation Champion">Innovation Champion</option>
                <option value="Customer Excellence">Customer Excellence</option>
                <option value="Leadership & Mentorship">Leadership & Mentorship</option>
                <option value="Team Player / Collaboration">Team Player / Collaboration</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Competency</label>
              <input
                type="text"
                value={formData.competency}
                onChange={(e) => handleChange('competency', e.target.value)}
                placeholder="e.g. Cloud & GenAI"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Business Unit (BU)</label>
              <input
                type="text"
                value={formData.buOfNominee}
                onChange={(e) => handleChange('buOfNominee', e.target.value)}
                placeholder="AI & Cloud Solutions"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nominated By</label>
              <input
                type="text"
                value={formData.nominatedBy}
                onChange={(e) => handleChange('nominatedBy', e.target.value)}
                placeholder="e.g. Delivery Lead"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nominator Level (C1–C10)
              </label>
              <select
                value={formData.nominatorCompetency || 'C5'}
                onChange={(e) => handleChange('nominatorCompetency', e.target.value)}
                className="w-full px-3 py-1.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-amber-50/50 font-medium"
              >
                {(Object.keys(COMPETENCY_LADDER) as CompetencyBand[]).map((band) => {
                  const b = COMPETENCY_LADDER[band];
                  return (
                    <option key={band} value={band}>
                      {band} - {b.title} ({b.boostPercent > 0 ? `+${b.boostPercent}% Boost` : '1.0x'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nominee Career Band
              </label>
              <select
                value={formData.nomineeBand || 'C2'}
                onChange={(e) => handleChange('nomineeBand', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
              >
                {(Object.keys(COMPETENCY_LADDER) as CompetencyBand[]).map((band) => {
                  const b = COMPETENCY_LADDER[band];
                  return (
                    <option key={band} value={band}>
                      {band} - {b.title}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Practice</label>
              <input
                type="text"
                value={formData.practice}
                onChange={(e) => handleChange('practice', e.target.value)}
                placeholder="e.g. Generative AI"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Attachment Uploaded</label>
              <select
                value={formData.isAttachmentUploaded as string}
                onChange={(e) => handleChange('isAttachmentUploaded', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="Yes">Yes (Evidence Attached)</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nomination Citation *</label>
            <textarea
              required
              rows={3}
              value={formData.nominationCitation}
              onChange={(e) => handleChange('nominationCitation', e.target.value)}
              placeholder="Provide detailed description of the nominee's contribution, metrics, impact, and effort..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Evulation Criteria (Evaluation Guidelines)</label>
            <textarea
              rows={2}
              value={formData.evaluationCriteria}
              onChange={(e) => handleChange('evaluationCriteria', e.target.value)}
              placeholder="Evaluation rules to rate this nomination against..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow transition flex items-center space-x-1"
            >
              <Save className="w-4 h-4" />
              <span>Save Candidate</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
