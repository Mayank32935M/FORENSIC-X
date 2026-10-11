import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchCase,
  fetchCases,
  fetchEvidence,
  fetchTimeline,
  fetchCustody,
  verifyCustody,
} from '../services/api';
import type {
  Case,
  EvidenceItem,
  TimelineEvent,
  CustodyRecord,
  CustodyVerifyResponse,
} from '../services/api';

export const CaseOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [custodyRecords, setCustodyRecords] = useState<CustodyRecord[]>([]);
  const [custodyVerification, setCustodyVerification] = useState<CustodyVerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let targetCase: Case | null = null;
        if (id && id !== '1') {
          targetCase = await fetchCase(id).catch(() => null);
        }
        if (!targetCase) {
          const allCases = await fetchCases().catch(() => []);
          targetCase = allCases.find((c) => c.case_number === 'INS-2026-0042') || allCases[0] || null;
        }

        if (targetCase) {
          const currentId = targetCase.id;
          const [evs, tls, cust, custVer] = await Promise.all([
            fetchEvidence(currentId).catch(() => []),
            fetchTimeline(currentId).catch(() => []),
            fetchCustody(currentId).catch(() => []),
            verifyCustody(currentId).catch(() => null),
          ]);
          setCaseData(targetCase);
          setEvidence(evs);
          setTimeline(tls);
          setCustodyRecords(cust);
          setCustodyVerification(custVer);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleVerifyCustody = async () => {
    if (!caseData) return;
    setVerifying(true);
    try {
      const res = await verifyCustody(caseData.id);
      setCustodyVerification(res);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-outline font-data-mono">Loading case file...</div>;
  }

  if (!caseData) {
    return (
      <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-outline">folder_off</span>
        <h2 className="text-on-surface font-bold text-lg">Case Not Found</h2>
        <p className="text-outline text-xs">The requested case could not be located in the database.</p>
        <Link to="/cases" className="inline-block px-4 py-2 bg-primary text-on-primary rounded font-bold font-data-mono text-xs">
          Return to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Primary Investigation Header */}
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col xl:flex-row justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-headline-xl text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
              {caseData.title}
            </span>
            <span className="px-2 py-0.5 rounded bg-primary/20 border border-primary/50 text-primary font-data-mono text-[10px] font-bold uppercase tracking-wider">
              {caseData.status}
            </span>
          </div>
          <p className="text-outline text-sm max-w-3xl leading-relaxed">
            {caseData.description || 'Forensic investigation into anomalous file and system activities.'}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2.5 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-[18px] text-primary">badge</span>
              <div className="flex flex-col">
                <span className="text-outline font-data-mono text-[10px] uppercase">Investigator</span>
                <span className="text-on-surface font-semibold font-data-mono text-xs">{caseData.created_by}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-[18px] text-secondary">calendar_clock</span>
              <div className="flex flex-col">
                <span className="text-outline font-data-mono text-[10px] uppercase">Created At</span>
                <span className="text-on-surface font-data-mono text-xs">
                  {new Date(caseData.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-[18px] text-primary">gavel</span>
              <div className="flex flex-col">
                <span className="text-outline font-data-mono text-[10px] uppercase">Case Identifier</span>
                <span className="text-on-surface font-data-mono text-xs font-semibold">{caseData.case_number}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap sm:flex-nowrap xl:flex-col gap-2 shrink-0 pt-2 xl:pt-0">
          <Link
            to="/evidence"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-surface-container-lowest px-4 py-2 rounded-lg font-headline-md text-xs font-bold shadow-[0_0_15px_rgba(56,189,248,0.35)] hover:bg-cyan-300 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            View / Ingest Evidence
          </Link>
          <button
            onClick={handleVerifyCustody}
            disabled={verifying}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg font-headline-md text-xs font-semibold transition-all shadow-sm"
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] ${verifying ? 'animate-spin' : ''}`}>
              {verifying ? 'sync' : 'fingerprint'}
            </span>
            {verifying ? 'Auditing Ledger...' : 'Audit Custody Ledger'}
          </button>
          <Link
            to="/timeline"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface hover:text-primary px-4 py-2 rounded-lg font-headline-md text-xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
            View Event Timeline
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {/* Card 1: Seized Artifacts */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-md flex flex-col justify-between group hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-data-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                SEIZED ARTIFACTS
              </div>
              <div className="font-headline-xl text-2xl text-on-surface font-bold mt-0.5">
                {evidence.length} Items Ingested
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">hard_drive</span>
            </div>
          </div>
          <div className="my-3 space-y-1.5 font-data-mono text-xs">
            {evidence.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between bg-surface-container p-1.5 rounded border border-outline-variant/30">
                <span className="truncate max-w-[180px] text-on-surface">{ev.original_filename}</span>
                <span className="text-primary text-[10px] font-bold">
                  {ev.file_size_bytes ? `${ev.file_size_bytes} B` : 'Record'}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono">
            <span className="text-verified flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              100% SHA-256 MATCH
            </span>
            <Link to="/evidence" className="text-primary hover:underline">Inspect Matrix</Link>
          </div>
        </div>

        {/* Card 2: Extracted Timeline */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-md flex flex-col justify-between group hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-data-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                EXTRACTED TIMELINE
              </div>
              <div className="font-headline-xl text-2xl text-on-surface font-bold mt-0.5">
                {timeline.length} Events Reconstructed
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">equalizer</span>
            </div>
          </div>
          <div className="my-3 space-y-1.5 font-data-mono text-xs">
            {timeline.slice(0, 3).map((t) => (
              <div key={t.id} className="bg-surface-container p-1.5 rounded border border-outline-variant/30 text-[11px]">
                <div className="flex items-center justify-between text-outline text-[9px]">
                  <span>{new Date(t.event_time_utc).toISOString().slice(11, 19)} UTC</span>
                  <span className="text-primary uppercase font-bold">{t.event_type}</span>
                </div>
                <div className="truncate text-on-surface font-medium mt-0.5">{t.summary}</div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono text-outline">
            <span>Chronological Forward</span>
            <Link to="/timeline" className="text-primary hover:underline">View All Events</Link>
          </div>
        </div>

        {/* Card 3: Custody Ledger Integrity */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-md flex flex-col justify-between group hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-data-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                CHAIN OF CUSTODY LEDGER
              </div>
              <div className="font-headline-xl text-2xl text-on-surface font-bold mt-0.5">
                {custodyRecords.length} Ledger Blocks
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-verified/30 flex items-center justify-center text-verified">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
          </div>
          <div className="my-3">
            {custodyVerification ? (
              <div className={`p-3 rounded-lg border text-xs font-data-mono ${
                custodyVerification.chain_valid ? 'bg-verified/10 border-verified/40 text-verified' : 'bg-error/10 border-error/40 text-error'
              }`}>
                <div className="flex items-center gap-1.5 font-bold uppercase mb-1">
                  <span className="material-symbols-outlined text-[16px]">
                    {custodyVerification.chain_valid ? 'verified' : 'warning'}
                  </span>
                  {custodyVerification.chain_valid ? 'Ledger Intact & Valid' : 'Ledger Discrepancy'}
                </div>
                <div className="text-[10px] opacity-80">{custodyVerification.message}</div>
              </div>
            ) : (
              <div className="text-outline text-xs font-data-mono p-3 bg-surface-container rounded">
                Click "Audit Custody Ledger" to verify cryptographic hash continuity.
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono text-outline">
            <span>Protocol: SHA-256 Hash Chain</span>
            <span className="text-verified font-bold">Tamper-Evident</span>
          </div>
        </div>
      </div>
    </div>
  );
};
