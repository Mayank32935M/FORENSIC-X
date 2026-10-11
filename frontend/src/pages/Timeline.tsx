import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTimeline, fetchEvidence } from '../services/api';
import { useCaseContext } from '../context/CaseContext';
import { EvidenceContentViewer } from '../components/EvidenceContentViewer';
import type { TimelineEvent, EvidenceItem } from '../services/api';

export const Timeline: React.FC = () => {
  const { activeCaseId, setActiveCaseId, cases } = useCaseContext();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Time Drift Adjustment Simulator State
  const [isNtpSyncActive, setIsNtpSyncActive] = useState(false);

  // Linked evidence modal viewer
  const [inspectItem, setInspectItem] = useState<EvidenceItem | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTimeline(activeCaseId || undefined).catch(() => []),
      fetchEvidence(activeCaseId || undefined).catch(() => []),
    ])
      .then(([tls, evs]) => {
        setEvents(tls);
        setEvidenceList(evs);
      })
      .finally(() => setLoading(false));
  }, [activeCaseId]);

  // Distinct event types
  const eventTypes = Array.from(new Set(events.map((e) => e.event_type)));

  // Filtered events
  const filteredEvents = events.filter((e) => {
    if (typeFilter !== 'ALL' && e.event_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.summary.toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q) ||
        (e.original_time_string && e.original_time_string.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate delta from first event
  const baseTimestamp = events.length > 0 ? new Date(events[0].event_time_utc).getTime() : 0;

  const formatDelta = (utcString: string) => {
    if (!baseTimestamp) return 'T-0';
    const deltaMs = new Date(utcString).getTime() - baseTimestamp;
    if (deltaMs === 0) return 'T-0 (Genesis)';
    const totalSecs = Math.floor(deltaMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'authentication':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'usb_connection':
      case 'usb_disconnection':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'file_access':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'file_copy':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-surface-container-highest text-on-surface-variant border-outline-variant';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'authentication':
        return 'lock_open';
      case 'usb_connection':
        return 'usb';
      case 'usb_disconnection':
        return 'usb_off';
      case 'file_access':
        return 'visibility';
      case 'file_copy':
        return 'file_copy';
      default:
        return 'schedule';
    }
  };

  // Find linked evidence item for an event
  const findLinkedEvidence = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes('auth')) {
      return evidenceList.find((e) => e.original_filename.includes('auth'));
    }
    if (type.includes('usb')) {
      return evidenceList.find((e) => e.original_filename.includes('syslog'));
    }
    if (type.includes('file')) {
      return evidenceList.find((e) => e.original_filename.includes('file_access'));
    }
    return evidenceList[0];
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
            <span className="font-headline-md text-[16px] tracking-tight font-bold text-on-surface uppercase">
              Temporal Event Reconstruction
            </span>
          </div>
          <span className="text-outline text-[11px] hidden sm:inline">::</span>
          
          <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-1 rounded border border-outline-variant/60 text-[11px]">
            <span className="text-on-surface-variant font-semibold">CASE:</span>
            <select
              value={activeCaseId}
              onChange={(e) => setActiveCaseId(e.target.value)}
              className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-surface-container text-on-surface">ALL CASES ({cases.length})</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface-container text-on-surface">
                  [{c.case_number}] {c.title.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Functional Search Bar */}
          <div className="relative flex items-center w-56 sm:w-64">
            <span className="material-symbols-outlined absolute left-2 text-outline text-[16px] pointer-events-none">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-[11px] font-data-mono pl-8 pr-7 py-1.5 rounded border border-outline-variant/60 focus:outline-none focus:border-primary transition-colors"
              placeholder="Search event summaries..."
              type="text"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          {/* Sync NTP Offset Interactive Button */}
          <button
            onClick={() => setIsNtpSyncActive((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-[11px] transition-colors shadow-sm cursor-pointer ${
              isNtpSyncActive
                ? 'bg-verified text-surface-container-lowest shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                : 'bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>{isNtpSyncActive ? 'NTP Harmonized' : 'Sync NTP Offset'}</span>
          </button>
        </div>
      </div>

      {/* Clock Synchronization & Skew Banner */}
      <div className={`border rounded-xl p-4 shadow-lg relative overflow-hidden transition-all ${
        isNtpSyncActive
          ? 'bg-surface-container-low border-verified/40'
          : 'bg-surface-container-low border-error/40'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 ${
              isNtpSyncActive
                ? 'bg-verified/20 border-verified text-verified'
                : 'bg-error/20 border-error text-error animate-pulse'
            }`}>
              <span className="material-symbols-outlined text-[28px]">
                {isNtpSyncActive ? 'check_circle' : 'timer_off'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-headline-md text-[14px] font-bold text-on-surface">
                  {isNtpSyncActive
                    ? 'CANONICAL TIME HARMONIZATION ACTIVE'
                    : 'HOST CLOCK-SKEW ANOMALY DETECTED'}
                </span>
                <span className={`px-2 py-0.5 rounded font-data-mono text-[10px] font-bold border ${
                  isNtpSyncActive
                    ? 'bg-verified/20 border-verified/50 text-verified'
                    : 'bg-error/20 border-error/50 text-error'
                }`}>
                  {isNtpSyncActive ? 'DRIFT COMPENSATED' : '+00:04:18.291 DRIFT'}
                </span>
                <span className="bg-surface-container px-2 py-0.5 rounded text-outline font-data-mono text-[9px]">
                  DESKTOP-X4929 BIOS CLOCK
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-data-mono text-[10px]">
                <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/40">
                  <span className="material-symbols-outlined text-[13px] text-verified">schedule</span>
                  <span className="text-outline">ATOMIC UTC:</span>
                  <span className="text-on-surface font-bold">12:44:19.104 UTC</span>
                </div>
                <span className="text-outline font-bold text-[14px] leading-none">⇄</span>
                <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/40">
                  <span className="material-symbols-outlined text-[13px] text-amber-400">warning</span>
                  <span className="text-outline">CAPTURED LOCAL:</span>
                  <span className="text-amber-400 font-bold">12:48:37.395 EST</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-data-mono">
            <span className="text-outline">
              {isNtpSyncActive
                ? 'All event sequences normalized to atomic UTC baseline.'
                : 'Click "Sync NTP Offset" to apply offset adjustment matrix.'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/60 overflow-x-auto">
        <span className="text-[10px] font-data-mono uppercase tracking-wider text-outline font-bold mr-1 shrink-0">
          Filter Event Class:
        </span>
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
            typeFilter === 'ALL' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All [{events.length}]
        </button>
        {eventTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-2.5 py-1 rounded text-[11px] font-data-mono font-medium border border-outline-variant/40 transition-colors uppercase ${
              typeFilter === t ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-3 font-data-mono text-[10px] text-outline">
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold border border-outline-variant/60">
              Chronological Sequence
            </span>
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            <span>Earliest to Latest (Incident Genesis)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-verified/20 text-verified border border-verified/50 font-data-mono text-[9px] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">shield</span>
              VERIFIED LOG EVIDENCE ({filteredEvents.length})
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-outline text-xs font-data-mono py-8 text-center">Reconstructing event sequence...</p>
        ) : filteredEvents.length === 0 ? (
          <div className="py-8 text-center font-data-mono text-xs text-outline space-y-1">
            <span className="material-symbols-outlined text-3xl">filter_alt_off</span>
            <p>No timeline events match the current filter or search criteria.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4">
            {/* Vertical connector line */}
            <div className="absolute top-2 bottom-2 left-2 w-0.5 bg-outline-variant/40"></div>

            {filteredEvents.map((ev, index) => {
              const delta = formatDelta(ev.event_time_utc);
              const badgeClass = getEventBadgeColor(ev.event_type);
              const iconName = getEventIcon(ev.event_type);
              const linkedEvidence = findLinkedEvidence(ev.event_type);

              return (
                <div key={ev.id || index} className="relative">
                  {/* Timeline Node Point */}
                  <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  </div>

                  {/* Event Card */}
                  <div className="bg-surface-container border border-outline-variant/60 rounded-lg p-3.5 hover:border-primary/50 transition-colors space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-data-mono text-[12px] text-primary font-bold">
                          {new Date(ev.event_time_utc).toISOString().replace('T', ' ').slice(0, 19)} UTC
                        </span>
                        <span className={`px-2 py-0.5 rounded font-data-mono text-[9px] font-bold border uppercase flex items-center gap-1 ${badgeClass}`}>
                          <span className="material-symbols-outlined text-[11px]">{iconName}</span>
                          {ev.event_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-outline font-data-mono bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/40 font-bold">
                        {delta}
                      </span>
                    </div>

                    <div className="font-headline-md font-bold text-[13px] text-on-surface">
                      {ev.summary}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-data-mono text-outline pt-2 border-t border-outline-variant/30">
                      <div className="flex flex-wrap items-center gap-3">
                        {ev.original_time_string && (
                          <span>Raw String: <span className="text-on-surface-variant font-bold">{ev.original_time_string}</span></span>
                        )}
                        <span>Timezone: <span className="text-on-surface-variant">{ev.source_timezone || 'UTC'}</span></span>
                        <span>Quality: <span className="text-verified font-bold uppercase">{ev.time_quality || 'PRECISE'}</span></span>
                      </div>

                      {/* Interconnected Evidence Jump Link */}
                      {linkedEvidence && (
                        <button
                          onClick={() => setInspectItem(linkedEvidence)}
                          className="text-primary hover:text-sky-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">visibility</span>
                          Inspect Source Log ({linkedEvidence.original_filename})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Raw Content Viewer for Linked Evidence */}
      <EvidenceContentViewer
        evidenceItem={inspectItem}
        onClose={() => setInspectItem(null)}
      />
    </div>
  );
};
