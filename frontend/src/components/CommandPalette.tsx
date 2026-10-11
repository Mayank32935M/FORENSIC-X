import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaseContext } from '../context/CaseContext';
import { globalSearch } from '../services/api';
import type { GlobalSearchResponse } from '../services/api';

export const CommandPalette: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setActiveCaseId } = useCaseContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      globalSearch(query)
        .then(setResults)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  const handleSelectCase = (caseId: string) => {
    setActiveCaseId(caseId);
    navigate(`/cases/${caseId}`);
    setIsSearchOpen(false);
  };

  const handleSelectEvidence = (caseId: string) => {
    setActiveCaseId(caseId);
    navigate(`/evidence`);
    setIsSearchOpen(false);
  };

  const handleSelectEvent = (caseId: string) => {
    setActiveCaseId(caseId);
    navigate(`/timeline`);
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container-low border border-primary/50 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/60 bg-surface-container">
          <span className="material-symbols-outlined text-primary text-[22px]">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search forensic artifacts, SHA-256 hashes, events, serials... (Esc to close)"
            className="w-full bg-transparent text-on-surface placeholder:text-outline text-sm font-data-mono focus:outline-none"
          />
          {loading && <span className="material-symbols-outlined text-primary animate-spin text-[18px]">sync</span>}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-[10px] font-data-mono text-outline">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 space-y-4 text-xs font-data-mono flex-1">
          {query.trim().length < 2 ? (
            /* Quick Forensic Navigation Shortcuts */
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-outline tracking-wider px-2">
                Quick Forensic Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { navigate('/'); setIsSearchOpen(false); }}
                  className="flex items-center gap-2 p-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-primary text-[18px]">grid_view</span>
                  <div>
                    <div className="font-bold text-on-surface">System Pipeline Dashboard</div>
                    <div className="text-[10px] text-outline">Real-time telemetry</div>
                  </div>
                </button>
                <button
                  onClick={() => { navigate('/evidence'); setIsSearchOpen(false); }}
                  className="flex items-center gap-2 p-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-cyan-400 text-[18px]">inventory_2</span>
                  <div>
                    <div className="font-bold text-on-surface">Evidence Repository</div>
                    <div className="text-[10px] text-outline">SHA-256 hash matrix</div>
                  </div>
                </button>
                <button
                  onClick={() => { navigate('/timeline'); setIsSearchOpen(false); }}
                  className="flex items-center gap-2 p-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-verified text-[18px]">schedule</span>
                  <div>
                    <div className="font-bold text-on-surface">Temporal Event Timeline</div>
                    <div className="text-[10px] text-outline">Incident delta mapping</div>
                  </div>
                </button>
                <button
                  onClick={() => { navigate('/cases/new'); setIsSearchOpen(false); }}
                  className="flex items-center gap-2 p-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-amber-400 text-[18px]">add_circle</span>
                  <div>
                    <div className="font-bold text-on-surface">Intake New Investigation</div>
                    <div className="text-[10px] text-outline">Register new dossier</div>
                  </div>
                </button>
              </div>
            </div>
          ) : results && (results.cases.length > 0 || results.evidence.length > 0 || results.events.length > 0) ? (
            <div className="space-y-4">
              {/* Cases Results */}
              {results.cases.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-primary tracking-wider px-2 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">folder_open</span>
                    Investigations ({results.cases.length})
                  </div>
                  <div className="space-y-1">
                    {results.cases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCase(c.id)}
                        className="cursor-pointer p-2 rounded bg-surface-container hover:bg-primary/10 border border-outline-variant/50 hover:border-primary/50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-bold">[{c.case_number}]</span>
                          <span className="text-on-surface font-semibold">{c.title}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[9px] uppercase">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Results */}
              {results.evidence.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider px-2 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                    Evidence Artifacts ({results.evidence.length})
                  </div>
                  <div className="space-y-1">
                    {results.evidence.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => handleSelectEvidence(e.case_id)}
                        className="cursor-pointer p-2 rounded bg-surface-container hover:bg-cyan-500/10 border border-outline-variant/50 hover:border-cyan-500/50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="text-on-surface font-bold">{e.original_filename}</div>
                          <div className="text-[10px] text-outline truncate max-w-md">
                            SHA-256: {e.hash_sha256 || 'None'}
                          </div>
                        </div>
                        <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-0.5">
                          Inspect <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Event Results */}
              {results.events.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-verified tracking-wider px-2 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    Timeline Events ({results.events.length})
                  </div>
                  <div className="space-y-1">
                    {results.events.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectEvent(t.case_id)}
                        className="cursor-pointer p-2 rounded bg-surface-container hover:bg-verified/10 border border-outline-variant/50 hover:border-verified/50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="text-on-surface font-semibold">{t.summary}</div>
                          <div className="text-[10px] text-outline">
                            {new Date(t.time).toUTCString()} • Type: {t.event_type}
                          </div>
                        </div>
                        <span className="text-[10px] text-verified font-bold flex items-center gap-0.5">
                          View <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-outline">
              <span className="material-symbols-outlined text-3xl mb-1">search_off</span>
              <p>No matching forensic artifacts, hashes, or events found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-surface-container border-t border-outline-variant/60 flex items-center justify-between text-[10px] text-outline">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-primary font-semibold">FORENSIC-X Unified Index</span>
        </div>
      </div>
    </div>
  );
};
