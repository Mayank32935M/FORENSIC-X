import React from 'react';

export const Evidence: React.FC = () => {
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <span className="font-headline-md text-[16px] tracking-tight font-bold text-on-surface uppercase">Evidence Repository & Custody Matrix</span>
          </div>
          <span className="text-outline text-[11px]">::</span>
          <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/60 text-[11px]">
            <span className="text-on-surface-variant font-semibold">CASE_ID:</span>
            <span className="text-primary font-bold">SYN-001</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-surface-container px-2 py-0.5 rounded border border-outline-variant/50 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-verified shadow-[0_0_6px_#22c55e]"></span>
            <span className="text-on-surface-variant">LEDGER HEIGHT:</span>
            <span className="text-verified font-bold">#14,208</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center w-64">
            <span className="material-symbols-outlined absolute left-2 text-outline text-[16px] pointer-events-none">search</span>
            <input className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-[11px] font-data-mono pl-8 pr-10 py-1.5 rounded border border-outline-variant/60 focus:outline-none focus:border-primary transition-colors" placeholder="Filter artifacts, hashes, serials..." type="text"/>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded font-bold text-[11px] hover:bg-sky-300 transition-colors shadow-[0_0_12px_rgba(56,189,248,0.25)]" type="button">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Ingest Artifact</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/70 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-data-mono uppercase tracking-wider text-outline font-bold mr-2 shrink-0">Filter Scope:</span>
          <button className="px-2.5 py-1 rounded text-[11px] font-bold bg-primary text-on-primary flex items-center gap-1">
            <span>All</span>
            <span className="opacity-80">[18]</span>
          </button>
          <button className="px-2.5 py-1 rounded text-[11px] font-medium bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 border border-outline-variant/40">
            <span>Disk Clones</span>
            <span className="text-outline">[4]</span>
          </button>
          <button className="px-2.5 py-1 rounded text-[11px] font-medium bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 border border-outline-variant/40">
            <span>Volatile RAM</span>
            <span className="text-outline">[2]</span>
          </button>
          <button className="px-2.5 py-1 rounded text-[11px] font-medium bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 border border-outline-variant/40">
            <span>Network PCAP</span>
            <span className="text-outline">[6]</span>
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] font-data-mono">
          <span className="flex items-center gap-1 text-verified font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>
            17 INTACT // 1 TAMPERED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start w-full">
        {/* Evidence Tile 1 */}
        <div className="cursor-pointer p-3 rounded-lg bg-surface-container-high border-2 border-primary/60 relative flex flex-col justify-between gap-3 shadow-[0_0_12px_rgba(56,189,248,0.15)] group transition-all">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-surface-container border border-primary/40 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">hard_drive</span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-primary font-bold text-[11px] font-data-mono">EVD-001</span>
                  <span className="px-1.5 py-0.5 bg-primary/15 text-primary text-[9px] font-bold rounded uppercase">NVMe</span>
                </div>
                <div className="text-[10px] text-outline font-data-mono mt-0.5">SN: S4EVNF0R</div>
              </div>
            </div>
            <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="14" stroke="#1c2025" strokeWidth="3.5"></circle>
                <circle cx="18" cy="18" fill="none" r="14" stroke="#22c55e" strokeDasharray="88, 100" strokeLinecap="round" strokeWidth="3.5"></circle>
              </svg>
              <span className="absolute text-[8px] text-verified font-bold">100%</span>
            </div>
          </div>
          <div>
            <div className="font-data-mono font-bold text-[12px] text-on-surface truncate">nvme_samsung980_raw.dd</div>
            <div className="text-[10px] text-outline flex items-center gap-1 mt-1">
              <span>Raw Physical Bitstream</span><span>•</span><span className="text-on-surface-variant font-data-mono">512 B/sect</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-1">
            <div className="flex items-center justify-between text-[10px] font-data-mono">
              <span className="text-on-surface font-semibold">512 GB <span className="text-outline">/ 1024 GB</span></span>
              <span className="text-primary font-bold">50% ALLOC</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[50%]"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 mt-1">
            <span className="font-data-mono text-[10px] text-outline truncate max-w-[120px]">HASH: e3b0c442..825b</span>
            <span className="px-1.5 py-0.5 bg-verified/15 text-verified border border-verified/40 rounded text-[9px] font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>VERIFIED
            </span>
          </div>
        </div>

        {/* Evidence Tile 2 */}
        <div className="cursor-pointer p-3 rounded-lg bg-surface-container-low border border-outline-variant/60 hover:border-primary/40 relative flex flex-col justify-between gap-3 group transition-all">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-surface-container border border-outline-variant flex items-center justify-center text-cyan-300">
                <span className="material-symbols-outlined text-[18px]">memory</span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant font-bold text-[11px] font-data-mono">EVD-002</span>
                  <span className="px-1.5 py-0.5 bg-surface-container-highest text-cyan-300 text-[9px] font-bold rounded uppercase">RAM</span>
                </div>
                <div className="text-[10px] text-outline font-data-mono mt-0.5">HOST_WS_09</div>
              </div>
            </div>
            <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="14" stroke="#1c2025" strokeWidth="3.5"></circle>
                <circle cx="18" cy="18" fill="none" r="14" stroke="#22c55e" strokeDasharray="88, 100" strokeLinecap="round" strokeWidth="3.5"></circle>
              </svg>
              <span className="absolute text-[8px] text-verified font-bold">100%</span>
            </div>
          </div>
          <div>
            <div className="font-data-mono font-bold text-[12px] text-on-surface truncate">volatility_ram_dump.raw</div>
            <div className="text-[10px] text-outline flex items-center gap-1 mt-1">
              <span>Volatile Memory Dump</span><span>•</span><span className="text-on-surface-variant font-data-mono">DDR4_2666</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-1">
            <div className="flex items-center justify-between text-[10px] font-data-mono">
              <span className="text-on-surface font-semibold">32 GB <span className="text-outline">/ 64 GB</span></span>
              <span className="text-outline font-bold">50%</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full w-[50%]"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 mt-1">
            <span className="font-data-mono text-[10px] text-outline truncate max-w-[120px]">HASH: d41d8cd9..cf84</span>
            <span className="px-1.5 py-0.5 bg-verified/15 text-verified border border-verified/40 rounded text-[9px] font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>VERIFIED
            </span>
          </div>
        </div>

        {/* Evidence Tile 3 (Tampered) */}
        <div className="cursor-pointer p-3 rounded-lg bg-surface-container-low border border-red-500/40 hover:border-red-500/60 relative flex flex-col justify-between gap-3 group transition-all">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/40 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[18px]">broken_image</span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-error font-bold text-[11px] font-data-mono">EVD-006</span>
                  <span className="px-1.5 py-0.5 bg-error/15 text-error text-[9px] font-bold rounded uppercase">TAMPER</span>
                </div>
                <div className="text-[10px] text-outline font-data-mono mt-0.5">VSS_SHADOW_03</div>
              </div>
            </div>
            <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="14" stroke="#1c2025" strokeWidth="3.5"></circle>
                <circle cx="18" cy="18" fill="none" r="14" stroke="#ef4444" strokeDasharray="45, 100" strokeLinecap="round" strokeWidth="3.5"></circle>
              </svg>
              <span className="absolute text-[8px] text-error font-bold">FAIL</span>
            </div>
          </div>
          <div>
            <div className="font-data-mono font-bold text-[12px] text-error truncate">tampered_shadowcopy.dd</div>
            <div className="text-[10px] text-outline flex items-center gap-1 mt-1">
              <span>VSS Volume Snapshot</span><span>•</span><span className="text-error font-data-mono font-semibold">HASH MISMATCH</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-1">
            <div className="flex items-center justify-between text-[10px] font-data-mono">
              <span className="text-on-surface font-semibold">128 GB <span className="text-outline">/ 512 GB</span></span>
              <span className="text-error font-bold">SEAL VOID</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full w-[25%]"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 mt-1">
            <span className="font-data-mono text-[10px] text-error truncate max-w-[120px]">HASH: 0xDEAD..BEEF</span>
            <span className="px-1.5 py-0.5 bg-red-500/10 text-error border border-red-500/40 rounded text-[9px] font-bold uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">warning</span>ALERT
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
