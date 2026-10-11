import React from 'react';

export const Findings: React.FC = () => {
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            <span className="font-headline-md text-[16px] tracking-tight font-bold text-on-surface uppercase">Analytical Findings & Epistemic Trace</span>
          </div>
          <span className="text-outline text-[11px]">::</span>
          <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/60 text-[11px]">
            <span className="text-on-surface-variant font-semibold">CASE_ID:</span>
            <span className="text-primary font-bold">SYN-001</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded font-bold text-[11px] hover:bg-sky-300 transition-colors shadow-[0_0_12px_rgba(56,189,248,0.25)]" type="button">
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            <span>Assert Finding</span>
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 mb-4">
          <h2 className="font-headline-md font-bold text-[14px] text-on-surface tracking-wider uppercase">Epistemic Flow Graph</h2>
          <div className="flex items-center gap-3 text-[10px] font-data-mono">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-verified rounded-full"></span>Verified</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-inference rounded-full"></span>Inference</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-hypothesis rounded-full"></span>Hypothesis</span>
          </div>
        </div>

        <div className="relative h-[220px] w-full overflow-hidden border border-outline-variant/30 rounded bg-surface-container-lowest flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 220">
            <defs>
              <linearGradient id="flow-ver-1" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45"></stop>
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.6"></stop>
              </linearGradient>
              <linearGradient id="flow-ver-2" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4"></stop>
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.55"></stop>
              </linearGradient>
              <linearGradient id="flow-inf-1" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35"></stop>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5"></stop>
              </linearGradient>
            </defs>
            <path d="M 180 32 C 240 32, 260 40, 340 40 L 340 68 C 260 68, 240 50, 180 50 Z" fill="url(#flow-ver-1)"></path>
            <path d="M 180 82 C 240 82, 260 92, 340 92 L 340 112 C 260 112, 240 98, 180 98 Z" fill="url(#flow-ver-2)"></path>
            <path d="M 180 134 C 240 134, 260 144, 340 144 L 340 162 C 260 162, 240 146, 180 146 Z" fill="url(#flow-inf-1)"></path>
            <path d="M 520 40 C 600 40, 620 34, 690 34 L 690 74 C 620 74, 600 68, 520 68 Z" fill="url(#flow-ver-1)"></path>
            <path d="M 520 92 C 580 92, 630 60, 690 60 L 690 74 C 630 74, 580 112, 520 112 Z" fill="url(#flow-ver-2)"></path>
            <path d="M 520 144 C 600 144, 630 130, 690 130 L 690 156 C 630 156, 600 162, 520 162 Z" fill="url(#flow-inf-1)"></path>
          </svg>
          
          <div className="absolute left-[40px] top-[25px] w-32 px-3 py-2 bg-surface-container border border-verified/50 rounded shadow-sm text-verified font-data-mono text-[9px] font-bold">EVTX / MFT</div>
          <div className="absolute left-[40px] top-[75px] w-32 px-3 py-2 bg-surface-container border border-verified/50 rounded shadow-sm text-verified font-data-mono text-[9px] font-bold">MEMORY / PCAP</div>
          <div className="absolute left-[40px] top-[125px] w-32 px-3 py-2 bg-surface-container border border-inference/50 rounded shadow-sm text-inference font-data-mono text-[9px] font-bold">SYSMON</div>
          
          <div className="absolute left-[360px] top-[30px] w-40 px-3 py-2 bg-surface-container-high border-l-2 border-l-verified border-y border-r border-outline-variant rounded shadow-sm text-on-surface font-data-mono text-[10px]">Staging to USB (Verified)</div>
          <div className="absolute left-[360px] top-[90px] w-40 px-3 py-2 bg-surface-container-high border-l-2 border-l-verified border-y border-r border-outline-variant rounded shadow-sm text-on-surface font-data-mono text-[10px]">Token Reused (Verified)</div>
          <div className="absolute left-[360px] top-[140px] w-40 px-3 py-2 bg-surface-container-high border-l-2 border-l-inference border-y border-r border-outline-variant rounded shadow-sm text-on-surface font-data-mono text-[10px]">svchost Masquerade</div>

          <div className="absolute left-[700px] top-[30px] w-48 px-3 py-2 bg-primary/10 border border-primary/50 rounded shadow-lg shadow-primary/20 text-on-surface font-headline-md font-bold text-[11px]">Conclusion A (Corporate Exfil)</div>
          <div className="absolute left-[700px] top-[130px] w-48 px-3 py-2 bg-surface-container-high border-l-4 border-l-inference border-y border-r border-outline-variant rounded shadow-md text-on-surface font-headline-md font-bold text-[11px]">Conclusion B (Lateral Staging)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-verified"></span>
              <span className="font-headline-md font-bold text-[13px] text-on-surface">Data Exfiltration to USB Device</span>
            </div>
            <span className="font-data-mono text-[10px] text-outline">FND-001</span>
          </div>
          <p className="text-[11px] text-outline leading-relaxed mt-1">
            Confirmed exfiltration of 3.84 GB of proprietary source code to a SanDisk Ultra USB drive. Verification established via matching file hashes on the USB and the local filesystem, corroborated by EVTX Event ID 4663 (File Access) and Event ID 4624 (Logon).
          </p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-outline-variant/40">
            <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-[9px] font-data-mono text-primary font-bold">EVD-001</span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-[9px] font-data-mono text-primary font-bold">EVD-003</span>
            <span className="text-[10px] text-outline ml-auto">Asserted by INV-841</span>
          </div>
        </div>
      </div>
    </div>
  );
};
