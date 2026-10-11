import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCases } from '../services/api';
import type { Case } from '../services/api';

export const CasesList: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-space-md">
        <div>
          <h1 className="font-headline-xl text-[24px] text-on-surface font-semibold tracking-tight">Active Investigations</h1>
          <p className="text-[12px] font-data-mono text-outline mt-1">Managing {cases.length} localized forensic case(s) with verifiable provenance.</p>
        </div>
        <Link to="/cases/new" className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-on-primary font-data-mono text-[11px] font-bold uppercase tracking-wider hover:bg-primary-fixed transition-colors shadow-[0_0_12px_rgba(56,189,248,0.3)]">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Case
        </Link>
      </div>

      <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded border border-outline-variant">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">search</span>
          <input className="w-full bg-surface-container-lowest border border-outline-variant rounded pl-9 pr-14 py-2 text-data-mono text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all text-[12px]" placeholder="Search case ID, title..." type="text"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md mt-space-md">
        {loading ? (
          <p className="text-on-surface">Loading cases...</p>
        ) : cases.length === 0 ? (
          <p className="text-outline">No cases found.</p>
        ) : cases.map(c => (
          <div key={c.id} className="case-card rounded bg-surface-container-low border border-outline-variant hover:border-primary/50 transition-all p-space-md flex flex-col justify-between group shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/60">
                <div className="flex items-center gap-1.5">
                  <span className="font-data-mono text-[14px] text-primary font-bold tracking-tight">[{c.case_number}]</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary font-data-mono text-[10px] font-semibold">{c.status}</span>
              </div>
              
              <h3 className="font-headline-md text-[15px] font-semibold text-on-surface mt-2.5 group-hover:text-primary transition-colors truncate">
                {c.title}
              </h3>
              <div className="text-[10px] font-data-mono text-outline mt-0.5">{c.description || 'No description provided.'}</div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
              <span className="text-[10px] font-data-mono text-outline">Created: {new Date(c.created_at).toLocaleDateString()}</span>
              <Link to={`/cases/${c.id}`} className="flex items-center gap-1 text-primary text-[11px] font-data-mono uppercase font-bold tracking-wider hover:text-primary-fixed-dim transition-colors group-hover:translate-x-1 duration-300">
                Open Case <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
