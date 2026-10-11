import React, { useEffect, useState } from 'react';
import {
  fetchEvidence,
  fetchCases,
  verifyEvidence,
  fetchCustody,
  verifyCustody,
  uploadEvidence,
  createEvidenceMetadata,
} from '../services/api';
import type {
  EvidenceItem,
  Case,
  CustodyRecord,
  EvidenceVerifyResponse,
  CustodyVerifyResponse,
} from '../services/api';

export const Evidence: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'LOGS' | 'CSV' | 'OTHER'>('ALL');

  // Verification state per item: evidenceId -> { verified: boolean, message: string }
  const [verificationMap, setVerificationMap] = useState<Record<string, EvidenceVerifyResponse>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Custody modal state
  const [activeItem, setActiveItem] = useState<EvidenceItem | null>(null);
  const [custodyRecords, setCustodyRecords] = useState<CustodyRecord[]>([]);
  const [custodyVerifyResult, setCustodyVerifyResult] = useState<CustodyVerifyResponse | null>(null);
  const [loadingCustody, setLoadingCustody] = useState(false);

  // Ingest modal state
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestMode, setIngestMode] = useState<'file' | 'metadata'>('metadata');
  const [ingestFilename, setIngestFilename] = useState('');
  const [ingestMimeType, setIngestMimeType] = useState('text/plain');
  const [ingestSource, setIngestSource] = useState('');
  const [ingestMethod, setIngestMethod] = useState('live-acquisition');
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState('');

  // Initial data load
  const loadData = async () => {
    setLoading(true);
    try {
      const [evData, casesData] = await Promise.all([
        fetchEvidence(selectedCaseId || undefined),
        fetchCases(),
      ]);
      setEvidenceList(evData);
      setCases(casesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCaseId]);

  // Handle Hash Verification
  const handleVerifyEvidence = async (item: EvidenceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setVerifyingId(item.id);
    try {
      const res = await verifyEvidence(item.id);
      setVerificationMap((prev) => ({ ...prev, [item.id]: res }));
    } catch (err: any) {
      setVerificationMap((prev) => ({
        ...prev,
        [item.id]: {
          evidence_id: item.id,
          verified: false,
          stored_hash: item.hash_sha256 || '',
          current_hash: '',
          message: err.message || 'Verification failed',
        },
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  // Open Custody Details
  const handleOpenCustody = async (item: EvidenceItem) => {
    setActiveItem(item);
    setLoadingCustody(true);
    setCustodyVerifyResult(null);
    try {
      const [records, verifyRes] = await Promise.all([
        fetchCustody(item.case_id),
        verifyCustody(item.case_id, item.id),
      ]);
      // Filter records for this item if applicable
      const itemRecords = records.filter(
        (r) => !r.evidence_item_id || r.evidence_item_id === item.id
      );
      setCustodyRecords(itemRecords);
      setCustodyVerifyResult(verifyRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCustody(false);
    }
  };

  // Handle Ingest Submit
  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    setIngestError('');
    const targetCaseId = selectedCaseId || cases[0]?.id;
    if (!targetCaseId) {
      setIngestError('Please select or create a case first.');
      setIngesting(false);
      return;
    }

    try {
      if (ingestMode === 'file' && ingestFile) {
        const formData = new FormData();
        formData.append('file', ingestFile);
        formData.append('source_description', ingestSource);
        formData.append('acquisition_method', ingestMethod);
        await uploadEvidence(targetCaseId, formData);
      } else {
        await createEvidenceMetadata(targetCaseId, {
          original_filename: ingestFilename,
          mime_type: ingestMimeType,
          source_description: ingestSource,
          acquisition_method: ingestMethod,
        });
      }
      setShowIngestModal(false);
      setIngestFilename('');
      setIngestSource('');
      setIngestFile(null);
      await loadData();
    } catch (err: any) {
      setIngestError(err.message || 'Failed to ingest evidence artifact');
    } finally {
      setIngesting(false);
    }
  };

  // Filtering
  const filteredEvidence = evidenceList.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchQuery =
      !query ||
      item.original_filename.toLowerCase().includes(query) ||
      (item.hash_sha256 && item.hash_sha256.toLowerCase().includes(query)) ||
      (item.source_description && item.source_description.toLowerCase().includes(query));

    if (!matchQuery) return false;

    if (scopeFilter === 'LOGS') return item.mime_type?.includes('text') || item.original_filename.endsWith('.log');
    if (scopeFilter === 'CSV') return item.mime_type?.includes('csv') || item.original_filename.endsWith('.csv');
    if (scopeFilter === 'OTHER') return !item.original_filename.endsWith('.log') && !item.original_filename.endsWith('.csv');

    return true;
  });

  return (
    <div className="space-y-4 w-full">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <span className="font-headline-md text-[16px] tracking-tight font-bold text-on-surface uppercase">
              Evidence Repository & Custody Matrix
            </span>
          </div>
          <span className="text-outline text-[11px] hidden sm:inline">::</span>
          
          {/* Case Selector */}
          <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-1 rounded border border-outline-variant/60 text-[11px]">
            <span className="text-on-surface-variant font-semibold">CASE:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-surface-container text-on-surface">ALL CASES ({cases.length})</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface-container text-on-surface">
                  [{c.case_number}] {c.title.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded border border-outline-variant/50 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-verified shadow-[0_0_6px_#22c55e]"></span>
            <span className="text-on-surface-variant">CHAIN PROTOCOL:</span>
            <span className="text-verified font-bold">SHA-256 IMMUTABLE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center w-56 sm:w-64">
            <span className="material-symbols-outlined absolute left-2 text-outline text-[16px] pointer-events-none">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-[11px] font-data-mono pl-8 pr-3 py-1.5 rounded border border-outline-variant/60 focus:outline-none focus:border-primary transition-colors"
              placeholder="Filter artifacts, hashes, names..."
              type="text"
            />
          </div>
          <button
            onClick={() => setShowIngestModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded font-bold text-[11px] hover:bg-sky-300 transition-colors shadow-[0_0_12px_rgba(56,189,248,0.25)]"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Ingest Artifact</span>
          </button>
        </div>
      </div>

      {/* Scope Filtering & Summary Bar */}
      <div className="flex items-center justify-between gap-2 bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/70 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-data-mono uppercase tracking-wider text-outline font-bold mr-2 shrink-0">Filter Scope:</span>
          <button
            onClick={() => setScopeFilter('ALL')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
              scopeFilter === 'ALL' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>All</span>
            <span className="opacity-80">[{evidenceList.length}]</span>
          </button>
          <button
            onClick={() => setScopeFilter('LOGS')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 border border-outline-variant/40 transition-colors ${
              scopeFilter === 'LOGS' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Log Files</span>
          </button>
          <button
            onClick={() => setScopeFilter('CSV')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 border border-outline-variant/40 transition-colors ${
              scopeFilter === 'CSV' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>CSV Audits</span>
          </button>
          <button
            onClick={() => setScopeFilter('OTHER')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 border border-outline-variant/40 transition-colors ${
              scopeFilter === 'OTHER' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Other Media</span>
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] font-data-mono">
          <span className="flex items-center gap-1 text-verified font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>
            {evidenceList.length} INTACT // READY FOR ANALYSIS
          </span>
        </div>
      </div>

      {/* Evidence Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-outline font-data-mono text-sm">Loading evidence repository...</div>
      ) : filteredEvidence.length === 0 ? (
        <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
          <p className="text-on-surface font-semibold text-sm">No evidence artifacts matching current criteria.</p>
          <p className="text-outline text-xs">Use "Ingest Artifact" above to upload or register synthetic evidence files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start w-full">
          {filteredEvidence.map((item, idx) => {
            const verification = verificationMap[item.id];
            const isVerifying = verifyingId === item.id;
            const isLog = item.original_filename.endsWith('.log');
            const isCsv = item.original_filename.endsWith('.csv');

            return (
              <div
                key={item.id}
                onClick={() => handleOpenCustody(item)}
                className="cursor-pointer p-3 rounded-lg bg-surface-container-high border border-outline-variant/70 hover:border-primary/60 relative flex flex-col justify-between gap-3 shadow-md group transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-surface-container border border-primary/40 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">
                        {isLog ? 'description' : isCsv ? 'table_chart' : 'hard_drive'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-primary font-bold text-[11px] font-data-mono">EVD-{idx + 1 < 10 ? `00${idx + 1}` : `0${idx + 1}`}</span>
                        <span className="px-1.5 py-0.5 bg-primary/15 text-primary text-[9px] font-bold rounded uppercase">
                          {isLog ? 'LOG' : isCsv ? 'CSV' : 'RAW'}
                        </span>
                      </div>
                      <div className="text-[10px] text-outline font-data-mono mt-0.5 truncate max-w-[140px]">
                        {item.acquisition_method || 'live-acquisition'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Indicator Icon */}
                  <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" fill="none" r="14" stroke="#1c2025" strokeWidth="3.5"></circle>
                      <circle
                        cx="18"
                        cy="18"
                        fill="none"
                        r="14"
                        stroke={verification ? (verification.verified ? '#22c55e' : '#ef4444') : '#38bdf8'}
                        strokeDasharray="88, 100"
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      ></circle>
                    </svg>
                    <span className="absolute text-[8px] text-verified font-bold">
                      {verification ? (verification.verified ? '100%' : 'FAIL') : 'SEAL'}
                    </span>
                  </div>
                </div>

                {/* Filename & Description */}
                <div>
                  <div className="font-data-mono font-bold text-[12px] text-on-surface truncate" title={item.original_filename}>
                    {item.original_filename}
                  </div>
                  <div className="text-[10px] text-outline flex items-center gap-1 mt-1 truncate" title={item.source_description || ''}>
                    <span>{item.mime_type || 'octet-stream'}</span>
                    <span>•</span>
                    <span className="text-on-surface-variant font-data-mono">
                      {item.file_size_bytes ? `${item.file_size_bytes.toLocaleString()} bytes` : 'Metadata only'}
                    </span>
                  </div>
                </div>

                {/* SHA-256 Fingerprint */}
                <div className="space-y-1 bg-surface-container-lowest p-2 rounded border border-outline-variant/40 font-data-mono text-[10px]">
                  <div className="text-outline text-[9px] uppercase tracking-wider">SHA-256 Fingerprint</div>
                  <div className="text-primary truncate" title={item.hash_sha256 || 'None'}>
                    {item.hash_sha256 ? `${item.hash_sha256.slice(0, 16)}...` : 'Not computed'}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 mt-1">
                  <button
                    onClick={(e) => handleVerifyEvidence(item, e)}
                    disabled={isVerifying}
                    className="px-2 py-1 bg-surface-container text-primary hover:bg-primary/20 border border-primary/40 rounded text-[10px] font-data-mono font-bold flex items-center gap-1 transition-colors"
                    title="Run live SHA-256 hash check against disk"
                  >
                    <span className={`material-symbols-outlined text-[13px] ${isVerifying ? 'animate-spin' : ''}`}>
                      {isVerifying ? 'sync' : 'fingerprint'}
                    </span>
                    <span>{isVerifying ? 'Hashing...' : 'Verify Hash'}</span>
                  </button>

                  {verification ? (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 border ${
                        verification.verified
                          ? 'bg-verified/15 text-verified border-verified/40'
                          : 'bg-error/15 text-error border-error/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${verification.verified ? 'bg-verified' : 'bg-error'}`}></span>
                      {verification.verified ? 'VERIFIED' : 'TAMPERED'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-data-mono text-outline hover:text-primary transition-colors flex items-center gap-0.5">
                      Custody Chain <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custody Chain & Integrity Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-outline-variant/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
                  <h3 className="font-headline-md font-bold text-lg text-on-surface">
                    Artifact Custody & Cryptographic Seal
                  </h3>
                </div>
                <div className="text-xs font-data-mono text-outline mt-1">
                  Target: {activeItem.original_filename}
                </div>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="text-outline hover:text-on-surface p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Artifact Technical Details */}
            <div className="grid grid-cols-2 gap-3 bg-surface-container p-3 rounded-lg border border-outline-variant/60 font-data-mono text-xs">
              <div>
                <span className="text-outline block text-[10px] uppercase">Storage Path:</span>
                <span className="text-on-surface truncate block" title={activeItem.storage_path || ''}>
                  {activeItem.storage_path || 'None (DB Record)'}
                </span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">File Size:</span>
                <span className="text-on-surface font-bold">
                  {activeItem.file_size_bytes ? `${activeItem.file_size_bytes.toLocaleString()} bytes` : '0 B'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-outline block text-[10px] uppercase">Canonical SHA-256:</span>
                <span className="text-primary font-bold text-[11px] break-all select-all">
                  {activeItem.hash_sha256 || 'None'}
                </span>
              </div>
            </div>

            {/* Custody Verification Badge */}
            {custodyVerifyResult && (
              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs font-data-mono ${
                  custodyVerifyResult.chain_valid
                    ? 'bg-verified/10 border-verified/50 text-verified'
                    : 'bg-error/10 border-error/50 text-error'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">
                    {custodyVerifyResult.chain_valid ? 'check_circle' : 'warning'}
                  </span>
                  <div>
                    <div className="font-bold uppercase">
                      {custodyVerifyResult.chain_valid ? 'Chain-of-Custody Verified Intact' : 'Custody Discrepancy Alert'}
                    </div>
                    <div className="text-[10px] opacity-80">{custodyVerifyResult.message}</div>
                  </div>
                </div>
                <div className="font-bold text-[11px]">
                  {custodyVerifyResult.record_count} Records Validated
                </div>
              </div>
            )}

            {/* Chain of Custody History List */}
            <div>
              <h4 className="text-xs font-data-mono uppercase tracking-wider text-outline font-bold mb-2">
                Append-Only Custody Log ({custodyRecords.length} Events)
              </h4>
              {loadingCustody ? (
                <p className="text-outline text-xs font-data-mono">Loading chain history...</p>
              ) : custodyRecords.length === 0 ? (
                <p className="text-outline text-xs font-data-mono">No custody records found for this artifact.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {custodyRecords.map((r, i) => (
                    <div
                      key={r.id || i}
                      className="bg-surface-container p-2.5 rounded border border-outline-variant/60 font-data-mono text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold uppercase">[{r.action}]</span>
                        <span className="text-outline text-[10px]">
                          {new Date(r.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-on-surface">{r.description || 'No action summary'}</div>
                      <div className="flex items-center justify-between text-[10px] text-outline pt-1 border-t border-outline-variant/30">
                        <span>Actor: {r.actor}</span>
                        <span className="truncate max-w-[200px]" title={r.prior_record_hash || 'Genesis (None)'}>
                          Prior Hash: {r.prior_record_hash ? `${r.prior_record_hash.slice(0, 12)}...` : 'GENESIS'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveItem(null)}
                className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded font-data-mono text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingest Artifact Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleIngestSubmit}
            className="bg-surface-container-low border border-outline-variant rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-start justify-between border-b border-outline-variant/60 pb-3">
              <div>
                <h3 className="font-headline-md font-bold text-lg text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                  Ingest Evidence Artifact
                </h3>
                <p className="text-xs font-data-mono text-outline mt-0.5">
                  Append forensic artifact into immutable storage store.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="text-outline hover:text-on-surface p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {ingestError && (
              <div className="p-2 bg-error/15 border border-error/50 rounded text-error text-xs font-data-mono">
                {ingestError}
              </div>
            )}

            {/* Ingest Mode Toggle */}
            <div className="flex items-center gap-2 bg-surface-container p-1 rounded border border-outline-variant text-xs font-data-mono">
              <button
                type="button"
                onClick={() => setIngestMode('metadata')}
                className={`flex-1 py-1 rounded text-center font-bold transition-colors ${
                  ingestMode === 'metadata' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Metadata / Synthetic Entry
              </button>
              <button
                type="button"
                onClick={() => setIngestMode('file')}
                className={`flex-1 py-1 rounded text-center font-bold transition-colors ${
                  ingestMode === 'file' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Upload Real File
              </button>
            </div>

            {/* Case Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-data-mono text-outline uppercase font-bold">Target Case</label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs font-data-mono text-on-surface focus:border-primary focus:outline-none"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.case_number}] {c.title}
                  </option>
                ))}
              </select>
            </div>

            {ingestMode === 'file' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-data-mono text-outline uppercase font-bold">Artifact File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setIngestFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs font-data-mono text-on-surface"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-data-mono text-outline uppercase font-bold">Original Filename</label>
                  <input
                    type="text"
                    required
                    value={ingestFilename}
                    onChange={(e) => setIngestFilename(e.target.value)}
                    placeholder="e.g. dump_memory.raw"
                    className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs font-data-mono text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-data-mono text-outline uppercase font-bold">MIME Type</label>
                  <input
                    type="text"
                    value={ingestMimeType}
                    onChange={(e) => setIngestMimeType(e.target.value)}
                    placeholder="e.g. application/octet-stream"
                    className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs font-data-mono text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-data-mono text-outline uppercase font-bold">Source Description</label>
              <textarea
                value={ingestSource}
                onChange={(e) => setIngestSource(e.target.value)}
                placeholder="Details of seizure, physical device, disk partition, or system..."
                rows={2}
                className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs font-data-mono text-on-surface focus:border-primary focus:outline-none"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-data-mono text-outline uppercase font-bold">Acquisition Method</label>
              <input
                type="text"
                value={ingestMethod}
                onChange={(e) => setIngestMethod(e.target.value)}
                placeholder="e.g. live-acquisition, dd-bitstream, forensic-imager"
                className="w-full bg-surface-container border border-outline-variant rounded p-2 text-xs font-data-mono text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/60">
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded font-data-mono text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ingesting}
                className="px-4 py-2 bg-primary text-on-primary rounded font-bold font-data-mono text-xs hover:bg-sky-300 transition-colors"
              >
                {ingesting ? 'Ingesting...' : 'Ingest & Hash'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
