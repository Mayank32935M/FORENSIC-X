import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCases } from '../services/api';
import { useCaseContext } from '../context/CaseContext';
import type { Case } from '../services/api';

export const CasesList: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'in_progress' | 'open' | 'closed'>('ALL');
  const { setActiveCaseId } = useCaseContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status.toLowerCase() !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.case_number.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenCase = (caseId: string) => {
    setActiveCaseId(caseId);
    navigate(`/cases/${caseId}`);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-space-md">
        <div>
          <h1 className="font-headline-xl text-[24px] text-on-surface font-semibold tracking-tight">
            Active Investigations
          </h1>
          <p className="text-[12px] font-data-mono text-outline mt-1">
            Managing {cases.length} localized forensic investigation dossier(s) with verifiable provenance.
          </p>
        </div>
        <Link
          to="/cases/new"
          className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-on-primary font-data-mono text-[11px] font-bold uppercase tracking-wider hover:bg-sky-300 transition-colors shadow-[0_0_12px_rgba(56,189,248,0.3)]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Case Intake
        </Link>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-low p-space-md rounded-lg border border-outline-variant">
        <div className="relative flex items-center flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded pl-9 pr-8 py-2 text-data-mono text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all text-[12px]"
            placeholder="Filter by Case ID, title, keywords..."
            type="text"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-outline hover:text-on-surface p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 font-data-mono text-xs overflow-x-auto">
          <span className="text-outline text-[10px] uppercase font-bold mr-1">Status:</span>
          {(['ALL', 'in_progress', 'open', 'closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors ${
                statusFilter === st
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/40'
              }`}
            >
              {st === 'ALL' ? 'All Cases' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md mt-space-md">
        {loading ? (
          <p className="text-on-surface font-data-mono text-xs py-8">Loading case index...</p>
        ) : filteredCases.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-surface-container-low rounded-xl border border-outline-variant font-data-mono text-xs text-outline space-y-2">
            <span className="material-symbols-outlined text-3xl">search_off</span>
            <p>No investigation dossiers match your query "{searchQuery}".</p>
          </div>
        ) : (
          filteredCases.map((c) => (
            <div
              key={c.id}
              onClick={() => handleOpenCase(c.id)}
              className="cursor-pointer case-card rounded-lg bg-surface-container-low border border-outline-variant hover:border-primary/50 transition-all p-space-md flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-data-mono text-[14px] text-primary font-bold tracking-tight">
                      [{c.case_number}]
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-data-mono text-[10px] font-semibold uppercase border ${
                      c.status === 'in_progress'
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-surface-container-high border-outline-variant text-outline'
                    }`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-headline-md text-[15px] font-semibold text-on-surface mt-2.5 group-hover:text-primary transition-colors truncate">
                  {c.title}
                </h3>
                <div className="text-[11px] font-data-mono text-outline mt-1 line-clamp-2">
                  {c.description || 'No description provided.'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                <span className="text-[10px] font-data-mono text-outline">
                  Created: {new Date(c.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1 text-primary text-[11px] font-data-mono uppercase font-bold tracking-wider group-hover:translate-x-1 duration-300">
                  Open Case <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
