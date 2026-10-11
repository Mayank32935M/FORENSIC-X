import React from 'react';

export const Timeline: React.FC = () => {
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
            <span className="font-headline-md text-[16px] tracking-tight font-bold text-on-surface uppercase">Temporal Event Reconstruction</span>
          </div>
          <span className="text-outline text-[11px]">::</span>
          <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/60 text-[11px]">
            <span className="text-on-surface-variant font-semibold">CASE_ID:</span>
            <span className="text-primary font-bold">SYN-001</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/50 text-primary rounded font-bold text-[11px] hover:bg-primary/20 transition-colors shadow-sm" type="button">
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Sync NTP Offset</span>
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low border border-error/40 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-error/20 border border-error flex items-center justify-center text-error shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[28px] animate-pulse">timer_off</span>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-headline-md text-[14px] font-bold text-on-surface">CLOCK-SKEW ANOMALY DETECTED</span>
                <span className="px-2 py-0.5 rounded bg-error/20 border border-error/40 text-error font-data-mono text-[10px] font-bold">+00:04:18.291 DRIFT</span>
                <span className="bg-surface-container px-2 py-0.5 rounded text-outline font-data-mono text-[9px]">DESKTOP-X4929 BIOS</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-data-mono text-[10px]">
                <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/40">
                  <span className="material-symbols-outlined text-[13px] text-verified">schedule</span>
                  <span className="text-outline">NTP ATOMIC:</span>
                  <span className="text-on-surface font-bold">12:44:19.104 UTC</span>
                </div>
                <span className="text-error font-bold text-[14px] leading-none">⇄</span>
                <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded border border-error/40">
                  <span className="material-symbols-outlined text-[13px] text-error">warning</span>
                  <span className="text-outline">CAPTURED HOST:</span>
                  <span className="text-error font-bold">12:48:37.395 EST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-3 font-data-mono text-[10px] text-outline">
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold border border-outline-variant/60">T-0 : Incident Genesis</span>
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            <span>Chronological Forward</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-verified/20 text-verified border border-verified/50 font-data-mono text-[9px] font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">shield</span>VERIFIED (8)</span>
            <span className="px-2 py-0.5 rounded-full bg-inference/20 text-inference border border-inference/50 font-data-mono text-[9px] font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">insights</span>INFERENCE (2)</span>
          </div>
        </div>

        <div className="relative pl-6 space-y-6">
          <div className="absolute top-0 bottom-0 left-2 w-0.5 bg-outline-variant/40"></div>
          
          <div className="relative">
            <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-surface-container-high border-2 border-verified flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-verified rounded-full"></div>
            </div>
            <div className="bg-surface-container border border-outline-variant/60 rounded-lg p-3 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-data-mono text-[12px] text-verified font-bold">2026-10-09 23:14:02 UTC</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-data-mono text-[9px] font-bold border border-outline-variant">EVTX:4624</span>
                </div>
                <span className="text-[10px] text-outline font-data-mono">T - 3h 14m</span>
              </div>
              <div className="font-headline-md font-bold text-[13px] text-on-surface mb-1">Interactive Logon Sequence (J.Doe_Acct)</div>
              <p className="text-[11px] text-outline">User logged onto DEV-LPT-99 locally outside of business hours.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-surface-container-high border-2 border-verified flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-verified rounded-full"></div>
            </div>
            <div className="bg-surface-container border border-outline-variant/60 rounded-lg p-3 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-data-mono text-[12px] text-verified font-bold">2026-10-10 00:01:45 UTC</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-data-mono text-[9px] font-bold border border-outline-variant">SYSMON:1</span>
                </div>
                <span className="text-[10px] text-outline font-data-mono">T - 2h 26m</span>
              </div>
              <div className="font-headline-md font-bold text-[13px] text-on-surface mb-1">Process Creation (powershell.exe)</div>
              <p className="text-[11px] text-outline">PowerShell launched with execution policy bypass. Encoded command detected.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-surface-container-high border-2 border-inference flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-inference">question_mark</span>
            </div>
            <div className="bg-surface-container border border-outline-variant/60 rounded-lg p-3 hover:border-inference/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-data-mono text-[12px] text-inference font-bold">2026-10-10 01:14:22 UTC</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-data-mono text-[9px] font-bold border border-outline-variant">PCAP</span>
                </div>
                <span className="text-[10px] text-outline font-data-mono">T - 1h 13m</span>
              </div>
              <div className="font-headline-md font-bold text-[13px] text-on-surface mb-1">Large Outbound Transfer Anomaly</div>
              <p className="text-[11px] text-outline">High volume encrypted traffic (TLS) over port 443 to unknown external IP. Correlated with spike in Disk I/O reads.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-surface-container-high border-2 border-verified flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-verified rounded-full"></div>
            </div>
            <div className="bg-surface-container border border-outline-variant/60 rounded-lg p-3 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-data-mono text-[12px] text-verified font-bold">2026-10-10 02:28:11 UTC</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-data-mono text-[9px] font-bold border border-outline-variant">USB:MOUNT</span>
                </div>
                <span className="text-[10px] text-error font-data-mono font-bold">T - 0 (INCIDENT)</span>
              </div>
              <div className="font-headline-md font-bold text-[13px] text-on-surface mb-1">SanDisk Ultra USB Mass Storage Attached</div>
              <p className="text-[11px] text-outline">Device serial 4398188219 mounted as Drive E:. Rapid succession of file copy events logged in MFT.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
