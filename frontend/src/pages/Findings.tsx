import React, { useEffect, useState } from 'react';
import { useCaseContext } from '../context/CaseContext';
import {
  fetchFindings,
  fetchFindingsSummary,
  createFinding,
  deleteFinding,
  fetchObservations,
  fetchObservation,
} from '../services/api';
import type {
  Finding,
  FindingsSummaryResponse,
  EpistemicTier,
  Observation,
} from '../services/api';

export const Findings: React.FC = () => {
  const { activeCaseId, cases, setActiveCaseId } = useCaseContext();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<FindingsSummaryResponse | null>(null);
  const [availableObservations, setAvailableObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<'ALL' | EpistemicTier>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTier, setNewTier] = useState<EpistemicTier>('verified_observation');
  const [newConfidence, setNewConfidence] = useState<number>(0.95);
  const [newReasoning, setNewReasoning] = useState('');
  const [selectedObsIds, setSelectedObsIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Citation Inspector Modal State
  const [inspectCitationObs, setInspectCitationObs] = useState<Observation | null>(null);
  const [loadingCitation, setLoadingCitation] = useState(false);

  const targetCaseId = activeCaseId || cases[0]?.id;

  const loadData = async () => {
    if (!targetCaseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fnds, sum, obs] = await Promise.all([
        fetchFindings(targetCaseId),
        fetchFindingsSummary(targetCaseId).catch(() => null),
        fetchObservations(targetCaseId).catch(() => []),
      ]);
      setFindings(fnds);
      setSummary(sum);
      setAvailableObservations(obs);
    } catch (err) {
      console.error('Failed to load findings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetCaseId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCaseId) return;
    setSubmitting(true);
    setCreateError('');

    if (newTier === 'inference' && !newReasoning.trim()) {
      setCreateError('Inferences require explicit analytical reasoning explaining the leap from facts.');
      setSubmitting(false);
      return;
    }

    try {
      await createFinding(targetCaseId, {
        title: newTitle,
        description: newDescription,
        epistemic_tier: newTier,
        confidence_score: newConfidence,
        supporting_observation_ids: selectedObsIds,
        reasoning: newTier === 'inference' ? newReasoning : undefined,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewReasoning('');
      setSelectedObsIds([]);
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to record finding');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (findingId: string) => {
    if (!window.confirm('Are you sure you want to delete this analytical finding?')) return;
    try {
      await deleteFinding(findingId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete finding:', err);
    }
  };

  const handleInspectCitation = async (obsId: string) => {
    // Check locally first
    const foundLocal = availableObservations.find((o) => o.id === obsId);
    if (foundLocal) {
      setInspectCitationObs(foundLocal);
      return;
    }
    setLoadingCitation(true);
    try {
      const fetched = await fetchObservation(obsId);
      setInspectCitationObs(fetched);
    } catch (err) {
      console.error('Failed to fetch citation details:', err);
    } finally {
      setLoadingCitation(false);
    }
  };

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (tierFilter !== 'ALL' && f.epistemic_tier !== tierFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.reasoning && f.reasoning.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getTierBadge = (tier: EpistemicTier) => {
    switch (tier) {
      case 'verified_observation':
        return {
          label: 'VERIFIED OBSERVATION',
          sub: 'Direct Evidence Grounding',
          bg: 'bg-verified/15 text-verified border-verified/40',
          dot: 'bg-verified',
        };
      case 'inference':
        return {
          label: 'INFERENCE',
          sub: 'Correlated Analytical Leap',
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
          dot: 'bg-amber-400',
        };
      case 'hypothesis':
        return {
          label: 'HYPOTHESIS',
          sub: 'Subject to Corroboration',
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
          dot: 'bg-purple-400',
        };
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            <span className="font-headline-md text-[16px] font-bold text-on-surface uppercase tracking-tight">
              Epistemic Findings & Truth Tiers
            </span>
          </div>
          <span className="text-outline text-[11px] hidden sm:inline">::</span>

          {/* Synchronized Case Selector */}
          <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/60 text-[11px]">
            <span className="text-on-surface-variant font-semibold">CASE:</span>
            <select
              value={targetCaseId}
              onChange={(e) => setActiveCaseId(e.target.value)}
              className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface-container text-on-surface">
                  [{c.case_number}] {c.title.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex items-center w-56 sm:w-64">
            <span className="material-symbols-outlined absolute left-2 text-outline text-[16px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings, reasoning..."
              className="w-full bg-surface-container-lowest text-on-surface text-[11px] font-data-mono pl-8 pr-7 py-1.5 rounded border border-outline-variant/60 focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded font-bold text-[11px] hover:bg-sky-300 transition-colors shadow-[0_0_12px_rgba(56,189,248,0.25)]"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            <span>Record Finding</span>
          </button>
        </div>
      </div>

      {/* Epistemic Health & Metrics Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-data-mono text-[11px]">
          <div className="p-3 bg-surface-container-low border border-outline-variant/70 rounded-lg">
            <div className="text-[10px] text-outline uppercase font-bold">Total Findings</div>
            <div className="text-xl font-bold text-on-surface mt-1">{summary.total_findings}</div>
            <div className="text-[9px] text-outline mt-0.5">Analytic conclusions</div>
          </div>
          <div className="p-3 bg-surface-container-low border border-verified/40 rounded-lg">
            <div className="text-[10px] text-verified uppercase font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>
              Direct Observations
            </div>
            <div className="text-xl font-bold text-verified mt-1">{summary.verified_observations}</div>
            <div className="text-[9px] text-outline mt-0.5">100% evidentiary certainty</div>
          </div>
          <div className="p-3 bg-surface-container-low border border-amber-500/40 rounded-lg">
            <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Inferences
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">{summary.inferences}</div>
            <div className="text-[9px] text-outline mt-0.5">Corroborated deductions</div>
          </div>
          <div className="p-3 bg-surface-container-low border border-purple-500/40 rounded-lg">
            <div className="text-[10px] text-purple-400 uppercase font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              Hypotheses
            </div>
            <div className="text-xl font-bold text-purple-400 mt-1">{summary.hypotheses}</div>
            <div className="text-[9px] text-outline mt-0.5">Requires external proof</div>
          </div>
          <div className="p-3 bg-surface-container-low border border-outline-variant/70 rounded-lg">
            <div className="text-[10px] text-primary uppercase font-bold">Citation Coverage</div>
            <div className="text-xl font-bold text-primary mt-1">{summary.citation_coverage_pct}%</div>
            <div className="text-[9px] text-outline mt-0.5">Evidence provenance backed</div>
          </div>
        </div>
      )}

      {/* Epistemic Tier Filter Tabs */}
      <div className="flex items-center justify-between gap-2 bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/70 overflow-x-auto">
        <div className="flex items-center gap-1.5 font-data-mono text-[11px]">
          <span className="text-[10px] uppercase tracking-wider text-outline font-bold mr-2">Filter Tier:</span>
          <button
            onClick={() => setTierFilter('ALL')}
            className={`px-2.5 py-1 rounded font-bold transition-colors ${
              tierFilter === 'ALL'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            ALL [{findings.length}]
          </button>
          <button
            onClick={() => setTierFilter('verified_observation')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 border transition-colors ${
              tierFilter === 'verified_observation'
                ? 'bg-verified text-on-primary font-bold border-verified'
                : 'bg-surface-container-high text-verified border-verified/30 hover:bg-surface-container'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>
            VERIFIED OBSERVATIONS
          </button>
          <button
            onClick={() => setTierFilter('inference')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 border transition-colors ${
              tierFilter === 'inference'
                ? 'bg-amber-500 text-on-primary font-bold border-amber-500'
                : 'bg-surface-container-high text-amber-400 border-amber-500/30 hover:bg-surface-container'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            INFERENCES
          </button>
          <button
            onClick={() => setTierFilter('hypothesis')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 border transition-colors ${
              tierFilter === 'hypothesis'
                ? 'bg-purple-500 text-on-primary font-bold border-purple-500'
                : 'bg-surface-container-high text-purple-400 border-purple-500/30 hover:bg-surface-container'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            HYPOTHESES
          </button>
        </div>
      </div>

      {/* Findings List */}
      {loading ? (
        <div className="p-8 text-center text-outline font-data-mono text-sm">
          Loading analytical findings ledger...
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
          <p className="text-on-surface font-semibold text-sm">No findings found matching current filter.</p>
          <p className="text-outline text-xs">Use "Record Finding" above to document a verified observation or inference.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding, idx) => {
            const badge = getTierBadge(finding.epistemic_tier);
            const confPct = Math.round((finding.confidence_score ?? 1.0) * 100);

            return (
              <div
                key={finding.id}
                className="bg-surface-container-low border border-outline-variant/70 hover:border-outline-variant rounded-xl p-4 shadow-sm space-y-3 transition-all"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-outline-variant/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-data-mono font-bold text-xs text-outline">
                      #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-data-mono font-bold uppercase flex items-center gap-1.5 border ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[10px] font-data-mono text-outline hidden sm:inline">
                      ({badge.sub})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Confidence Meter */}
                    <div className="flex items-center gap-1.5 bg-surface-container px-2 py-0.5 rounded border border-outline-variant/50 text-[10px] font-data-mono">
                      <span className="text-outline">CERTAINTY:</span>
                      <span
                        className={`font-bold ${
                          confPct >= 90 ? 'text-verified' : confPct >= 70 ? 'text-amber-400' : 'text-purple-400'
                        }`}
                      >
                        {confPct}%
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(finding.id)}
                      className="text-outline hover:text-error p-1 rounded transition-colors"
                      title="Delete Finding"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Finding Title & Description */}
                <div>
                  <h3 className="font-headline-md font-bold text-[14px] text-on-surface">
                    {finding.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-sans leading-relaxed mt-1">
                    {finding.description}
                  </p>
                </div>

                {/* Analytical Reasoning Block for Inferences */}
                {finding.reasoning && (
                  <div className="p-3 rounded-lg bg-surface-container-high border-l-4 border-l-amber-500 border-y border-r border-outline-variant/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-data-mono text-[10px] font-bold uppercase">
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      <span>Analytical Reasoning & Deductive Proof</span>
                    </div>
                    <p className="text-[11px] text-on-surface leading-relaxed">
                      {finding.reasoning}
                    </p>
                  </div>
                )}

                {/* Supporting Observation Citations */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/30 text-[10px] font-data-mono">
                  <span className="text-outline uppercase font-bold shrink-0">
                    Citations ({finding.supporting_observation_ids.length}):
                  </span>
                  {finding.supporting_observation_ids.length === 0 ? (
                    <span className="text-outline italic">No formal observations cited</span>
                  ) : (
                    finding.supporting_observation_ids.map((obsId) => {
                      const matchedObs = availableObservations.find((o) => o.id === obsId);
                      return (
                        <button
                          key={obsId}
                          onClick={() => handleInspectCitation(obsId)}
                          className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high border border-primary/40 text-primary font-bold flex items-center gap-1 transition-colors"
                          title="Click to inspect underlying factual observation log"
                        >
                          <span className="material-symbols-outlined text-[12px]">search</span>
                          <span>
                            {matchedObs ? `${matchedObs.observation_type} [${matchedObs.source_offset || '1'}]` : `OBS-${obsId.slice(0, 6)}`}
                          </span>
                        </button>
                      );
                    })
                  )}

                  <span className="text-outline ml-auto">
                    Asserted by {finding.created_by} • {new Date(finding.created_at).toISOString().slice(0, 10)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Finding Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">add_task</span>
                <h3 className="font-headline-md font-bold text-base text-on-surface">
                  Assert New Analytical Finding
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-outline hover:text-on-surface p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded bg-error/15 border border-error/40 text-error text-xs font-data-mono">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 font-data-mono text-xs">
              <div>
                <label className="block text-outline uppercase font-bold text-[10px] mb-1">Finding Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unauthorized Data Exfiltration to USB Device"
                  className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-outline uppercase font-bold text-[10px] mb-1">Epistemic Tier</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as EpistemicTier)}
                    className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant focus:outline-none focus:border-primary text-on-surface cursor-pointer"
                  >
                    <option value="verified_observation">Verified Observation (Direct Fact)</option>
                    <option value="inference">Inference (Deductive Synthesis)</option>
                    <option value="hypothesis">Hypothesis (Requires Verification)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-outline uppercase font-bold text-[10px] mb-1">
                    Certainty Rating ({Math.round(newConfidence * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-outline uppercase font-bold text-[10px] mb-1">Analytical Description</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Comprehensive forensic findings description..."
                  className="w-full bg-surface-container px-3 py-2 rounded border border-outline-variant focus:outline-none focus:border-primary text-on-surface font-sans"
                />
              </div>

              {newTier === 'inference' && (
                <div>
                  <label className="block text-amber-400 uppercase font-bold text-[10px] mb-1">
                    Analytical Reasoning (Mandatory for Inferences)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newReasoning}
                    onChange={(e) => setNewReasoning(e.target.value)}
                    placeholder="Explain the logical leap from raw observations to this conclusion..."
                    className="w-full bg-surface-container px-3 py-2 rounded border border-amber-500/50 focus:outline-none focus:border-amber-400 text-on-surface font-sans"
                  />
                </div>
              )}

              {/* Supporting Observation Selection */}
              <div>
                <label className="block text-outline uppercase font-bold text-[10px] mb-1">
                  Cite Supporting Observations ({selectedObsIds.length} Selected)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded bg-surface-container-high border border-outline-variant/60">
                  {availableObservations.length === 0 ? (
                    <div className="text-outline italic text-[11px]">No observations found in case.</div>
                  ) : (
                    availableObservations.map((obs) => {
                      const isChecked = selectedObsIds.includes(obs.id);
                      return (
                        <label
                          key={obs.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-surface-container rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedObsIds(selectedObsIds.filter((id) => id !== obs.id));
                              } else {
                                setSelectedObsIds([...selectedObsIds, obs.id]);
                              }
                            }}
                            className="accent-primary"
                          />
                          <span className="text-primary font-bold">[{obs.observation_type}]</span>
                          <span className="text-on-surface truncate flex-1">{obs.content}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded bg-surface-container text-on-surface hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-primary text-on-primary font-bold hover:bg-sky-300 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Assert Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citation Inspector Modal */}
      {inspectCitationObs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">manage_search</span>
                <h3 className="font-headline-md font-bold text-base text-on-surface">
                  Cited Observation Provenance
                </h3>
              </div>
              <button onClick={() => setInspectCitationObs(null)} className="text-outline hover:text-on-surface p-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-data-mono text-xs">
              <div className="p-3 rounded bg-surface-container border border-outline-variant/60">
                <div className="text-[10px] text-outline uppercase font-bold mb-1">Factual Observation</div>
                <div className="text-on-surface text-sm font-sans leading-relaxed">{inspectCitationObs.content}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-surface-container border border-outline-variant/40">
                  <div className="text-[9px] text-outline uppercase">Observation Type</div>
                  <div className="text-primary font-bold mt-0.5">{inspectCitationObs.observation_type}</div>
                </div>
                <div className="p-2 rounded bg-surface-container border border-outline-variant/40">
                  <div className="text-[9px] text-outline uppercase">Source Offset</div>
                  <div className="text-on-surface font-bold mt-0.5">{inspectCitationObs.source_offset || 'N/A'}</div>
                </div>
                <div className="p-2 rounded bg-surface-container border border-outline-variant/40">
                  <div className="text-[9px] text-outline uppercase">Source Artifact</div>
                  <div className="text-on-surface font-bold mt-0.5">{inspectCitationObs.source_file || 'Evidence file'}</div>
                </div>
                <div className="p-2 rounded bg-surface-container border border-outline-variant/40">
                  <div className="text-[9px] text-outline uppercase">Observed Time (UTC)</div>
                  <div className="text-on-surface font-bold mt-0.5">
                    {inspectCitationObs.observed_time_utc ? new Date(inspectCitationObs.observed_time_utc).toISOString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="p-2 rounded bg-surface-container-high border border-outline-variant/60 text-[10px] text-primary">
                Reference Tag: [OBS:{inspectCitationObs.id.slice(0, 8)}:{inspectCitationObs.source_file}:{inspectCitationObs.source_offset}]
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/40">
              <button
                onClick={() => setInspectCitationObs(null)}
                className="px-4 py-1.5 rounded bg-primary text-on-primary font-bold text-xs"
              >
                Close Provenance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
