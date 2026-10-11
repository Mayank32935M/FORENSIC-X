import React from 'react';

interface AuditAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditAlertsModal: React.FC<AuditAlertsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const alerts = [
    {
      id: '1',
      title: 'Custody Chain Cryptographic Verification',
      detail: 'Chain-of-Custody hash integrity validated for Case INS-2026-0042. Zero broken blocks detected.',
      level: 'SUCCESS',
      time: 'Just now',
    },
    {
      id: '2',
      title: 'Evidence Bitstream Verification (auth.log)',
      detail: 'On-disk SHA-256 match confirmed: 59fa4eb42cbd990aaf7461549da4db63da0e19e75d18c41dfe6975612a809a01.',
      level: 'SUCCESS',
      time: '2 minutes ago',
    },
    {
      id: '3',
      title: 'Clock Skew Anomaly Detected',
      detail: '+00:04:18.291 drift detected between host clock and atomic NTP. Time canonicalized to UTC.',
      level: 'WARNING',
      time: '15 minutes ago',
    },
    {
      id: '4',
      title: 'Evidence Artifact Seized (syslog_snippet.log)',
      detail: 'Live kernel syslog artifact ingested. Block ACQUIRED appended to ledger with prior block link.',
      level: 'INFO',
      time: '1 hour ago',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container-low border border-primary/50 rounded-xl max-w-lg w-full shadow-2xl p-5 space-y-4 font-data-mono animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
            <h3 className="font-headline-md font-bold text-base text-on-surface">
              Forensic Audit & Integrity Log
            </h3>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="p-3 rounded-lg bg-surface-container border border-outline-variant/50 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded border ${
                    a.level === 'SUCCESS'
                      ? 'bg-verified/15 text-verified border-verified/40'
                      : a.level === 'WARNING'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                      : 'bg-primary/15 text-primary border-primary/40'
                  }`}
                >
                  {a.level}
                </span>
                <span className="text-[10px] text-outline">{a.time}</span>
              </div>
              <div className="text-on-surface font-semibold text-xs mt-1">{a.title}</div>
              <p className="text-[11px] text-outline leading-relaxed">{a.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-outline-variant/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface rounded text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
