export const API_BASE = "/api";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  database: string;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface EvidenceItem {
  id: string;
  case_id: string;
  original_filename: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  hash_sha256: string | null;
  hash_algorithm: string;
  acquired_at: string | null;
  acquired_by: string | null;
  acquisition_method: string | null;
  storage_path: string | null;
  source_description: string | null;
  created_at: string;
}

export interface CustodyRecord {
  id: string;
  case_id: string;
  evidence_item_id: string | null;
  action: string;
  actor: string;
  description: string | null;
  timestamp: string;
  prior_record_hash: string | null;
}

export interface CustodyVerifyResponse {
  case_id: string;
  evidence_item_id: string | null;
  chain_valid: boolean;
  record_count: number;
  message: string;
}

export interface EvidenceVerifyResponse {
  evidence_id: string;
  verified: boolean;
  stored_hash: string;
  current_hash: string;
  message: string;
}

export interface EvidenceContentResponse {
  evidence_id: string;
  filename: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  hash_sha256: string | null;
  is_text: boolean;
  is_truncated: boolean;
  content: string | null;
  hex_preview: string;
}

export interface CaseAuditHashResponse {
  case_id: string;
  case_number: string;
  interim_audit_hash: string;
  evidence_count: number;
  custody_ledger_height: number;
  algorithm: string;
}

export interface CaseExportResponse {
  export_standard: string;
  exported_at: string;
  case: Case;
  evidence_manifest: Array<{
    id: string;
    original_filename: string;
    file_size_bytes: number | null;
    mime_type: string | null;
    hash_sha256: string | null;
    hash_algorithm: string;
    acquisition_method: string | null;
    source_description: string | null;
    storage_path: string | null;
  }>;
  chain_of_custody_ledger: Array<{
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    description: string | null;
    prior_record_hash: string | null;
    evidence_item_id: string | null;
  }>;
  reconstructed_timeline: Array<{
    id: string;
    event_type: string;
    summary: string;
    event_time_utc: string;
    original_time_string: string | null;
    source_timezone: string | null;
    time_quality: string | null;
  }>;
}

export interface GlobalSearchResponse {
  query: string;
  cases: Array<{
    id: string;
    case_number: string;
    title: string;
    status: string;
  }>;
  evidence: Array<{
    id: string;
    case_id: string;
    original_filename: string;
    hash_sha256: string | null;
  }>;
  events: Array<{
    id: string;
    case_id: string;
    summary: string;
    event_type: string;
    time: string;
  }>;
  observations?: Array<{
    id: string;
    case_id: string;
    content: string;
    type: string;
    source_file: string | null;
    time: string | null;
  }>;
  findings?: Array<{
    id: string;
    case_id: string;
    title: string;
    tier: string;
    confidence: number | null;
  }>;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  event_type: string;
  summary: string;
  event_time_utc: string;
  original_time_string: string | null;
  source_timezone: string | null;
  time_quality: string | null;
  source_observation_ids: string | null;
  created_at: string;
}

export interface Observation {
  id: string;
  case_id: string;
  evidence_item_id: string;
  observation_type: string;
  content: string;
  source_file: string | null;
  source_offset: string | null;
  parser_name: string | null;
  parser_version: string | null;
  observed_time_utc: string | null;
  original_time_string: string | null;
  source_timezone: string | null;
  time_quality: string | null;
  processing_timestamp: string | null;
  created_at: string;
}

export interface ParseResultResponse {
  evidence_id: string;
  status: string;
  parser: string | null;
  parser_version: string | null;
  observation_count: number;
  message: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  subtitle?: string;
  icon?: string;
  risk_level: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationship_type: string;
  evidence_ref?: string;
  timestamp?: string;
  properties: Record<string, any>;
}

export interface GraphMetrics {
  total_nodes: number;
  total_edges: number;
  accounts_count: number;
  devices_count: number;
  files_count: number;
  network_ips_count: number;
  critical_path_nodes: number;
}

export interface GraphDataResponse {
  case_id: string;
  case_number: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: {
    total_nodes: number;
    total_edges: number;
    accounts_count: number;
    devices_count: number;
    files_count: number;
    network_ips_count: number;
    critical_path_nodes: number;
  };
}

export type EpistemicTier = "verified_observation" | "inference" | "hypothesis";

