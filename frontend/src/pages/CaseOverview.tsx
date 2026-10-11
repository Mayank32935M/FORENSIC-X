import React from 'react';

export const CaseOverview: React.FC = () => {
  return (
    <div className="space-y-4 w-full">
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col xl:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-headline-xl text-3xl font-bold text-on-surface tracking-tight">Corporate Laptop Data Exfiltration</span>
            <span className="px-2 py-0.5 rounded bg-error/20 border border-error/50 text-error font-data-mono text-[10px] font-bold uppercase tracking-wider">P1 Critical</span>
          </div>
          <p className="text-outline text-sm max-w-3xl leading-relaxed">
            Investigation into unauthorized access and exfiltration of proprietary source code (algo_v2.py) by an exiting employee via USB mass storage device.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2.5 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-[18px] text-primary">badge</span>
              <div className="flex flex-col">
                <span className="text-outline font-data-mono text-[10px] uppercase">Investigator</span>
                <span className="text-on-surface font-semibold font-data-mono text-xs">INV-841</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-[18px] text-secondary">calendar_clock</span>
              <div className="flex flex-col">
                <span className="text-outline font-data-mono text-[10px] uppercase">Timestamp</span>
                <span className="text-on-surface font-data-mono text-xs">2026-10-10 10:11 UTC</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-[18px] text-primary">gavel</span>
              <div className="flex flex-col">
                <span className="text-outline font-data-mono text-[10px] uppercase">Case ID</span>
                <span className="text-on-surface font-data-mono text-xs font-semibold">SYN-001</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap xl:flex-col gap-2 shrink-0 pt-2 xl:pt-0">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-surface-container-lowest px-4 py-2 rounded-lg font-headline-md text-xs font-bold shadow-[0_0_15px_rgba(56,189,248,0.35)] hover:bg-cyan-300 transition-all active:scale-[0.98]" type="button">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            + Ingest Evidence Item
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg font-headline-md text-xs font-semibold transition-all shadow-sm" type="button">
            <span className="material-symbols-outlined text-[18px]">fingerprint</span>
            Generate Interim Audit Hash
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface hover:text-primary px-4 py-2 rounded-lg font-headline-md text-xs transition-all" type="button">
            <span className="material-symbols-outlined text-[18px] text-primary">archive</span>
            Export Case Package
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-data-mono text-[10px] uppercase text-outline tracking-wider font-semibold">SEIZED ARTIFACTS</div>
              <div className="font-headline-xl text-2xl text-on-surface font-bold mt-0.5">18 Items</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">hard_drive</span>
            </div>
          </div>
          <div className="flex items-center gap-3.5 my-2">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="14" stroke="#1c2025" strokeWidth="3.5"></circle>
                <circle cx="18" cy="18" fill="none" r="14" stroke="#38bdf8" strokeDasharray="44.4 100" strokeDashoffset="0" strokeWidth="3.5"></circle>
                <circle cx="18" cy="18" fill="none" r="14" stroke="#4edea3" strokeDasharray="33.3 100" strokeDashoffset="-44.4" strokeWidth="3.5"></circle>
                <circle cx="18" cy="18" fill="none" r="14" stroke="#cbb6ff" strokeDasharray="22.2 100" strokeDashoffset="-77.7" strokeWidth="3.5"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline-md text-xs font-bold text-on-surface leading-none">18</span>
                <span className="font-data-mono text-[7px] text-outline uppercase">TOT</span>
              </div>
            </div>
            <div className="flex-1 space-y-1 font-data-mono text-[10px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>Disks</span>
                <span className="text-on-surface font-semibold">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#cbb6ff]"></span>Dumps</span>
                <span className="text-on-surface font-semibold">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>PCAPs</span>
                <span className="text-on-surface font-semibold">8</span>
              </div>
            </div>
          </div>
          <div className="pt-1.5 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono">
            <span className="text-secondary flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">verified</span>100% SHA-256 MATCH</span>
            <span className="text-outline">ReadOnly</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-md flex flex-col justify-between group hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-data-mono text-[10px] uppercase text-outline tracking-wider font-semibold">EXTRACTED TIMELINE</div>
              <div className="font-headline-xl text-2xl text-on-surface font-bold mt-0.5">1,429 Events</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">equalizer</span>
            </div>
          </div>
          <div className="my-2 bg-surface-container-lowest/80 p-2 rounded border border-outline-variant/40">
            <div className="flex items-center justify-between text-[9px] font-data-mono text-outline mb-1">
              <span>-72h</span>
              <span className="text-primary font-semibold flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-primary animate-ping"></span>PEAK CLUSTER: T+38h</span>
              <span>NOW</span>
            </div>
            <svg className="w-full h-10" preserveAspectRatio="none" viewBox="0 0 160 40">
              <line stroke="#1f242b" strokeWidth="0.5" x1="0" x2="160" y1="10" y2="10"></line>
              <line stroke="#1f242b" strokeWidth="0.5" x1="0" x2="160" y1="25" y2="25"></line>
              <rect fill="#3c494e" height="6" rx="1" width="4" x="4" y="34"></rect>
              <rect fill="#3c494e" height="10" rx="1" width="4" x="12" y="30"></rect>
              <rect fill="#3c494e" height="8" rx="1" width="4" x="20" y="32"></rect>
              <rect fill="#38bdf8" fillOpacity="0.5" height="14" rx="1" width="4" x="28" y="26"></rect>
              <rect fill="#38bdf8" fillOpacity="0.6" height="18" rx="1" width="4" x="36" y="22"></rect>
              <rect fill="#38bdf8" fillOpacity="0.7" height="24" rx="1" width="4" x="44" y="16"></rect>
              <rect fill="#38bdf8" fillOpacity="0.9" height="32" rx="1" width="4" x="52" y="8"></rect>
              <rect fill="#38bdf8" height="38" rx="1" width="4" x="60" y="2"></rect>
              <rect fill="#38bdf8" height="35" rx="1" width="4" x="68" y="5"></rect>
              <rect fill="#4edea3" height="28" rx="1" width="4" x="76" y="12"></rect>
              <rect fill="#38bdf8" fillOpacity="0.7" height="20" rx="1" width="4" x="84" y="20"></rect>
              <rect fill="#38bdf8" fillOpacity="0.5" height="12" rx="1" width="4" x="92" y="28"></rect>
              <rect fill="#3c494e" height="8" rx="1" width="4" x="100" y="32"></rect>
              <rect fill="#3c494e" height="12" rx="1" width="4" x="108" y="28"></rect>
              <rect fill="#38bdf8" fillOpacity="0.6" height="16" rx="1" width="4" x="116" y="24"></rect>
              <rect fill="#38bdf8" fillOpacity="0.5" height="14" rx="1" width="4" x="124" y="26"></rect>
              <rect fill="#3c494e" height="8" rx="1" width="4" x="132" y="32"></rect>
              <rect fill="#3c494e" height="6" rx="1" width="4" x="140" y="34"></rect>
              <rect fill="#38bdf8" height="10" rx="1" width="4" x="148" y="30"></rect>
            </svg>
          </div>
          <div className="pt-1.5 border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono text-outline">
            <span>5 Normalized Timelines</span>
            <span className="text-primary font-semibold">Exfiltration Bursts (3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
