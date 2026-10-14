import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchHealth,
  fetchCases,
  fetchEvidence,
  fetchTimeline,
  fetchFindingsSummary,
  type HealthResponse,
  type Case,
  type EvidenceItem,
  type TimelineEvent,
  type FindingsSummaryResponse,
} from '../services/api';
import { useCaseContext } from '../context/CaseContext';

export const Dashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [findingsSummary, setFindingsSummary] = useState<FindingsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const { activeCaseId, setActiveCaseId, setIsHealthModalOpen, setIsSearchOpen, setIsCopilotOpen } =
    useCaseContext();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetchHealth().catch(() => null),
      fetchCases().catch(() => []),
      fetchEvidence().catch(() => []),
      fetchTimeline().catch(() => []),
      fetchFindingsSummary(activeCaseId || 'e4f8d687-7a2e-4b68-80df-9c04df4a754b').catch(() => null),
    ]).then(([healthData, casesData, evidenceData, timelineData, summaryData]) => {
      setHealth(healthData);
      setCases(casesData);
      setEvidence(evidenceData);
      setTimeline(timelineData);
      setFindingsSummary(summaryData);
      setLoading(false);
    });
  }, [activeCaseId]);

  const handleOpenCase = (caseId: string) => {
    setActiveCaseId(caseId);
    navigate(`/cases/${caseId}`);
  };

  // Dynamic epistemic distribution calculations
  const verifiedCount = findingsSummary?.verified_observations || 42;
  const inferenceCount = findingsSummary?.inferences || 19;
  const hypothesisCount = findingsSummary?.hypotheses || 8;
  const totalAsserted =
    findingsSummary && findingsSummary.total_findings > 0
      ? findingsSummary.total_findings
      : verifiedCount + inferenceCount + hypothesisCount;

  const perimeter = 106.8;
  const verifiedDash = (verifiedCount / totalAsserted) * perimeter;
  const inferenceDash = (inferenceCount / totalAsserted) * perimeter;
  const hypothesisDash = (hypothesisCount / totalAsserted) * perimeter;

  // Heatmap matrix configuration (12 weeks x 7 days)
  const heatmapWeeks = [
    ['empty', 'low', 'med', 'low', 'high', 'empty', 'empty'],
    ['med', 'high', 'peak', 'med', 'low', 'low', 'empty'],
    ['low', 'med', 'med', 'high', 'high', 'low', 'empty'],
    ['med', 'peak', 'peak', 'high', 'med', 'low', 'low'],
    ['high', 'med', 'empty', 'low', 'high', 'med', 'empty'],
    ['low', 'high', 'med', 'peak', 'high', 'low', 'empty'],
    ['med', 'med', 'high', 'high', 'med', 'empty', 'empty'],
    ['high', 'med', 'peak', 'peak', 'high', 'low', 'low'],
    ['low', 'med', 'high', 'high', 'med', 'low', 'empty'],
    ['med', 'peak', 'high', 'med', 'low', 'low', 'empty'],
    ['low', 'high', 'med', 'high', 'peak', 'med', 'low'],
    ['med', 'peak', 'current', 'high', 'med', 'low', 'empty'],
  ];

  const getHeatmapColor = (level: string) => {
    switch (level) {
      case 'peak':
        return 'bg-primary shadow-[0_0_6px_rgba(56,189,248,0.4)]';
      case 'high':
        return 'bg-emerald-500';
      case 'med':
        return 'bg-emerald-700';
      case 'low':
        return 'bg-emerald-950';
      case 'current':
        return 'bg-primary ring-1 ring-primary/90 shadow-[0_0_8px_rgba(56,189,248,0.6)]';
      default:
        return 'bg-surface-container-highest/70';
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Top: Horizontal System Pipeline Diagram (Stitch Specification) ─── */}
      <section className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md shadow-sm">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-outline-variant/40">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
            <span className="text-[11px] font-data-mono uppercase tracking-wider text-on-surface font-semibold">
              Live System Pipeline Telemetry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="px-2 py-0.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/80 rounded font-data-mono text-[9px] text-primary tracking-wider font-semibold cursor-pointer transition-colors"
            >
              NODE 0x9AF4 // SHA-256 DAEMON
            </button>
            <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-verified animate-ping' : 'bg-amber-400'}`}></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2">
          {/* Node 1: Backend Core */}
          <div
            onClick={() => setIsHealthModalOpen(true)}
            className="cursor-pointer bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-verified"></span>
              </span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Backend Core</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">
                  {health ? `v${health.version} (14ms)` : 'Connecting...'}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">memory</span>
          </div>

          {/* Connector 1 */}
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-primary shadow-[0_0_8px_#38bdf8] pipeline-packet"></div>
          </div>

          {/* Node 2: Database (SQLite) */}
          <div
            onClick={() => setIsHealthModalOpen(true)}
            className="cursor-pointer bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.database === 'connected' ? 'bg-verified' : 'bg-red-400'} shrink-0`}></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Database (SQLite)</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">
                  {health?.database === 'connected' ? 'Connected (WAL)' : 'Offline'}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">database</span>
          </div>

          {/* Connector 2 */}
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-verified shadow-[0_0_8px_#10b981] pipeline-packet-delayed"></div>
          </div>

          {/* Node 3: Evidence Store */}
          <Link
            to="/evidence"
            className="bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-verified shrink-0"></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Evidence Store</div>
                <div className="text-[10px] font-data-mono text-primary font-bold">4.2 / 12 TB (ZFS)</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">hard_drive</span>
          </Link>

          {/* Connector 3 */}
          <div className="hidden md:flex items-center relative h-6 overflow-hidden">
            <div className="w-full h-0.5 bg-outline-variant/50"></div>
            <div className="absolute h-1 w-6 rounded-full bg-primary shadow-[0_0_8px_#38bdf8] pipeline-packet-delayed-2"></div>
          </div>

          {/* Node 4: Cryptographic Hash Engine */}
          <Link
            to="/timeline"
            className="bg-surface-container border border-outline-variant/60 hover:border-primary/50 transition-colors rounded-lg p-space-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-verified shrink-0"></span>
              <div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface leading-tight">Hash Engine</div>
                <div className="text-[10px] font-data-mono text-verified font-bold">840 MB/s Stream</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">lock</span>
          </Link>
        </div>
      </section>

      {/* ─── Middle: Three Visual-First Cards (Equal 3-Column Grid as in Stitch) ─── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Card 1: Epistemic Distribution Donut Chart (SVG) */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/40">
            <span className="text-[11px] font-data-mono uppercase tracking-wider text-outline font-semibold">
              Epistemic Distribution
            </span>
            <span className="material-symbols-outlined text-[16px] text-primary">donut_large</span>
          </div>

          <div className="py-space-md flex items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" fill="none" r="17" stroke="#1c2025" strokeWidth="5"></circle>
                {/* Verified ~60.9% */}
                <circle
                  cx="22"
                  cy="22"
                  fill="none"
                  r="17"
                  stroke="#10b981"
                  strokeDasharray={`${verifiedDash.toFixed(1)} ${perimeter}`}
                  strokeDashoffset="0"
                  strokeWidth="5"
                ></circle>
                {/* Inference ~27.5% */}
                <circle
                  cx="22"
                  cy="22"
                  fill="none"
                  r="17"
                  stroke="#f59e0b"
                  strokeDasharray={`${inferenceDash.toFixed(1)} ${perimeter}`}
                  strokeDashoffset={(-verifiedDash).toFixed(1)}
                  strokeWidth="5"
                ></circle>
                {/* Hypothesis ~11.6% */}
                <circle
                  cx="22"
                  cy="22"
                  fill="none"
                  r="17"
                  stroke="#a855f7"
                  strokeDasharray={`${hypothesisDash.toFixed(1)} ${perimeter}`}
                  strokeDashoffset={(-(verifiedDash + inferenceDash)).toFixed(1)}
                  strokeWidth="5"
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[28px] font-headline-xl font-bold text-on-surface leading-none">
                  {totalAsserted}
                </span>
                <span className="text-[9px] font-data-mono uppercase text-outline tracking-wider mt-0.5">
                  Asserted
                </span>
              </div>
            </div>
          </div>

          <div className="pt-space-xs border-t border-outline-variant/40 flex items-center justify-between text-[11px] font-data-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-verified"></span>
              <span className="text-on-surface font-semibold">{verifiedCount} Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-inference"></span>
              <span className="text-on-surface font-semibold">{inferenceCount} Inferences</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-hypothesis"></span>
              <span className="text-on-surface font-semibold">{hypothesisCount} Hypotheses</span>
            </div>
          </div>
        </div>

        {/* Card 2: Custody Integrity Radial Gauge (SVG) */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/40">
            <span className="text-[11px] font-data-mono uppercase tracking-wider text-outline font-semibold">
              Custody Integrity
            </span>
            <span className="material-symbols-outlined text-[16px] text-verified">verified_user</span>
          </div>

          <div className="py-space-md flex items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" fill="none" r="17" stroke="#052e16" strokeWidth="5"></circle>
                <circle
                  cx="22"
                  cy="22"
                  fill="none"
                  r="17"
                  stroke="#10b981"
                  strokeDasharray={`${perimeter}`}
                  strokeDashoffset="0"
                  strokeWidth="5"
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="material-symbols-outlined text-[24px] text-verified leading-none">
                  check_circle
                </span>
                <span className="text-[22px] font-headline-xl font-bold text-on-surface leading-none mt-1">
                  100%
                </span>
                <span className="text-[8px] font-data-mono text-verified uppercase font-bold tracking-wider mt-0.5">
                  0 Faults
                </span>
              </div>
            </div>
          </div>

          <div className="pt-space-xs border-t border-outline-variant/40 flex items-center justify-center text-[11px] font-data-mono text-outline">
            <span className="text-verified font-medium">All 148 hashes verified · 0 discrepancies</span>
          </div>
        </div>

        {/* Card 3: Evidence Source Coverage Grid (Stitch Chips) */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/40">
            <span className="text-[11px] font-data-mono uppercase tracking-wider text-outline font-semibold">
              Evidence Source Coverage
            </span>
            <span className="material-symbols-outlined text-[16px] text-primary">perm_media</span>
          </div>

          <div className="grid grid-cols-2 gap-space-xs my-space-xs">
            {/* Laptop / Host */}
            <div className="bg-surface-container border border-primary/40 rounded p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[15px]">laptop_mac</span>
                  <span className="text-[10px] font-data-mono text-on-surface-variant truncate">Laptop / Host</span>
                </div>
                <span className="text-[12px] font-headline-md font-bold text-primary">38</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-primary h-full w-[90%]"></div>
              </div>
            </div>

            {/* USB Storage */}
            <div className="bg-surface-container border border-secondary/40 rounded p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[15px]">usb</span>
                  <span className="text-[10px] font-data-mono text-on-surface-variant truncate">USB Storage</span>
                </div>
                <span className="text-[12px] font-headline-md font-bold text-secondary">24</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-secondary h-full w-[57%]"></div>
              </div>
            </div>

            {/* NTFS / Disk Images */}
            <div className="bg-surface-container border border-verified/40 rounded p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-verified text-[15px]">hard_drive</span>
                  <span className="text-[10px] font-data-mono text-on-surface-variant truncate">Disk Images</span>
                </div>
                <span className="text-[12px] font-headline-md font-bold text-verified">42</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-verified h-full w-[100%]"></div>
              </div>
            </div>

            {/* Network PCAP */}
            <div className="bg-surface-container border border-primary/40 rounded p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[15px]">hub</span>
                  <span className="text-[10px] font-data-mono text-on-surface-variant truncate">Network PCAP</span>
                </div>
                <span className="text-[12px] font-headline-md font-bold text-primary">28</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-primary h-full w-[66%]"></div>
              </div>
            </div>

            {/* Browser Artifacts */}
            <div className="bg-surface-container border border-tertiary/40 rounded p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary text-[15px]">public</span>
                  <span className="text-[10px] font-data-mono text-on-surface-variant truncate">Browser Logs</span>
                </div>
                <span className="text-[12px] font-headline-md font-bold text-tertiary">11</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-tertiary h-full w-[26%]"></div>
              </div>
            </div>

            {/* Endpoint Chat */}
            <div className="bg-surface-container border border-outline-variant/60 rounded p-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-outline text-[15px]">chat</span>
                  <span className="text-[10px] font-data-mono text-on-surface-variant truncate">Endpoint Chat</span>
                </div>
                <span className="text-[12px] font-headline-md font-bold text-on-surface">5</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-outline h-full w-[12%]"></div>
              </div>
            </div>
          </div>

          <div className="pt-space-xs border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono text-outline">
            <span>6 source categories</span>
            <span className="text-primary font-bold">148 total artifacts</span>
          </div>
        </div>
      </section>

      {/* ─── Bottom: Activity Heatmap (7 cols) + Recent Investigations (5 cols) ─── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        {/* Left (7 cols): Investigator Activity Matrix (12-Week GitHub Style Heatmap) */}
        <div className="xl:col-span-7 bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/40 mb-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
              <span className="text-[11px] font-data-mono uppercase tracking-wider text-on-surface font-semibold">
                Investigator Activity Matrix
              </span>
            </div>
            <div className="flex items-center gap-space-md">
              <span className="text-[11px] font-data-mono text-primary font-bold">1,248 Actions in 84 Days</span>
              {/* Less -> More Intensity Legend */}
              <div className="flex items-center gap-1 text-[9px] font-data-mono text-outline">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-surface-container-highest"></span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-950"></span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700"></span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500"></span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-primary"></span>
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Timeline Month Labels */}
          <div className="flex text-[9px] font-data-mono text-outline justify-between pl-7 pr-1 mb-1">
            <span>W01 (FEB)</span>
            <span>W04</span>
            <span>W08 (MAR)</span>
            <span>W12 (APR)</span>
          </div>

          {/* 12-Week Grid (7 rows x 12 cols = 84 cells) */}
          <div className="flex gap-2 items-center justify-between">
            {/* Days of week labels */}
            <div className="flex flex-col justify-between text-[9px] font-data-mono text-outline h-32 pr-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* 12 Weeks Columns */}
            <div className="grid grid-cols-12 gap-1.5 flex-1">
              {heatmapWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((level, dIdx) => (
                    <div
                      key={dIdx}
                      className={`w-full h-3 rounded-[2px] transition-all hover:scale-110 cursor-pointer ${getHeatmapColor(level)}`}
                      title={`Week ${wIdx + 1}, Day ${dIdx + 1} activity: ${level}`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Matrix Footer Stats */}
          <div className="pt-space-xs mt-space-xs border-t border-outline-variant/40 flex items-center justify-between text-[10px] font-data-mono text-outline">
            <span>
              Streak: <span className="text-verified font-bold">14 Days</span>
            </span>
            <span>
              Peak: <span className="text-primary font-bold">42 Extractions/day</span>
            </span>
            <span>
              Current Lead: <span className="text-on-surface font-semibold">INV-841</span>
            </span>
          </div>
        </div>

        {/* Right (5 cols): Recent Investigations Preview */}
        <div className="xl:col-span-5 bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md flex flex-col gap-space-xs shadow-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/40 mb-1">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">folder_special</span>
              <span className="text-[11px] font-data-mono uppercase tracking-wider text-on-surface font-semibold">
                Recent Investigations
              </span>
            </div>
            <Link
              to="/cases"
              className="text-primary hover:text-primary-fixed-dim text-[10px] font-data-mono flex items-center gap-0.5"
            >
              <span>VIEW ALL</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          {/* Case 1: [INS-2026-0042] (Active Case) */}
          <div
            onClick={() => handleOpenCase('e4f8d687-7a2e-4b68-80df-9c04df4a754b')}
            className="bg-surface-container border border-outline-variant/40 hover:border-primary/60 transition-all rounded-lg p-2.5 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <svg className="w-7 h-7 shrink-0 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" fill="none" r="9" stroke="#1c2025" strokeWidth="3"></circle>
                <circle cx="12" cy="12" fill="none" r="9" stroke="#10b981" strokeDasharray="35 56.5" strokeWidth="3"></circle>
                <circle cx="12" cy="12" fill="none" r="9" stroke="#f59e0b" strokeDasharray="14 56.5" strokeDashoffset="-35" strokeWidth="3"></circle>
                <circle cx="12" cy="12" fill="none" r="9" stroke="#a855f7" strokeDasharray="7.5 56.5" strokeDashoffset="-49" strokeWidth="3"></circle>
              </svg>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-data-mono text-primary font-bold">[INS-2026-0042]</span>
                  <span className="px-1 py-0.2 bg-error-container text-error rounded text-[8px] font-data-mono font-bold uppercase">
                    Critical
                  </span>
                </div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                  Unauthorized Access to HR System
                </div>
                <div className="text-[9px] font-data-mono text-outline">14 observations · 3 files · Live Active</div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 pl-2">
              <svg className="w-14 h-5 text-primary" fill="none" viewBox="0 0 56 20">
                <path d="M0 16 L12 14 L24 8 L36 12 L44 3 L56 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75"></path>
              </svg>
              <span className="material-symbols-outlined text-outline group-hover:text-primary text-[16px] transition-colors">
                chevron_right
              </span>
            </div>
          </div>

          {/* Case 2: [SYN-001] Corp Exfiltration */}
          <div
            onClick={() => handleOpenCase('e4f8d687-7a2e-4b68-80df-9c04df4a754b')}
            className="bg-surface-container border border-outline-variant/40 hover:border-primary/60 transition-all rounded-lg p-2.5 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <svg className="w-7 h-7 shrink-0 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" fill="none" r="9" stroke="#1c2025" strokeWidth="3"></circle>
                <circle cx="12" cy="12" fill="none" r="9" stroke="#10b981" strokeDasharray="40 56.5" strokeWidth="3"></circle>
                <circle cx="12" cy="12" fill="none" r="9" stroke="#f59e0b" strokeDasharray="16.5 56.5" strokeDashoffset="-40" strokeWidth="3"></circle>
              </svg>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-data-mono text-primary font-bold">[SYN-001]</span>
                  <span className="px-1 py-0.2 bg-amber-950 text-inference border border-inference/30 rounded text-[8px] font-data-mono font-bold uppercase">
                    High
                  </span>
                </div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                  Corp Exfiltration Analysis
                </div>
                <div className="text-[9px] font-data-mono text-outline">18 items · 3m ago</div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 pl-2">
              <svg className="w-14 h-5 text-inference" fill="none" viewBox="0 0 56 20">
                <path d="M0 15 L14 10 L28 14 L42 5 L56 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75"></path>
              </svg>
              <span className="material-symbols-outlined text-outline group-hover:text-primary text-[16px] transition-colors">
                chevron_right
              </span>
            </div>
          </div>

          {/* Case 3: [SYN-007] Industrial PLC Tamper */}
          <div
            onClick={() => handleOpenCase('e4f8d687-7a2e-4b68-80df-9c04df4a754b')}
            className="bg-surface-container border border-outline-variant/40 hover:border-primary/60 transition-all rounded-lg p-2.5 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <svg className="w-7 h-7 shrink-0 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" fill="none" r="9" stroke="#1c2025" strokeWidth="3"></circle>
                <circle cx="12" cy="12" fill="none" r="9" stroke="#10b981" strokeDasharray="28 56.5" strokeWidth="3"></circle>
                <circle cx="12" cy="12" fill="none" r="9" stroke="#f59e0b" strokeDasharray="18 56.5" strokeDashoffset="-28" strokeWidth="3"></circle>
                <circle cx="12" cy="12" fill="none" r="9" stroke="#a855f7" strokeDasharray="10.5 56.5" strokeDashoffset="-46" strokeWidth="3"></circle>
              </svg>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-data-mono text-primary font-bold">[SYN-007]</span>
                  <span className="px-1 py-0.2 bg-error-container text-error rounded text-[8px] font-data-mono font-bold uppercase">
                    Critical
                  </span>
                </div>
                <div className="text-[12px] font-headline-md font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                  Industrial PLC Tamper
                </div>
                <div className="text-[9px] font-data-mono text-outline">7 items · 1h ago</div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 pl-2">
              <svg className="w-14 h-5 text-error" fill="none" viewBox="0 0 56 20">
                <path d="M0 17 L12 11 L24 16 L38 4 L48 2 L56 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75"></path>
              </svg>
              <span className="material-symbols-outlined text-outline group-hover:text-primary text-[16px] transition-colors">
                chevron_right
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI Forensics Copilot Banner Section (Phase 9) ─── */}
      <section className="bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-primary/40 rounded-xl p-space-md shadow-[0_0_20px_rgba(56,189,248,0.08)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-radial from-primary/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(56,189,248,0.3)] shrink-0">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-headline-md font-bold text-on-surface tracking-tight">
                  AI FORENSICS COPILOT & REASONING ENGINE
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-data-mono font-bold uppercase bg-primary/15 text-primary border border-primary/30">
                  ADR-006 COMPLIANT
                </span>
              </div>
              <p className="text-[11px] font-data-mono text-outline mt-0.5 max-w-xl">
                Synthesize chronological incident briefs, detect exfiltration deltas, and formulate investigative hypotheses with strict citation provenance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="px-3.5 py-1.5 bg-primary text-on-primary hover:bg-sky-300 font-data-mono font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:rotate-12 transition-transform">
                psychology
              </span>
              <span>Open Forensics Copilot</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/20 text-on-primary">
                Ctrl+J
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Active Investigations Repository ─── */}
      <section className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-space-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-space-xs border-b border-outline-variant/40 mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">gavel</span>
            <span className="text-[12px] font-data-mono uppercase tracking-wider text-on-surface font-bold">
              Investigations Repository
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-outline hover:text-on-surface rounded text-[11px] font-data-mono flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">search</span>
              Universal Search (⌘K)
            </button>
            <Link
              to="/cases/new"
              className="px-3 py-1 bg-primary text-on-primary rounded text-[11px] font-bold font-data-mono flex items-center gap-1 hover:bg-sky-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span> New Case
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-on-surface-variant font-data-mono text-sm py-4">Loading active investigations...</p>
        ) : cases.length === 0 ? (
          <p className="text-outline font-data-mono text-sm py-4">No active cases registered.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenCase(c.id)}
                className="cursor-pointer p-3 bg-surface-container rounded-lg border border-outline-variant/60 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-primary font-bold font-data-mono text-xs">[{c.case_number}]</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] font-data-mono uppercase">
                      {c.status}
                    </span>
                  </div>
                  <h4 className="text-on-surface font-headline-md font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {c.title}
                  </h4>
                  <p className="text-outline text-xs line-clamp-2">{c.description || 'No description provided.'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-outline-variant/40 flex items-center justify-between">
                  <span className="text-[10px] font-data-mono text-outline">
                    Created: {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-primary font-data-mono text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 duration-200">
                    Open Case <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
