import React, { useState } from 'react';
import type { Observation, EvidenceItem } from '../services/api';
import { parseEvidence } from '../services/api';

interface ObservationsViewerModalProps {
  evidenceItem: EvidenceItem | null;
  observations: Observation[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ObservationsViewerModal: React.FC<ObservationsViewerModalProps> = ({
  evidenceItem,
  observations,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [reparsing, setReparsing] = useState(false);
  const [reparseMessage, setReparseMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || !evidenceItem) return null;

  // Distinct types for tabs
  const types = Array.from(new Set(observations.map((o) => o.observation_type)));

  const filtered = observations.filter((obs) => {
    if (filterType !== 'ALL' && obs.observation_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        obs.content.toLowerCase().includes(q) ||
        (obs.source_offset && obs.source_offset.toLowerCase().includes(q)) ||
        obs.observation_type.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleReparse = async () => {
    setReparsing(true);
    setReparseMessage(null);
    try {
      const res = await parseEvidence(evidenceItem.id, true);
      setReparseMessage(`Extracted ${res.observation_count} observations.`);
      onRefresh();
    } catch (err: any) {
      setReparseMessage(`Error: ${err.message || 'Failed to parse'}`);
    } finally {
      setReparsing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-outline-variant rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">manage_search</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-md font-bold text-base text-on-surface">
                  Extracted Forensic Observations
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-data-mono text-[10px] font-bold">
                  {observations.length} Facts Extracted
                </span>
              </div>
              <p className="text-[11px] font-data-mono text-outline mt-0.5">
                Target Artifact: <span className="text-on-surface font-semibold">{evidenceItem.original_filename}</span> ({evidenceItem.mime_type || 'plain text'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReparse}
              disabled={reparsing}
              className="px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant text-on-surface text-[11px] font-data-mono font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Force re-run parser engine on evidence file"
            >
              <span className={`material-symbols-outlined text-[15px] text-primary ${reparsing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{reparsing ? 'Parsing...' : 'Re-Parse Artifact'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-outline hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {reparseMessage && (
          <div className="px-4 py-2 bg-primary/10 border-b border-primary/30 text-[11px] font-data-mono text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px]">info</span>
            <span>{reparseMessage}</span>
          </div>
        )}

        {/* Filters & Search Bar */}
        <div className="p-3 bg-surface-container-lowest border-b border-outline-variant/40 flex flex-wrap items-center justify-between gap-2">
          {/* Types Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold font-data-mono transition-colors ${
                filterType === 'ALL'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              ALL ({observations.length})
            </button>
            {types.map((t) => {
              const count = observations.filter((o) => o.observation_type === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium font-data-mono uppercase transition-colors ${
                    filterType === t
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t.replace(/_/g, ' ')} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex items-center w-64">
            <span className="material-symbols-outlined absolute left-2 text-outline text-[16px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search extracted facts..."
              className="w-full bg-surface-container-high text-on-surface text-[11px] font-data-mono pl-8 pr-7 py-1.5 rounded border border-outline-variant/60 focus:outline-none focus:border-primary"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Split List & Inspector */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
          {/* Observation List */}
          <div className={`${selectedObs ? 'md:col-span-7' : 'md:col-span-12'} overflow-y-auto p-3 space-y-2 border-r border-outline-variant/40`}>
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-outline font-data-mono text-xs">
                No observations matching the filter criteria.
              </div>
            ) : (
              filtered.map((obs, idx) => {
                const isSelected = selectedObs?.id === obs.id;
                return (
                  <div
                    key={obs.id}
                    onClick={() => setSelectedObs(obs)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-data-mono font-bold text-primary">
                          #{idx + 1}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-data-mono uppercase bg-primary/15 text-primary border border-primary/30">
                          {obs.observation_type}
                        </span>
                        {obs.source_offset && (
                          <span className="text-[10px] font-data-mono text-outline">
                            [{obs.source_offset}]
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-data-mono text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-outline">schedule</span>
                        <span>{obs.observed_time_utc ? new Date(obs.observed_time_utc).toISOString().replace('T', ' ').slice(0, 19) : obs.original_time_string || 'N/A'}</span>
                      </div>
                    </div>

                    <p className="text-[12px] text-on-surface font-sans leading-snug line-clamp-2">
                      {obs.content}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/30 text-[10px] font-data-mono text-outline">
                      <span>Parser: {obs.parser_name || 'engine'} v{obs.parser_version || '1.0'}</span>
                      <span className="text-primary font-medium hover:underline flex items-center gap-0.5">
                        Inspect Provenance <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inspector Drawer */}
          {selectedObs && (
            <div className="md:col-span-5 bg-surface-container-lowest p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                    <span className="font-headline-md font-bold text-xs uppercase tracking-wide">
                      Observation Provenance
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedObs(null)}
                    className="text-outline hover:text-on-surface p-1 rounded"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-outline font-data-mono">
                    Extracted Fact Summary
                  </label>
                  <div className="p-2.5 rounded bg-surface-container border border-outline-variant/60 text-[12px] text-on-surface leading-relaxed">
                    {selectedObs.content}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-data-mono">
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/40">
                    <div className="text-[9px] text-outline uppercase font-bold">Type</div>
                    <div className="text-primary font-bold mt-0.5">{selectedObs.observation_type}</div>
                  </div>
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/40">
                    <div className="text-[9px] text-outline uppercase font-bold">Time Quality</div>
                    <div className="text-verified font-bold mt-0.5 uppercase">{selectedObs.time_quality || 'PRECISE'}</div>
                  </div>
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/40">
                    <div className="text-[9px] text-outline uppercase font-bold">Source Offset</div>
                    <div className="text-on-surface font-bold mt-0.5">{selectedObs.source_offset || 'N/A'}</div>
                  </div>
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/40">
                    <div className="text-[9px] text-outline uppercase font-bold">Engine</div>
                    <div className="text-on-surface font-bold mt-0.5">{selectedObs.parser_name} v{selectedObs.parser_version}</div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="space-y-1 font-data-mono">
                  <div className="text-[10px] text-outline uppercase font-bold">Evidence Timestamp (UTC)</div>
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/40 text-[11px] text-on-surface">
                    {selectedObs.observed_time_utc ? new Date(selectedObs.observed_time_utc).toISOString() : 'N/A'}
                    {selectedObs.original_time_string && (
                      <span className="block text-[10px] text-outline mt-0.5">
                        Raw string: "{selectedObs.original_time_string}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Citation String */}
                <div className="space-y-1 font-data-mono">
                  <div className="text-[10px] text-outline uppercase font-bold">Legal Citation Reference</div>
                  <div className="p-2 rounded bg-surface-container-high border border-outline-variant/60 text-[10px] text-primary break-all flex items-center justify-between gap-2">
                    <span>{`[OBS:${selectedObs.id.slice(0, 8)}:${selectedObs.source_file || 'log'}:${selectedObs.source_offset || '1'}]`}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `[OBS:${selectedObs.id}:${selectedObs.source_file || 'log'}:${selectedObs.source_offset || '1'}]`,
                          selectedObs.id
                        )
                      }
                      className="px-2 py-0.5 rounded bg-primary text-on-primary font-bold text-[9px] shrink-0"
                    >
                      {copiedId === selectedObs.id ? 'Copied' : 'Copy Citation'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom ID */}
              <div className="pt-2 border-t border-outline-variant/30 text-[10px] font-data-mono text-outline truncate">
                UUID: {selectedObs.id}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
