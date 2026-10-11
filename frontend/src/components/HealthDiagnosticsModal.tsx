import React, { useState, useEffect } from 'react';
import { fetchHealth } from '../services/api';
import type { HealthResponse } from '../services/api';

interface HealthDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthDiagnosticsModal: React.FC<HealthDiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetchHealth();
      setLatency(Math.round(performance.now() - start));
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container-low border border-primary/50 rounded-xl max-w-lg w-full shadow-2xl p-5 space-y-4 font-data-mono animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-verified animate-ping"></span>
            <h3 className="font-headline-md font-bold text-base text-on-surface">
              Core Forensic Daemon Diagnostics
            </h3>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[10px]">Daemon Status:</span>
              <span className="text-verified font-bold uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-verified"></span>
                {health?.status === 'ok' ? 'ONLINE (NOMINAL)' : 'UNREACHABLE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[10px]">API Latency:</span>
              <span className="text-primary font-bold">{latency !== null ? `${latency} ms` : 'Testing...'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[10px]">Database Engine:</span>
              <span className="text-on-surface font-semibold">SQLite (aiosqlite async)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[10px]">DB Connection:</span>
              <span className="text-verified font-bold uppercase">{health?.database || 'disconnected'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[10px]">Core Version:</span>
              <span className="text-on-surface font-semibold">{health ? `v${health.version}` : 'v0.1.0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase text-[10px]">Environment:</span>
              <span className="text-on-surface font-semibold uppercase">{health?.environment || 'development'}</span>
            </div>
          </div>

          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/50 space-y-1.5 text-[11px]">
            <div className="font-bold text-primary uppercase text-[10px]">Cryptographic Subsystems</div>
            <div className="flex items-center justify-between text-outline">
              <span>Hash Algorithm:</span>
              <span className="text-on-surface font-bold">SHA-256 (NIST FIPS 180-4)</span>
            </div>
            <div className="flex items-center justify-between text-outline">
              <span>Custody Ledger:</span>
              <span className="text-verified font-bold">Append-Only Merkle Hash Chain</span>
            </div>
            <div className="flex items-center justify-between text-outline">
              <span>Evidence Preservation:</span>
              <span className="text-verified font-bold">Immutable Filesystem Store</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60">
          <button
            onClick={checkHealth}
            disabled={loading}
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary rounded text-xs font-bold flex items-center gap-1"
          >
            <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            Re-test Node
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-primary text-on-primary rounded text-xs font-bold hover:bg-sky-300"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
