export const API_BASE = "http://localhost:8000/api";

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

export const fetchCases = async (): Promise<Case[]> => {
  const res = await fetch(`${API_BASE}/cases`);
  if (!res.ok) throw new Error("Failed to fetch cases");
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