export interface Finding {
  id: string;
  case_id: string;
  title: string;
  description: string;
  epistemic_tier: EpistemicTier;
  confidence_score: number | null;
  supporting_observation_ids: string[];
  reasoning: string | null;
  created_at: string;
  created_by: string;
}

export interface FindingCreate {
  title: string;
  description: string;
  epistemic_tier: EpistemicTier;
  confidence_score?: number;
  supporting_observation_ids?: string[];
  reasoning?: string;
}

export interface FindingsSummaryResponse {
  case_id: string;
  total_findings: number;
  verified_observations: number;
  inferences: number;
  hypotheses: number;
  citation_coverage_pct: number;
}

// ─── Health API ─────────────────────────────────────────────────────────────

export const fetchHealth = async (): Promise<HealthResponse> => {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
};

// ─── Cases API ──────────────────────────────────────────────────────────────

export const fetchCases = async (): Promise<Case[]> => {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
};

export const fetchCase = async (caseId: string): Promise<Case> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}`);
  if (!res.ok) throw new Error("Failed to fetch case details");
  return res.json();
};

export const createCase = async (data: { title: string; case_number: string; description: string }): Promise<Case> => {
  const res = await fetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create case");
  return res.json();
};

export const fetchCaseAuditHash = async (caseId: string): Promise<CaseAuditHashResponse> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/audit-hash`);
  if (!res.ok) throw new Error("Failed to compute case audit hash");
  return res.json();
};

export const fetchCaseExport = async (caseId: string): Promise<CaseExportResponse> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/export`);
  if (!res.ok) throw new Error("Failed to export case dossier");
  return res.json();
};

// ─── Evidence API ───────────────────────────────────────────────────────────

export const fetchEvidence = async (caseId?: string): Promise<EvidenceItem[]> => {
  const url = caseId ? `${API_BASE}/cases/${caseId}/evidence` : `${API_BASE}/evidence`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch evidence items");
  return res.json();
};

export const fetchEvidenceStats = async (caseId: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/evidence/stats`);
  if (!res.ok) throw new Error("Failed to fetch evidence stats");
  return res.json();
};

export const uploadEvidence = async (caseId: string, formData: FormData): Promise<EvidenceItem> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/evidence`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload evidence");
  return res.json();
};

export const createEvidenceMetadata = async (
  caseId: string,
  data: {
    original_filename: string;
    mime_type?: string;
    source_description?: string;
    acquisition_method?: string;
    acquired_by?: string;
  }
): Promise<EvidenceItem> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/evidence/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create evidence record");
  return res.json();
};

export const verifyEvidence = async (evidenceId: string): Promise<EvidenceVerifyResponse> => {
  const res = await fetch(`${API_BASE}/evidence/${evidenceId}/verify`);
  if (!res.ok) throw new Error("Failed to verify evidence file integrity");
  return res.json();
};

export const fetchEvidenceContent = async (evidenceId: string, maxBytes: number = 65536): Promise<EvidenceContentResponse> => {
  const res = await fetch(`${API_BASE}/evidence/${evidenceId}/content?max_bytes=${maxBytes}`);
  if (!res.ok) throw new Error("Failed to retrieve evidence file content");
  return res.json();
};

// ─── Chain of Custody API ───────────────────────────────────────────────────

export const fetchCustody = async (caseId: string): Promise<CustodyRecord[]> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/custody`);
  if (!res.ok) throw new Error("Failed to fetch custody chain");
  return res.json();
};

export const verifyCustody = async (caseId: string, evidenceItemId?: string): Promise<CustodyVerifyResponse> => {
  const url = evidenceItemId
    ? `${API_BASE}/cases/${caseId}/custody/verify?evidence_item_id=${encodeURIComponent(evidenceItemId)}`
    : `${API_BASE}/cases/${caseId}/custody/verify`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to verify chain of custody");
  return res.json();
};

// ─── Timeline API ───────────────────────────────────────────────────────────

export const fetchTimeline = async (caseId?: string): Promise<TimelineEvent[]> => {
  const url = caseId ? `${API_BASE}/cases/${caseId}/timeline` : `${API_BASE}/timeline`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch timeline events");
  return res.json();
};

// ─── Global Search API ──────────────────────────────────────────────────────

export const globalSearch = async (query: string): Promise<GlobalSearchResponse> => {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Global search request failed");
  return res.json();
};

// ─── Observations API (Phase 6) ─────────────────────────────────────────────

