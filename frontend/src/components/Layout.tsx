import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCaseContext } from '../context/CaseContext';
import { CommandPalette } from './CommandPalette';
import { HealthDiagnosticsModal } from './HealthDiagnosticsModal';
import { AuditAlertsModal } from './AuditAlertsModal';

export const Layout: React.FC = () => {
  const {
    activeCase,
    activeCaseId,
    cases,
    setActiveCaseId,
    setIsSearchOpen,
    isHealthModalOpen,
    setIsHealthModalOpen,
    isAlertsModalOpen,
    setIsAlertsModalOpen,
  } = useCaseContext();

  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        {/* Top Notification Status Strip */}
        <div className="h-5 bg-surface-container-lowest border-b border-outline-variant/30 px-space-md flex items-center justify-between text-[10px] font-data-mono tracking-widest">
          <div className="flex items-center gap-space-sm text-error/90">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
            <span className="uppercase font-semibold">
              SYNTHETIC DEMO DATA ONLY // CHAIN OF CUSTODY INTEGRITY PROTOCOLS ENFORCED
            </span>
          </div>
          <div className="flex items-center gap-space-lg text-on-surface-variant/80">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px] text-verified">lock</span>
              AES-256-GCM / SHA-256
            </span>
            <span className="text-outline-variant">|</span>
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              NODE: 0x9AF4..E2
            </button>
          </div>
        </div>

        {/* Primary Header */}
        <header className="h-14 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant px-space-md flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            {/* Logo */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-space-sm pr-space-md border-r border-outline-variant cursor-pointer group"
            >
              <div className="w-7 h-7 rounded bg-surface-container-high border border-primary/40 group-hover:border-primary flex items-center justify-center text-primary font-headline-md tracking-tighter transition-colors">
                FX
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md tracking-tight font-bold text-on-surface leading-none group-hover:text-primary transition-colors">
                  FORENSIC-X
                </span>
                <span className="font-data-mono text-[10px] text-primary leading-none mt-0.5">
                  v2.4.1-lab
                </span>
              </div>
            </div>

            {/* Active Case Selector Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-space-xs bg-surface-container border border-outline-variant hover:border-primary/50 transition-colors px-space-sm py-space-xs rounded text-body-sm">
                <span className="text-on-surface-variant text-[10px] uppercase font-semibold">CASE:</span>
                <button
                  onClick={() => setIsCaseMenuOpen((prev) => !prev)}
                  className="flex items-center gap-space-xs text-primary font-data-mono text-[12px] hover:text-primary-fixed-dim transition-colors"
                  type="button"
                >
                  <span className="max-w-[210px] truncate">
                    {activeCase ? `[${activeCase.case_number}] ${activeCase.title}` : 'Select Investigation'}
                  </span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>

              {isCaseMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-surface-container-low border border-outline-variant rounded-lg shadow-xl z-50 p-1 font-data-mono text-xs">
                  <div className="text-[10px] uppercase font-bold text-outline px-2 py-1">
                    Select Active Investigation ({cases.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {cases.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveCaseId(c.id);
                          setIsCaseMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded flex items-center justify-between transition-colors ${
                          c.id === activeCaseId
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-primary font-bold mr-1">[{c.case_number}]</span>
                          <span>{c.title}</span>
                        </div>
                        <span className="text-[9px] uppercase px-1 rounded bg-surface-container-high text-outline">
                          {c.status}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-1 mt-1 border-t border-outline-variant/40 flex justify-between px-2">
                    <button
                      onClick={() => {
                        navigate('/cases/new');
                        setIsCaseMenuOpen(false);
                      }}
                      className="text-primary text-[10px] font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[12px]">add</span> New Case
                    </button>
                    <button
                      onClick={() => {
                        navigate('/cases');
                        setIsCaseMenuOpen(false);
                      }}
                      className="text-outline text-[10px] hover:text-on-surface"
                    >
                      View All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Global Search Input (Command Palette Trigger) */}
          <div className="flex-1 max-w-xl mx-space-md">
            <div
              onClick={() => setIsSearchOpen(true)}
              className="relative flex items-center w-full cursor-pointer group"
            >
              <span className="material-symbols-outlined absolute left-space-sm text-outline group-hover:text-primary text-[18px] transition-colors pointer-events-none">
                search
              </span>
              <input
                readOnly
                className="w-full bg-surface-container-lowest border border-outline-variant group-hover:border-primary/60 rounded pl-8 pr-12 py-1 text-data-mono text-on-surface placeholder:text-outline transition-colors text-[12px] cursor-pointer"
                placeholder="Search hashes, artifacts, case files... (cmd+k)"
                type="text"
              />
              <span className="absolute right-space-sm text-[10px] font-data-mono text-outline border border-outline-variant/60 rounded px-1 group-hover:text-primary group-hover:border-primary transition-colors">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-space-md">
            {/* System Status Button */}
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="flex items-center gap-space-xs px-space-sm py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-primary/30 transition-colors cursor-pointer"
              title="Click to view full subsystem diagnostics"
            >
              <span className="w-2 h-2 rounded-full bg-verified animate-pulse"></span>
              <span className="font-data-mono text-[11px] text-primary font-medium tracking-wide uppercase">
                SYS NOMINAL
              </span>
            </button>

            {/* Investigator Identity */}
            <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded bg-surface-container border border-outline-variant text-[11px] font-data-mono text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-primary">fingerprint</span>
              <span className="text-on-surface">INV-841</span>
              <span className="text-outline">|</span>
              <span>TIER-3</span>
            </div>

            {/* Notifications Alert Bell */}
            <button
              onClick={() => setIsAlertsModalOpen(true)}
              aria-label="Audit Alerts"
              className="relative p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Audit Alerts & Custody Log"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>
          </div>
        </header>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className="fixed left-0 top-19 bottom-8 w-64 bg-surface-container-low border-r border-outline-variant z-40 flex flex-col justify-between overflow-y-auto"
        style={{ top: '4.75rem', bottom: 0 }}
      >
        <div className="p-space-sm space-y-space-md">
          <div className="space-y-space-xs">
            <div className="px-space-sm py-space-xs text-[10px] font-data-mono uppercase tracking-wider text-outline">
              Investigation
            </div>
            <nav className="space-y-0.5">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${
                    isActive
                      ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                Dashboard
              </NavLink>
              <NavLink
                to="/cases"
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${
                    isActive
                      ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">folder_open</span>
                Cases
              </NavLink>
              <NavLink
                to={activeCaseId ? `/cases/${activeCaseId}` : '/cases'}
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${
                    isActive
                      ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">layers</span>
                Case Overview
              </NavLink>
              <NavLink
                to="/evidence"
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${
                    isActive
                      ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">hard_drive</span>
                Evidence Matrix
              </NavLink>
              <NavLink
                to="/timeline"
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${
                    isActive
                      ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                Timeline Reconstruction
              </NavLink>
              <NavLink
                to="/graph"
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${
                    isActive
                      ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">hub</span>
                Relationship Graph
              </NavLink>
            </nav>
          </div>

          <div className="space-y-space-xs pt-space-xs border-t border-outline-variant/60">
            <div className="px-space-sm py-space-xs text-[10px] font-data-mono uppercase tracking-wider text-outline">
              Analysis & Audit
            </div>
            <nav className="space-y-0.5">
              <NavLink
                to="/findings"
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all text-[13px] ${
                    isActive
                      ? 'bg-surface-container-high text-primary border-l-2 border-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                Findings
              </NavLink>
              <button
                onClick={() => {
                  if (activeCaseId) navigate(`/cases/${activeCaseId}`);
                }}
                className="w-full flex items-center gap-space-sm px-space-sm py-space-xs rounded text-[13px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all text-left"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                Report / Export Dossier
              </button>
              <button
                onClick={() => setIsAlertsModalOpen(true)}
                className="w-full flex items-center gap-space-sm px-space-sm py-space-xs rounded text-[13px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all text-left"
              >
                <span className="material-symbols-outlined text-[18px] text-verified">verified_user</span>
                Audit Log
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Subsystem Status */}
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
            CASE: <span className="text-primary font-bold">{activeCase?.case_number || 'NONE'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64">
        <main className="relative pt-20 pb-8 min-h-screen bg-background px-space-md">
          <div className="flex flex-col w-full gap-y-space-md pb-space-md">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette />
      <HealthDiagnosticsModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
      />
      <AuditAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
      />
    </>
  );
};
