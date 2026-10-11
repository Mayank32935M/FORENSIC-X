import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../services/api';

export const CreateCase: React.FC = () => {
  const [title, setTitle] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCase({ title, case_number: caseNumber, description });
      navigate('/cases');
    } catch (err: any) {
      setError(err.message || 'Failed to create case');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3 py-2 w-full">
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-lg p-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded bg-primary/20 border border-primary text-primary flex items-center justify-center font-data-mono font-bold text-xs shrink-0 shadow-sm shadow-primary/30">01</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-md font-bold text-[12px] text-primary uppercase tracking-wider">Investigation Details</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/15 border border-primary/40 text-primary text-[9px] font-data-mono font-bold uppercase">Active</span>
              </div>
              <div className="text-[10px] text-on-surface-variant font-data-mono truncate">Identifiers & Scope</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 space-y-3">
          <form onSubmit={handleSubmit} className="bg-surface-container-low border border-outline-variant/70 rounded-lg p-4 space-y-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-outline-variant/50 pb-2">
              <div className="flex items-center gap-1.5 text-on-surface font-headline-md font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">article</span>
                Case Initial Configuration
              </div>
            </div>
            
            {error && (
              <div className="p-2 bg-error/10 border border-error/50 rounded text-error text-[11px] font-data-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center justify-between text-[10px] font-data-mono text-outline uppercase tracking-wider font-bold">
                  <span>Case Tracking Number <span className="text-error">*</span></span>
                </label>
                <input 
                  type="text" 
                  value={caseNumber}
                  onChange={e => setCaseNumber(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-[12px] font-data-mono text-on-surface placeholder:text-outline-variant/80 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all" 
                  placeholder="e.g. INS-2026-0042" 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center justify-between text-[10px] font-data-mono text-outline uppercase tracking-wider font-bold">
                  <span>Case Title <span className="text-error">*</span></span>
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-[12px] font-headline-md font-semibold text-on-surface placeholder:text-outline-variant/80 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all" 
                  placeholder="Unauthorized Access Investigation" 
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="flex items-center justify-between text-[10px] font-data-mono text-outline uppercase tracking-wider font-bold">
                <span>Description & Objectives</span>
              </label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full h-24 bg-surface-container-highest border border-outline-variant rounded p-2 text-[12px] font-data-mono text-on-surface placeholder:text-outline-variant/80 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all resize-y" 
                placeholder="State the primary objective, known subjects, and incident timeline..."
              ></textarea>
            </div>

            <div className="pt-3 border-t border-outline-variant/50 flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={() => navigate('/cases')}
                className="px-4 py-2 rounded bg-surface-container border border-outline-variant text-on-surface-variant font-data-mono text-[11px] font-bold uppercase tracking-wider hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-on-primary font-data-mono text-[11px] font-bold uppercase tracking-wider hover:bg-primary-fixed transition-colors shadow-[0_0_12px_rgba(56,189,248,0.3)]"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Initialize Case
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="bg-surface-container border border-outline-variant/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-on-surface font-headline-md font-bold text-[11px] uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Cryptographic Commitment
            </div>
            <p className="text-[10px] font-data-mono text-outline leading-relaxed">
              Upon initialization, this case will be permanently inscribed into the local chain of custody ledger. The Case ID, Tracking Number, and initialization timestamp will form the Genesis Block of the investigation's hash chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