export const parseEvidence = async (evidenceId: string, force: boolean = false): Promise<ParseResultResponse> => {
  const res = await fetch(`${API_BASE}/evidence/${evidenceId}/parse?force=${force}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to parse evidence file");
  return res.json();
};

export const fetchObservations = async (
  caseId: string,
  evidenceId?: string,
  observationType?: string
): Promise<Observation[]> => {
  let url = `${API_BASE}/cases/${caseId}/observations?limit=500`;
  if (evidenceId) url += `&evidence_id=${encodeURIComponent(evidenceId)}`;
  if (observationType) url += `&observation_type=${encodeURIComponent(observationType)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch observations");
  return res.json();
};

export const fetchObservation = async (observationId: string): Promise<Observation> => {
  const res = await fetch(`${API_BASE}/observations/${observationId}`);
  if (!res.ok) throw new Error("Failed to fetch observation");
  return res.json();
};

export const fetchObservationTypes = async (
  caseId: string
): Promise<Array<{ type: string; count: number }>> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/observations/types`);
  if (!res.ok) throw new Error("Failed to fetch observation types");
  return res.json();
};

// ─── Knowledge Graph API (Phase 7) ──────────────────────────────────────────

export const fetchCaseGraph = async (caseId: string): Promise<GraphDataResponse> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/graph`);
  if (!res.ok) throw new Error("Failed to fetch entity knowledge graph");
  return res.json();
};

// ─── Epistemic Findings API (Phase 8) ───────────────────────────────────────

export const fetchFindings = async (caseId: string, tier?: string): Promise<Finding[]> => {
  let url = `${API_BASE}/cases/${caseId}/findings?limit=200`;
  if (tier) url += `&tier=${encodeURIComponent(tier)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch analytical findings");
  return res.json();
};

export const fetchFindingsSummary = async (caseId: string): Promise<FindingsSummaryResponse> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/findings/summary`);
  if (!res.ok) throw new Error("Failed to fetch findings summary");
  return res.json();
};

export const createFinding = async (caseId: string, data: FindingCreate): Promise<Finding> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/findings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create finding");
  }
  return res.json();
};

export const deleteFinding = async (findingId: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/findings/${findingId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete finding");
};

// ─── AI Forensics Copilot API (Phase 9) ────────────────────────────────────

export interface CopilotCitation {
  id: string;
  kind: "observation" | "evidence" | "event" | string;
  type: string;
  summary: string;
  source_ref?: string | null;
}

export interface CopilotQueryRequest {
  query: string;
  mode?: "qa" | "narrative" | "anomaly" | "hypothesis" | string;
}

export interface CopilotQueryResponse {
  id: string;
  case_id: string;
  query: string;
  mode: string;
  answer: string;
  epistemic_tier: EpistemicTier;
  confidence_score: number;
  cited_evidence_ids: string[];
  cited_observation_ids: string[];
  citations: CopilotCitation[];
  suggested_followups: string[];
  model_name: string;
  prompt_version: string;
  created_at: string;
}

export interface AIInterpretationRead {
  id: string;
  case_id: string;
  finding_id: string | null;
  model_name: string;
  model_version: string | null;
  prompt_version: string | null;
  interpretation: string;
  epistemic_tier: EpistemicTier;
  confidence_score: number | null;
  cited_evidence_ids: string[];
  cited_observation_ids: string[];
  created_at: string;
}

export const queryCopilot = async (
  caseId: string,
  query: string,
  mode: string = "qa"
): Promise<CopilotQueryResponse> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/copilot/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to query forensic copilot");
  }
  return res.json();
};

export const fetchCopilotHistory = async (caseId: string): Promise<AIInterpretationRead[]> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/copilot/history`);
  if (!res.ok) throw new Error("Failed to fetch copilot interpretation history");
  return res.json();
};

export const generateCopilotNarrative = async (caseId: string): Promise<CopilotQueryResponse> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/copilot/narrative`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate incident narrative");
  return res.json();
};

export const scanCopilotAnomalies = async (caseId: string): Promise<CopilotQueryResponse> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/copilot/anomalies`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to scan forensic anomalies");
  return res.json();
};

export const formulateCopilotHypotheses = async (caseId: string): Promise<CopilotQueryResponse> => {
  const res = await fetch(`${API_BASE}/cases/${caseId}/copilot/hypotheses`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to formulate investigative hypotheses");
  return res.json();
};
