import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaseContext } from '../context/CaseContext';
import {
  queryCopilot,
  generateCopilotNarrative,
  scanCopilotAnomalies,
  formulateCopilotHypotheses,
  fetchCopilotHistory,
  createFinding,
  type CopilotQueryResponse,
  type CopilotCitation,
  type AIInterpretationRead,
  type EpistemicTier,
} from '../services/api';

export const AICopilotDrawer: React.FC = () => {
  const { isCopilotOpen, setIsCopilotOpen, activeCaseId, activeCase } = useCaseContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'console' | 'history'>('console');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CopilotQueryResponse | null>(null);
  const [history, setHistory] = useState<AIInterpretationRead[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [promoteStatus, setPromoteStatus] = useState<string | null>(null);
  const [inspectCitation, setInspectCitation] = useState<CopilotCitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load history when drawer opens or tab switches
  useEffect(() => {
    if (isCopilotOpen && activeCaseId) {
      loadHistory();
    }
  }, [isCopilotOpen, activeCaseId, activeTab]);

  const loadHistory = async () => {
    if (!activeCaseId) return;
    setLoadingHistory(true);
    try {
      const data = await fetchCopilotHistory(activeCaseId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load copilot history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendQuery = async (customText?: string, mode: string = 'qa') => {
    const textToSend = customText !== undefined ? customText : queryInput;
    if (!textToSend.trim() || !activeCaseId) return;

    setLoading(true);
    setErrorMsg(null);
    setPromoteStatus(null);
    setInspectCitation(null);

    try {
      const res = await queryCopilot(activeCaseId, textToSend, mode);
      setResponse(res);
      setQueryInput('');
      loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Copilot query failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (actionType: 'narrative' | 'anomaly' | 'hypothesis') => {
    if (!activeCaseId) return;
    setLoading(true);
    setErrorMsg(null);
    setPromoteStatus(null);
    setInspectCitation(null);

    try {
      let res: CopilotQueryResponse;
      if (actionType === 'narrative') {
        res = await generateCopilotNarrative(activeCaseId);
      } else if (actionType === 'anomaly') {
        res = await scanCopilotAnomalies(activeCaseId);
      } else {
        res = await formulateCopilotHypotheses(activeCaseId);
      }
      setResponse(res);
      loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || `Action ${actionType} failed.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToFinding = async () => {
    if (!response || !activeCaseId) return;
    setPromoteStatus('promoting');

    try {
      const title =
        response.mode === 'narrative'
          ? 'Reconstructed Incident Narrative & Exfiltration Path'
          : response.mode === 'anomaly'
          ? 'Forensic Anomaly: Exfiltration Cluster & Timing Discrepancy'
          : response.mode === 'hypothesis'
          ? 'Hypothesis: Insider Data Exfiltration via Removable Media'
          : `AI Deduction: ${response.query.slice(0, 50)}...`;

      await createFinding(activeCaseId, {
        title,
        description: response.answer,
        epistemic_tier: response.epistemic_tier,
        confidence_score: response.confidence_score,
        supporting_observation_ids: response.cited_observation_ids,
        reasoning: `Synthesized by AI Copilot (${response.model_name}) from ${response.cited_observation_ids.length} corroborated observations and evidence references.`,
      });

      setPromoteStatus('success');
      setTimeout(() => setPromoteStatus(null), 4000);
    } catch (err: any) {
      console.error('Failed to promote to finding:', err);
      setPromoteStatus('error');
    }
  };

  const handleCopyMarkdown = () => {
    if (!response) return;
    navigator.clipboard.writeText(
      `## FORENSIC AI COPILOT INTERPRETATION\n**Mode**: ${response.mode.toUpperCase()}\n**Epistemic Tier**: ${response.epistemic_tier.toUpperCase()}\n**Confidence**: ${(response.confidence_score * 100).toFixed(0)}%\n\n${response.answer}\n\n**Citations**:\n${response.citations.map((c) => `- [${c.type}] ${c.summary} (${c.source_ref || c.id})`).join('\n')}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isCopilotOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsCopilotOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity animate-fade-in"
      />

      {/* Slide-out Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-[600px] max-w-[92vw] z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-l border-outline-variant shadow-2xl flex flex-col transition-all duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-drawer-title"
      >
        {/* Header */}
        <header className="p-4 border-b border-outline-variant/60 bg-surface-container-low/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(56,189,248,0.25)]">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="copilot-drawer-title" className="text-sm font-headline-md font-bold text-on-surface tracking-tight">
                  FORENSIC AI COPILOT
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-data-mono font-bold uppercase bg-primary/10 border border-primary/30 text-primary">
                  REASONER v1.0
                </span>
              </div>
              <p className="text-[11px] font-data-mono text-outline flex items-center gap-1.5 mt-0.5">
                <span>Active Case:</span>
                <span className="text-primary font-bold">
                  {activeCase ? `[${activeCase.case_number}]` : 'None Selected'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCopilotOpen(false)}
              className="p-1.5 rounded-md hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors cursor-pointer"
              title="Close Copilot (Esc)"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </header>

        {/* Epistemic Guardrail Notice */}
        <div className="px-4 py-2 bg-surface-container/60 border-b border-outline-variant/40 flex items-center justify-between text-[11px] font-data-mono">
          <div className="flex items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-[14px] text-amber-400">gavel</span>
            <span>
              Epistemic Isolation: <strong className="text-on-surface font-semibold">ADR-006</strong> (INFERENCE / HYPOTHESIS)
            </span>
          </div>
          <span className="px-1.5 py-0.2 rounded bg-verified/10 text-verified border border-verified/30 text-[9px] uppercase font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>
            Prompt Shield Active
          </span>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-outline-variant/60 bg-surface-container-lowest text-xs font-data-mono px-4">
          <button
            onClick={() => setActiveTab('console')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'console'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">terminal</span>
            Investigation Console
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">history</span>
            Audit History ({history.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'console' ? (
            <>
              {/* Quick Action Routines */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-data-mono uppercase tracking-wider text-outline font-semibold">
                  Forensic Quick Actions
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickAction('narrative')}
                    disabled={loading || !activeCaseId}
                    className="p-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant hover:border-primary/50 rounded-lg text-left transition-all group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-primary text-xs font-bold font-headline-md mb-0.5">
                      <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">
                        history_edu
                      </span>
                      Incident Narrative
                    </div>
                    <div className="text-[10px] text-outline font-data-mono leading-tight">
                      Formal court brief with chronologies
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickAction('anomaly')}
                    disabled={loading || !activeCaseId}
                    className="p-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant hover:border-amber-400/50 rounded-lg text-left transition-all group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-headline-md mb-0.5">
                      <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">
                        radar
                      </span>
                      Anomaly Scan
                    </div>
                    <div className="text-[10px] text-outline font-data-mono leading-tight">
                      Detect exfiltration & off-hour deltas
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickAction('hypothesis')}
                    disabled={loading || !activeCaseId}
                    className="p-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant hover:border-purple-400/50 rounded-lg text-left transition-all group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold font-headline-md mb-0.5">
                      <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">
                        psychology
                      </span>
                      Hypotheses
                    </div>
                    <div className="text-[10px] text-outline font-data-mono leading-tight">
                      Theories with corroboration lists
                    </div>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-red-200 text-xs font-data-mono flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-400 text-[18px]">error</span>
                  <div>
                    <strong className="font-bold">Investigative Engine Warning:</strong> {errorMsg}
                  </div>
                </div>
              )}

              {/* Active / Latest Response Card */}
              {loading ? (
                <div className="p-6 bg-surface-container-low border border-outline-variant/60 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <div className="text-xs font-headline-md font-semibold text-on-surface">
                      Reasoning over extracted observations & hash chains...
                    </div>
                    <div className="text-[10px] font-data-mono text-outline mt-1">
                      Enforcing epistemic isolation (ADR-006)
                    </div>
                  </div>
                </div>
              ) : response ? (
                <div className="bg-surface-container-low border border-outline-variant/80 rounded-xl overflow-hidden shadow-lg space-y-0">
                  {/* Meta Bar */}
                  <div className="p-3 bg-surface-container border-b border-outline-variant/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-data-mono font-bold uppercase border ${
                          response.epistemic_tier === 'hypothesis'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/40'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {response.epistemic_tier === 'hypothesis'
                          ? 'TIER-3: HYPOTHESIS'
                          : 'TIER-2: INFERENCE'}
                      </span>
                      <span className="text-[11px] font-data-mono text-outline">
                        Confidence: <strong className="text-on-surface font-semibold">{(response.confidence_score * 100).toFixed(0)}%</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCopyMarkdown}
                        className="px-2 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded text-[10px] font-data-mono text-outline hover:text-on-surface flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {copied ? 'check' : 'content_copy'}
                        </span>
                        {copied ? 'Copied' : 'Copy'}
                      </button>

                      <button
                        onClick={handlePromoteToFinding}
                        disabled={promoteStatus === 'promoting'}
                        className={`px-2.5 py-1 rounded text-[10px] font-data-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          promoteStatus === 'success'
                            ? 'bg-verified text-on-verified'
                            : 'bg-primary text-on-primary hover:bg-sky-300'
                        }`}
                        title="Promote this AI deduction to an official case Finding in the ledger"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {promoteStatus === 'success' ? 'check_circle' : 'publish'}
                        </span>
                        {promoteStatus === 'promoting'
                          ? 'Promoting...'
                          : promoteStatus === 'success'
                          ? 'Promoted to Finding!'
                          : 'Promote to Finding'}
                      </button>
                    </div>
                  </div>

                  {/* Interpretation Markdown Answer */}
                  <div className="p-4 space-y-3 text-xs leading-relaxed text-on-surface font-sans">
                    <div className="prose prose-invert prose-xs max-w-none text-on-surface/90">
                      {response.answer.split('\n\n').map((paragraph, idx) => {
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h4 key={idx} className="text-sm font-bold font-headline-md text-primary mt-2 mb-1">
                              {paragraph.replace('### ', '')}
                            </h4>
                          );
                        }
                        if (paragraph.startsWith('**') && paragraph.includes(':**')) {
                          return (
                            <p key={idx} className="font-data-mono text-[11px] text-on-surface/80 bg-surface-container-high/60 p-2 rounded border border-outline-variant/40">
                              {paragraph}
                            </p>
                          );
                        }
                        return (
                          <p key={idx} className="text-on-surface/90 font-normal">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* Provenance Citations Section */}
                  {response.citations.length > 0 && (
                    <div className="p-3 bg-surface-container-lowest/80 border-t border-outline-variant/60 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-data-mono text-outline uppercase font-semibold">
                        <span>Corroborated Citations ({response.citations.length})</span>
                        <span className="text-primary font-bold">Provenance Grounded</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {response.citations.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setInspectCitation(c)}
                            className="p-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 rounded text-[11px] font-data-mono flex items-center justify-between cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="px-1 py-0.2 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase shrink-0">
                                {c.type}
                              </span>
                              <span className="text-on-surface truncate">{c.summary}</span>
                            </div>
                            <span className="text-[10px] text-outline group-hover:text-primary transition-colors shrink-0 ml-2">
                              {c.source_ref || `${c.id.slice(0, 8)}...`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {response.suggested_followups.length > 0 && (
                    <div className="p-3 bg-surface-container-low border-t border-outline-variant/40 space-y-1.5">
                      <div className="text-[10px] font-data-mono text-outline uppercase font-semibold">
                        Suggested Investigative Follow-ups
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {response.suggested_followups.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendQuery(q, 'qa')}
                            className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant hover:border-primary/50 text-[10px] font-data-mono text-primary text-left transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[12px]">search</span>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-outline font-data-mono text-xs border border-dashed border-outline-variant rounded-xl space-y-2">
                  <span className="material-symbols-outlined text-[36px] text-outline/60">terminal</span>
                  <div className="text-on-surface font-headline-md font-semibold text-sm">
                    Investigative Reasoning Console Ready
                  </div>
                  <p className="max-w-sm mx-auto text-outline text-[11px]">
                    Select a forensic quick action above or query the case knowledge base with natural language questions.
                  </p>
                </div>
              )}

              {/* Citation Detail Modal */}
              {inspectCitation && (
                <div className="p-3 bg-surface-container-high border border-primary/40 rounded-lg space-y-2 text-xs font-data-mono animate-fade-in">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-1">
                    <span className="text-primary font-bold uppercase text-[10px]">
                      Citation Provenance Grounding
                    </span>
                    <button
                      onClick={() => setInspectCitation(null)}
                      className="text-outline hover:text-on-surface text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                  <div>
                    <span className="text-outline text-[10px]">Identifier: </span>
                    <span className="text-on-surface font-bold">{inspectCitation.id}</span>
                  </div>
                  <div>
                    <span className="text-outline text-[10px]">Observation Type: </span>
                    <span className="text-primary">{inspectCitation.type}</span>
                  </div>
                  <div>
                    <span className="text-outline text-[10px]">Source Reference: </span>
                    <span className="text-amber-400">{inspectCitation.source_ref || 'Raw Evidence Manifest'}</span>
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant/60 text-on-surface/90 text-[11px]">
                    {inspectCitation.summary}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-data-mono text-outline">
                <span>Audited Case Interpretations</span>
                <button
                  onClick={loadHistory}
                  className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span className="material-symbols-outlined text-[13px]">refresh</span> Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="text-center py-8 text-outline font-data-mono text-xs">
                  Loading interpretation audit trail...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-outline font-data-mono text-xs border border-dashed border-outline-variant rounded-xl">
                  No previous interpretations recorded for this case.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-surface-container rounded-lg border border-outline-variant/60 hover:border-primary/50 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-data-mono font-bold uppercase border ${
                            item.epistemic_tier === 'hypothesis'
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/40'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          {item.epistemic_tier}
                        </span>
                        <span className="text-[10px] font-data-mono text-outline">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface line-clamp-3 font-sans leading-relaxed">
                        {item.interpretation}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/40 text-[10px] font-data-mono text-outline">
                        <span>
                          Citations: {item.cited_observation_ids.length} obs / {item.cited_evidence_ids.length} files
                        </span>
                        <button
                          onClick={() => {
                            setResponse({
                              id: item.id,
                              case_id: item.case_id,
                              query: 'Audit Record Review',
                              mode: 'review',
                              answer: item.interpretation,
                              epistemic_tier: item.epistemic_tier as EpistemicTier,
                              confidence_score: item.confidence_score || 0.85,
                              cited_evidence_ids: item.cited_evidence_ids,
                              cited_observation_ids: item.cited_observation_ids,
                              citations: [],
                              suggested_followups: [],
                              model_name: item.model_name,
                              prompt_version: item.prompt_version || 'forensic-copilot-v1',
                              created_at: item.created_at,
                            });
                            setActiveTab('console');
                          }}
                          className="text-primary hover:underline font-bold"
                        >
                          View Full Brief →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Footer */}
        {activeTab === 'console' && (
          <footer className="p-3 bg-surface-container-low border-t border-outline-variant/60 shrink-0 space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuery();
                  }
                }}
                disabled={loading || !activeCaseId}
                placeholder={
                  activeCaseId
                    ? "Query case artifacts (e.g. 'Did Alice access the USB at 08:22?')..."
                    : "Please select an active case first"
                }
                className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-lg pl-3 pr-24 py-2 text-xs font-data-mono text-on-surface placeholder:text-outline transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => handleSendQuery()}
                disabled={loading || !queryInput.trim() || !activeCaseId}
                className="absolute right-1 px-3 py-1 bg-primary text-on-primary rounded text-[11px] font-data-mono font-bold hover:bg-sky-300 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border border-on-primary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Ask</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] font-data-mono text-outline">
              <span>Press <strong>Enter</strong> to submit inquiry</span>
              <span className="text-primary">Press <strong>Ctrl+J</strong> to toggle</span>
            </div>
          </footer>
        )}
      </div>
    </>
  );
};
