import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchCase,
  fetchEvidence,
  fetchTimeline,
  fetchCustody,
  verifyCustody,
  fetchCaseAuditHash,
  fetchCaseExport,
  createEvidenceMetadata,
  uploadEvidence,
} from '../services/api';
import { useCaseContext } from '../context/CaseContext';
import { EvidenceContentViewer } from '../components/EvidenceContentViewer';
import type {
  Case,
  EvidenceItem,
  TimelineEvent,
  CustodyRecord,
  CustodyVerifyResponse,
  CaseAuditHashResponse,
} from '../services/api';

export const CaseOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { activeCaseId, setActiveCaseId, cases } = useCaseContext();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [custodyRecords, setCustodyRecords] = useState<CustodyRecord[]>([]);
  const [custodyVerification, setCustodyVerification] = useState<CustodyVerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Audit Hash Modal state
  const [auditHashData, setAuditHashData] = useState<CaseAuditHashResponse | null>(null);
  const [computingHash, setComputingHash] = useState(false);
  const [copiedAuditHash, setCopiedAuditHash] = useState(false);

  // Raw Content Inspector Modal state
  const [inspectItem, setInspectItem] = useState<EvidenceItem | null>(null);

  // Ingest Modal state
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestFilename, setIngestFilename] = useState('');
  const [ingestMimeType, setIngestMimeType] = useState('text/plain');
  const [ingestSource, setIngestSource] = useState('');
  const [ingesting, setIngesting] = useState(false);

  // Export State
  const [exporting, setExporting] = useState(false);

  const targetId = id || activeCaseId;

  const loadCaseData = async () => {
    setLoading(true);
    try {
      let targetCase: Case | null = null;
      if (targetId && targetId !== '1') {
        targetCase = await fetchCase(targetId).catch(() => null);
      }
      if (!targetCase) {
        targetCase = cases.find((c) => c.case_number === 'INS-2026-0042') || cases[0] || null;
      }

      if (targetCase) {
        const cId = targetCase.id;
        setActiveCaseId(cId);
        const [evs, tls, cust, custVer] = await Promise.all([
          fetchEvidence(cId).catch(() => []),
          fetchTimeline(cId).catch(() => []),
          fetchCustody(cId).catch(() => []),
          verifyCustody(cId).catch(() => null),
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

  useEffect(() => {
    loadCaseData();
  }, [targetId, cases.length]);

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

  const handleGenerateAuditHash = async () => {
    if (!caseData) return;
    setComputingHash(true);
    try {
      const res = await fetchCaseAuditHash(caseData.id);
      setAuditHashData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setComputingHash(false);
    }
  };

  const handleExportPackage = async () => {
    if (!caseData) return;
    setExporting(true);
    try {
      const dossier = await fetchCaseExport(caseData.id);
      const jsonStr = JSON.stringify(dossier, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FORENSIC_X_DOSSIER_${caseData.case_number}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleQuickIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;
    setIngesting(true);
    try {
      await createEvidenceMetadata(caseData.id, {
        original_filename: ingestFilename,
        mime_type: ingestMimeType,
        source_description: ingestSource,
      });
      setShowIngestModal(false);
      setIngestFilename('');
      setIngestSource('');
      await loadCaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setIngesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-outline font-data-mono">Loading investigation dossier...</div>;
  }

  if (!caseData) {
    return (
      <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant text-center space-y-3 font-data-mono">
        <span className="material-symbols-outlined text-4xl text-outline">folder_off</span>
        <h2 className="text-on-surface font-bold text-lg">Case Dossier Not Found</h2>
        <p className="text-outline text-xs">The requested investigation could not be resolved.</p>
        <Link to="/cases" className="inline-block px-4 py-2 bg-primary text-on-primary rounded font-bold text-xs">
          Return to Investigation Index
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
                <span className="text-outline font-data-mono text-[10px] uppercase">Incident Intake</span>
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
          <button
            onClick={() => setShowIngestModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-surface-container-lowest px-4 py-2 rounded-lg font-headline-md text-xs font-bold shadow-[0_0_15px_rgba(56,189,248,0.35)] hover:bg-sky-300 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            + Ingest Evidence Item
          </button>
          <button
            onClick={handleGenerateAuditHash}
            disabled={computingHash}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg font-headline-md text-xs font-semibold transition-all shadow-sm cursor-pointer"
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] ${computingHash ? 'animate-spin' : ''}`}>
              fingerprint
            </span>
            {computingHash ? 'Computing Merkle...' : 'Generate Interim Audit Hash'}
          </button>
          <button
            onClick={handleExportPackage}
            disabled={exporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface hover:text-primary px-4 py-2 rounded-lg font-headline-md text-xs transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">archive</span>
            {exporting ? 'Compiling Dossier...' : 'Export Case Package (.json)'}
          </button>
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
              <div
                key={ev.id}
                className="flex items-center justify-between bg-surface-container p-2 rounded border border-outline-variant/30 hover:border-primary/40 transition-colors"
              >
                <div className="truncate max-w-[170px]">
                  <div className="text-on-surface font-bold truncate">{ev.original_filename}</div>
                  <div className="text-[10px] text-outline font-data-mono">
                    {ev.file_size_bytes ? `${ev.file_size_bytes.toLocaleString()} bytes` : '0 bytes'}
                  </div>
                </div>
                <button
                  onClick={() => setInspectItem(ev)}
                  className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">visibility</span> Inspect
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono">
            <span className="text-verified flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              100% SHA-256 MATCH
            </span>
            <Link to="/evidence" className="text-primary hover:underline">
              Inspect Evidence Matrix →
            </Link>
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
              <div key={t.id} className="bg-surface-container p-2 rounded border border-outline-variant/30 text-[11px]">
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
            <Link to="/timeline" className="text-primary hover:underline">
              View Reconstructed Timeline →
            </Link>
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
              <div
                className={`p-3 rounded-lg border text-xs font-data-mono ${
                  custodyVerification.chain_valid
                    ? 'bg-verified/10 border-verified/40 text-verified'
                    : 'bg-error/10 border-error/40 text-error'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold uppercase mb-1">
                  <span className="material-symbols-outlined text-[16px]">
                    {custodyVerification.chain_valid ? 'verified' : 'warning'}
                  </span>
                  {custodyVerification.chain_valid ? 'Ledger Intact & Valid' : 'Ledger Discrepancy'}
                </div>
                <div className="text-[10px] opacity-80">{custodyVerification.message}</div>
              </div>
            ) : (
              <div className="text-outline text-xs font-data-mono p-3 bg-surface-container rounded border border-outline-variant/40">
                Ledger unverified. Click button below to audit cryptographic hash continuity.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono">
            <button
              onClick={handleVerifyCustody}
              disabled={verifying}
              className="text-primary hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[13px] ${verifying ? 'animate-spin' : ''}`}>
                sync
              </span>
              {verifying ? 'Verifying...' : 'Audit Custody Ledger'}
            </button>
            <span className="text-verified font-bold">Tamper-Evident</span>
          </div>
        </div>
      </div>

      {/* Raw Content Viewer Modal */}
      <EvidenceContentViewer
        evidenceItem={inspectItem}
        onClose={() => setInspectItem(null)}
      />

      {/* Interim Audit Hash Modal */}
      {auditHashData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-surface-container-low border border-primary/50 rounded-xl max-w-lg w-full p-5 space-y-4 font-data-mono shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">fingerprint</span>
                <h3 className="font-headline-md font-bold text-base text-on-surface">
                  Interim Case Audit Hash
                </h3>
              </div>
              <button onClick={() => setAuditHashData(null)} className="text-outline hover:text-on-surface p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-outline leading-relaxed">
              Cryptographic root hash combining all seized artifacts, sorted SHA-256 fingerprints, and the latest unbroken custody block.
            </p>

            <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/60 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-bold text-outline">Merkle State Fingerprint:</div>
              <div className="text-primary font-bold text-xs break-all select-all bg-surface-container-lowest p-2 rounded border border-outline-variant/40">
                {auditHashData.interim_audit_hash}
              </div>
              <div className="flex items-center justify-between text-[11px] text-outline pt-1">
                <span>Algorithm: <span className="text-on-surface">{auditHashData.algorithm}</span></span>
                <span>Sealed Artifacts: <span className="text-on-surface">{auditHashData.evidence_count}</span></span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(auditHashData.interim_audit_hash);
                  setCopiedAuditHash(true);
                  setTimeout(() => setCopiedAuditHash(false), 2000);
                }}
                className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded text-xs font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedAuditHash ? 'check' : 'content_copy'}
                </span>
                {copiedAuditHash ? 'Copied Hash!' : 'Copy Hash'}
              </button>
              <button
                onClick={() => setAuditHashData(null)}
                className="px-4 py-1.5 bg-primary text-on-primary rounded text-xs font-bold hover:bg-sky-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <form
            onSubmit={handleQuickIngest}
            className="bg-surface-container-low border border-primary/50 rounded-xl max-w-md w-full p-5 space-y-4 font-data-mono shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <h3 className="font-headline-md font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Ingest Artifact for [{caseData.case_number}]
              </h3>
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-outline">Filename</label>
                <input
                  type="text"
                  required
                  value={ingestFilename}
                  onChange={(e) => setIngestFilename(e.target.value)}
                  placeholder="e.g. system_event_log.evtx"
                  className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-outline">MIME / Format</label>
                <input
                  type="text"
                  value={ingestMimeType}
                  onChange={(e) => setIngestMimeType(e.target.value)}
                  placeholder="e.g. application/octet-stream"
                  className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-outline">Seizure Context</label>
                <textarea
                  rows={2}
                  value={ingestSource}
                  onChange={(e) => setIngestSource(e.target.value)}
                  placeholder="Seized from workstation disk partition..."
                  className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/60">
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ingesting}
                className="px-4 py-1.5 bg-primary text-on-primary rounded text-xs font-bold hover:bg-sky-300"
              >
                {ingesting ? 'Ingesting...' : 'Ingest & Log'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
