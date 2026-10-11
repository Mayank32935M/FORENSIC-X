import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHealth, fetchCases, fetchEvidence, fetchTimeline } from '../services/api';
import { useCaseContext } from '../context/CaseContext';
import type { HealthResponse, Case, EvidenceItem, TimelineEvent } from '../services/api';

export const Dashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveCaseId, setIsHealthModalOpen, setIsSearchOpen } = useCaseContext();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetchHealth().catch(() => null),
      fetchCases().catch(() => []),
      fetchEvidence().catch(() => []),
      fetchTimeline().catch(() => []),
    ]).then(([healthData, casesData, evidenceData, timelineData]) => {
      setHealth(healthData);
      setCases(casesData);
      setEvidence(evidenceData);
      setTimeline(timelineData);
      setLoading(false);
    });
  }, []);

  const handleOpenCase = (caseId: string) => {
    setActiveCaseId(caseId);
    navigate(`/cases/${caseId}`);
  };

  return (
    <div className="space-y-4">
      {/* System Pipeline Section */}
      <section className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-outline-variant/40">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
            <span className="text-[11px] font-data-mono uppercase tracking-wider text-on-surface font-semibold">
              Live System Pipeline Telemetry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="px-2 py-0.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/80 rounded font-data-mono text-[9px] text-primary tracking-wider font-semibold cursor-pointer transition-colors"
            >
              NODE 0x9AF4 // SHA-256 DAEMON
            </button>
            <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-verified animate-ping' : 'bg-amber-400'}`}></span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2">
          {/* Node 1: Backend Core */}
          <div
            onClick={() => setIsHealthModalOpen(true)}
            className="cursor-pointer bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-verified"></span>
              </span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Backend Core</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">
                  {health ? `v${health.version} (${health.environment})` : 'Connecting...'}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">memory</span>
          </div>
          
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-primary shadow-[0_0_8px_#38bdf8] pipeline-packet"></div>
          </div>
          
          {/* Node 2: SQLite Database */}
          <div
            onClick={() => setIsHealthModalOpen(true)}
            className="cursor-pointer bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.database === 'connected' ? 'bg-verified' : 'bg-red-400'} shrink-0`}></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Database (SQLite)</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">
                  {health?.database === 'connected' ? 'Connected' : 'Offline'}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">database</span>
          </div>
          
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-verified shadow-[0_0_8px_#10b981] pipeline-packet-delayed"></div>
          </div>
          
          {/* Node 3: Evidence Store */}
          <Link
            to="/evidence"
            className="bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-verified shrink-0"></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Evidence Store</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">{evidence.length} Files Seeded</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">hard_drive</span>
          </Link>
          
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-primary shadow-[0_0_8px_#38bdf8] pipeline-packet-delayed-2"></div>
          </div>
          
          {/* Node 4: Cryptographic Ledger */}
          <Link
            to="/timeline"
            className="bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-verified shrink-0"></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Hash Ledger</div>
                <div className="text-[10px] font-data-mono text-verified font-bold">SHA-256 Valid</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">lock</span>
          </Link>
        </div>
      </section>
      
      {/* Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
        <Link
          to="/cases"
          className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-all rounded-xl p-4 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-outline text-[11px] font-data-mono uppercase font-semibold">
            <span>Active Cases</span>
            <span className="material-symbols-outlined text-primary text-[18px]">folder_open</span>
          </div>
          <div className="text-3xl font-bold font-headline-xl text-on-surface my-2">
            {loading ? '-' : cases.length}
          </div>
          <div className="text-[11px] font-data-mono text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
            Browse Cases <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </Link>

        <Link
          to="/evidence"
          className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 hover:border-cyan-400/50 transition-all rounded-xl p-4 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-outline text-[11px] font-data-mono uppercase font-semibold">
            <span>Seized Evidence</span>
            <span className="material-symbols-outlined text-cyan-400 text-[18px]">inventory_2</span>
          </div>
          <div className="text-3xl font-bold font-headline-xl text-on-surface my-2">
            {loading ? '-' : evidence.length}
          </div>
          <div className="text-[11px] font-data-mono text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
            Evidence Matrix <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </Link>

        <Link
          to="/timeline"
          className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 hover:border-verified/50 transition-all rounded-xl p-4 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-outline text-[11px] font-data-mono uppercase font-semibold">
            <span>Temporal Events</span>
            <span className="material-symbols-outlined text-verified text-[18px]">schedule</span>
          </div>
          <div className="text-3xl font-bold font-headline-xl text-on-surface my-2">
            {loading ? '-' : timeline.length}
          </div>
          <div className="text-[11px] font-data-mono text-verified group-hover:translate-x-1 transition-transform flex items-center gap-1">
            View Timeline <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </Link>

        <div
          onClick={() => setIsHealthModalOpen(true)}
          className="cursor-pointer bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 hover:border-verified/50 transition-all rounded-xl p-4 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-outline text-[11px] font-data-mono uppercase font-semibold">
            <span>Custody Integrity</span>
            <span className="material-symbols-outlined text-verified text-[18px]">verified_user</span>
          </div>
          <div className="text-3xl font-bold font-headline-xl text-verified my-2 flex items-center gap-1">
            100%
            <span className="material-symbols-outlined text-[20px] text-verified">check_circle</span>
          </div>
          <div className="text-[11px] font-data-mono text-outline">
            0 Chain Discrepancies
          </div>
        </div>
      </section>

      {/* Active Investigations Feed */}
      <section className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-space-xs border-b border-outline-variant/40 mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">gavel</span>
            <span className="text-[12px] font-data-mono uppercase tracking-wider text-on-surface font-bold">
              Investigations Repository
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-outline hover:text-on-surface rounded text-[11px] font-data-mono flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">search</span>
              Universal Search (⌘K)
            </button>
            <Link
              to="/cases/new"
              className="px-3 py-1 bg-primary text-on-primary rounded text-[11px] font-bold font-data-mono flex items-center gap-1 hover:bg-sky-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span> New Case
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-on-surface-variant font-data-mono text-sm py-4">Loading active investigations...</p>
        ) : cases.length === 0 ? (
          <p className="text-outline font-data-mono text-sm py-4">No active cases registered.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenCase(c.id)}
                className="cursor-pointer p-3 bg-surface-container rounded-lg border border-outline-variant/60 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-primary font-bold font-data-mono text-xs">[{c.case_number}]</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] font-data-mono uppercase">
                      {c.status}
                    </span>
                  </div>
                  <h4 className="text-on-surface font-headline-md font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {c.title}
                  </h4>
                  <p className="text-outline text-xs line-clamp-2">{c.description || 'No description provided.'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-outline-variant/40 flex items-center justify-between">
                  <span className="text-[10px] font-data-mono text-outline">
                    Created: {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-primary font-data-mono text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 duration-200">
                    Open Case <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
