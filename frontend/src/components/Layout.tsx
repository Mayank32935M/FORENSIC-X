import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <div className="h-5 bg-surface-container-lowest border-b border-outline-variant/30 px-space-md flex items-center justify-between text-[10px] font-data-mono tracking-widest">
          <div className="flex items-center gap-space-sm text-error/90">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
            <span className="uppercase font-semibold">SYNTHETIC DEMO DATA ONLY // CHAIN OF CUSTODY INTEGRITY PROTOCOLS ENFORCED</span>
          </div>
          <div className="flex items-center gap-space-lg text-on-surface-variant/80">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px] text-verified">lock</span>
              AES-256-GCM / SHA-256
            </span>
            <span className="text-outline-variant">|</span>
            <span>NODE: 0x9AF4..E2</span>
          </div>
        </div>

        <header className="h-14 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant px-space-md flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm pr-space-md border-r border-outline-variant">
              <div className="w-7 h-7 rounded bg-surface-container-high border border-primary/40 flex items-center justify-center text-primary font-headline-md tracking-tighter">FX</div>
              <div className="flex flex-col">
                <span className="font-headline-md tracking-tight font-bold text-on-surface leading-none">FORENSIC-X</span>
                <span className="font-data-mono text-[10px] text-primary leading-none mt-0.5">v2.4.1-lab</span>
              </div>
            </div>
            
            <div className="flex items-center gap-space-xs bg-surface-container border border-outline-variant px-space-sm py-space-xs rounded text-body-sm">
              <span className="text-on-surface-variant text-[10px] uppercase font-semibold">CASE:</span>
              <button className="flex items-center gap-space-xs text-primary font-data-mono text-[12px] hover:text-primary-fixed-dim transition-colors" type="button">
                <span className="max-w-[210px] truncate">[SYN-001] Corp Exfiltration Analysis</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-space-md">
            <div className="relative flex items-center w-full">
              <span className="material-symbols-outlined absolute left-space-sm text-outline text-[18px] pointer-events-none">search</span>
              <input className="w-full bg-surface-container-lowest border border-outline-variant rounded pl-8 pr-12 py-1 text-data-mono text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors text-[12px]" placeholder="Search hashes, artifacts, case files... (cmd+k)" type="text" />
              <span className="absolute right-space-sm text-[10px] font-data-mono text-outline border border-outline-variant/60 rounded px-1">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded bg-surface-container-high border border-primary/30">
              <span className="w-2 h-2 rounded-full bg-verified animate-pulse"></span>
              <span className="font-data-mono text-[11px] text-primary font-medium tracking-wide uppercase">SYS NOMINAL</span>
            </div>
            <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded bg-surface-container border border-outline-variant text-[11px] font-data-mono text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-primary">fingerprint</span>
              <span className="text-on-surface">INV-841</span>
              <span className="text-outline">|</span>
              <span>TIER-3</span>
            </div>
            <button aria-label="Audit Alerts" className="relative p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors" type="button">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <div className="flex items-center gap-space-xs pl-space-xs border-l border-outline-variant">
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover border border-outline-variant" src="https://lh3.googleusercontent.com/aida/AEtjO1XDVXcDN7bjJsRCxshevvCDfxH8zlN1GdttX5UWzWB3GICS5NlUA6gVDJjcxlF2-b5v37dCGGzCd_pdQpJvq1ORx4hx5OdSD-oHiapBGG6FDnKxwkXKWOQcxlu7UJcMHBKAR8b7BQuWtztIgbYJ8kujP3uQSfkoEe3nToTMIOGFqhc1S_KCOhGprAOWGkr6wUmuV0jQQCDFDaLLdAoqZ4byLD-kLE8eskRHRkAf9QKewDab5y65rNeCu38" />
            </div>
          </div>
        </header>
      </div>

      <aside className="fixed left-0 top-19 bottom-8 w-64 bg-surface-container-low border-r border-outline-variant z-40 flex flex-col justify-between overflow-y-auto" style={{ top: '4.75rem', bottom: 0 }}>
        <div className="p-space-sm space-y-space-md">
          <div className="space-y-space-xs">
            <div className="px-space-sm py-space-xs text-[10px] font-data-mono uppercase tracking-wider text-outline">Investigation</div>
            <nav className="space-y-0.5">
              <NavLink to="/" className={({ isActive }) => `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${isActive ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                Dashboard
              </NavLink>
              <NavLink to="/cases" className={({ isActive }) => `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${isActive ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-[18px]">folder_open</span>
                Cases
              </NavLink>
              <NavLink to="/cases/1" className={({ isActive }) => `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${isActive ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-[18px]">layers</span>
                Case Overview
              </NavLink>
              <NavLink to="/evidence" className={({ isActive }) => `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${isActive ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-[18px]">hard_drive</span>
                Evidence
              </NavLink>
              <NavLink to="/timeline" className={({ isActive }) => `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${isActive ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                Timeline
              </NavLink>
              <NavLink to="/graph" className={({ isActive }) => `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${isActive ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-[18px]">hub</span>
                Relationship Graph
              </NavLink>
            </nav>
          </div>
          <div className="space-y-space-xs pt-space-xs border-t border-outline-variant/60">
            <div className="px-space-sm py-space-xs text-[10px] font-data-mono uppercase tracking-wider text-outline">Analysis & Audit</div>
            <nav className="space-y-0.5">
              <NavLink to="/findings" className={({ isActive }) => `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${isActive ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                Findings
              </NavLink>
              <a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded text-[13px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                Forensic Copilot
              </a>
              <a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded text-[13px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">description</span>
                Report Export
              </a>
              <a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded text-[13px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Audit Log
              </a>
            </nav>
          </div>
        </div>
        <div className="p-space-sm border-t border-outline-variant bg-surface-container-lowest/80 text-[11px] font-data-mono space-y-space-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>STORAGE NODE</span>
            <span className="text-primary font-semibold">4.2 / 12 TB</span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[35%]"></div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/40">
            <span className="flex items-center gap-1 text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>
              SHA-256 ENG
            </span>
            <span className="text-verified font-semibold">ONLINE</span>
          </div>
          <div className="text-[10px] text-outline text-right font-data-mono tracking-tight">
            UTC: <span className="text-on-surface">2026-10-10 10:14:02</span>
          </div>
        </div>
      </aside>

      <div className="pl-64">
        <main className="relative pt-20 pb-8 min-h-screen bg-background px-space-md">
          <div className="flex flex-col w-full gap-y-space-md pb-space-md">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
};
