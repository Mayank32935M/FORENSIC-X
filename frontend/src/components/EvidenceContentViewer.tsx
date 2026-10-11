import React, { useState, useEffect } from 'react';
import { fetchEvidenceContent } from '../services/api';
import type { EvidenceContentResponse, EvidenceItem } from '../services/api';

interface EvidenceContentViewerProps {
  evidenceItem: EvidenceItem | null;
  onClose: () => void;
}

export const EvidenceContentViewer: React.FC<EvidenceContentViewerProps> = ({
  evidenceItem,
  onClose,
}) => {
  const [data, setData] = useState<EvidenceContentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'hex'>('text');
  const [filterText, setFilterText] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  useEffect(() => {
    if (evidenceItem) {
      setLoading(true);
      fetchEvidenceContent(evidenceItem.id)
        .then((res) => {
          setData(res);
          if (!res.is_text) {
            setActiveTab('hex');
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [evidenceItem]);

  if (!evidenceItem) return null;

  const handleCopyHash = () => {
    if (evidenceItem.hash_sha256) {
      navigator.clipboard.writeText(evidenceItem.hash_sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleCopyContent = () => {
    if (data?.content) {
      navigator.clipboard.writeText(data.content);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const lines = data?.content ? data.content.split('\n') : [];
  const filteredLines = filterText
    ? lines.filter((l) => l.toLowerCase().includes(filterText.toLowerCase()))
    : lines;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-surface-container-low border border-primary/50 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface-container border-b border-outline-variant/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-primary/20 border border-primary/50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-md font-bold text-base text-on-surface">
                  {evidenceItem.original_filename}
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/15 border border-primary/40 text-primary text-[10px] font-data-mono font-bold uppercase">
                  RAW ARTIFACT
                </span>
              </div>
              <div className="text-[11px] font-data-mono text-outline flex items-center gap-2 mt-0.5">
                <span>{evidenceItem.mime_type || 'text/plain'}</span>
                <span>•</span>
                <span>{evidenceItem.file_size_bytes?.toLocaleString()} bytes</span>
                <span>•</span>
                <span>Storage: {evidenceItem.storage_path || 'evidence_store'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyContent}
              className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded text-[11px] font-data-mono flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              {copiedContent ? 'Copied Content!' : 'Copy Content'}
            </button>
            <button
              onClick={onClose}
              className="text-outline hover:text-on-surface p-1 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* SHA-256 Fingerprint & Audit Callout */}
        <div className="px-4 py-2 bg-surface-container-lowest border-b border-outline-variant/40 flex flex-wrap items-center justify-between gap-2 text-xs font-data-mono">
          <div className="flex items-center gap-2">
            <span className="text-outline uppercase text-[10px] font-bold">SHA-256:</span>
            <span className="text-primary font-bold text-[11px] select-all">
              {evidenceItem.hash_sha256}
            </span>
            <button
              onClick={handleCopyHash}
              className="text-outline hover:text-primary transition-colors text-[11px]"
              title="Copy SHA-256"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copiedHash ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-verified text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse"></span>
            <span>ACCESSED Action Cryptographically Logged to Custody Ledger</span>
          </div>
        </div>

        {/* Control Sub-bar */}
        <div className="px-4 py-2 bg-surface-container flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40">
          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded border border-outline-variant/60 font-data-mono text-xs">
            <button
              onClick={() => setActiveTab('text')}
              disabled={!data?.is_text}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                activeTab === 'text'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface disabled:opacity-40'
              }`}
            >
              Log / Text Stream
            </button>
            <button
              onClick={() => setActiveTab('hex')}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                activeTab === 'hex'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Hex Inspection
            </button>
          </div>

          {/* Search inside artifact */}
          {activeTab === 'text' && (
            <div className="relative flex items-center w-64">
              <span className="material-symbols-outlined absolute left-2 text-outline text-[16px]">
                search
              </span>
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search within artifact lines..."
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs font-data-mono pl-8 pr-3 py-1 rounded border border-outline-variant/60 focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Content View Area */}
        <div className="flex-1 overflow-auto p-4 bg-surface-container-lowest font-data-mono text-xs leading-relaxed select-text">
          {loading ? (
            <div className="py-20 text-center text-outline">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary mb-2">sync</span>
              <p>Reading immutable evidence bitstream...</p>
            </div>
          ) : activeTab === 'text' ? (
            filteredLines.length === 0 ? (
              <div className="text-outline text-center py-10">No lines matching search filter.</div>
            ) : (
              <div className="space-y-0.5">
                {filteredLines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-3 hover:bg-surface-container/50 px-1 py-0.5 rounded">
                    <span className="text-outline text-[10px] select-none w-10 text-right opacity-50 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-on-surface break-all">{line || ' '}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <pre className="text-cyan-300 font-data-mono text-[11px] leading-tight overflow-x-auto whitespace-pre">
              {data?.hex_preview || 'No hex preview available'}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container border-t border-outline-variant/60 flex items-center justify-between text-xs font-data-mono text-outline">
          <div>
            Total Artifact Lines: <span className="text-on-surface font-bold">{lines.length}</span>
            {filterText && ` (Filtered: ${filteredLines.length})`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded font-bold"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
