"""
FORENSIC-X — Entity Graph Schemas
==================================
Pydantic contracts for forensic entity knowledge graph.

Status: IMPLEMENTED (Phase 7)
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # account, device, file, ip, evidence, finding, case
    subtitle: Optional[str] = None
    icon: Optional[str] = None
    risk_level: str = "info"  # critical, high, medium, low, info
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    relationship_type: str
    evidence_ref: Optional[str] = None
    timestamp: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphMetrics(BaseModel):
    total_nodes: int
    total_edges: int
    accounts_count: int
    devices_count: int
    files_count: int
    network_ips_count: int
    critical_path_nodes: int


class GraphDataResponse(BaseModel):
    case_id: str
    case_number: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    metrics: GraphMetrics
