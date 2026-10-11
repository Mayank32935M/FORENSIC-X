import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <>
      <section className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-outline-variant/40">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
            <span className="text-[11px] font-data-mono uppercase tracking-wider text-on-surface font-semibold">System Pipeline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-surface-container border border-outline-variant/80 rounded font-data-mono text-[9px] text-primary tracking-wider font-semibold">NODE 0x9AF4 // SHA-256 DAEMON</span>
            <span className="w-2 h-2 rounded-full bg-verified animate-ping"></span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2">
          <div className="bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-verified"></span>
              </span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Backend Core</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">14ms latency</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">memory</span>
          </div>
          
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-primary shadow-[0_0_8px_#38bdf8] pipeline-packet"></div>
          </div>
          
          <div className="bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-verified shrink-0"></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Database (SQLite)</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">Local File</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">database</span>
          </div>
          
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-verified shadow-[0_0_8px_#10b981] pipeline-packet-delayed"></div>
          </div>
          
          <div className="bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-verified shrink-0"></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Evidence Store</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">Immutable FS</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">hard_drive</span>
          </div>
          
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-primary shadow-[0_0_8px_#38bdf8] pipeline-packet-delayed-2"></div>
          </div>
          
          <div className="bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-verified shrink-0"></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Hash Engine</div>
                <div className="text-[10px] font-data-mono text-verified font-bold">Active</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">lock</span>
          </div>
        </div>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md mt-space-md">
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/40">
            <span className="text-[11px] font-data-mono uppercase tracking-wider text-outline font-semibold">Epistemic Distribution</span>
            <span className="material-symbols-outlined text-[16px] text-primary">donut_large</span>
          </div>
          <div className="py-space-md flex items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" fill="none" r="17" stroke="#1c2025" strokeWidth="5"></circle>
                <circle cx="22" cy="22" fill="none" r="17" stroke="#10b981" strokeDasharray="65.1 106.8" strokeDashoffset="0" strokeWidth="5"></circle>
                <circle cx="22" cy="22" fill="none" r="17" stroke="#f59e0b" strokeDasharray="29.4 106.8" strokeDashoffset="-65.1" strokeWidth="5"></circle>
                <circle cx="22" cy="22" fill="none" r="17" stroke="#a855f7" strokeDasharray="12.3 106.8" strokeDashoffset="-94.5" strokeWidth="5"></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[28px] font-headline-xl font-bold text-on-surface leading-none">69</span>
                <span className="text-[9px] font-data-mono uppercase text-outline tracking-wider mt-0.5">Asserted</span>
              </div>
            </div>
          </div>
          <div className="pt-space-xs border-t border-outline-variant/40 flex items-center justify-between text-[11px] font-data-mono">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-verified"></span><span className="text-on-surface font-semibold">42 Verified</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-inference"></span><span className="text-on-surface font-semibold">19 Inferences</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-hypothesis"></span><span className="text-on-surface font-semibold">8 Hypotheses</span></div>
          </div>
        </div>
        
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/40">
            <span className="text-[11px] font-data-mono uppercase tracking-wider text-outline font-semibold">Custody Integrity</span>
            <span className="material-symbols-outlined text-[16px] text-verified">verified_user</span>
          </div>
          <div className="py-space-md flex items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" fill="none" r="17" stroke="#052e16" strokeWidth="5"></circle>
                <circle cx="22" cy="22" fill="none" r="17" stroke="#10b981" strokeDasharray="106.8 106.8" strokeDashoffset="0" strokeWidth="5"></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="material-symbols-outlined text-[24px] text-verified leading-none">check_circle</span>
                <span className="text-[22px] font-headline-xl font-bold text-on-surface leading-none mt-1">100%</span>
                <span className="text-[8px] font-data-mono text-verified uppercase font-bold tracking-wider mt-0.5">0 Faults</span>
              </div>
            </div>
          </div>
          <div className="pt-space-xs border-t border-outline-variant/40 flex items-center justify-center text-[11px] font-data-mono text-outline">
            <span className="text-verified font-medium">All hashes verified · 0 discrepancies</span>
          </div>
        </div>
      </section>
    </>
  );
};
