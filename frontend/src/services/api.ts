export const API_BASE = "http://localhost:8000/api";

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
