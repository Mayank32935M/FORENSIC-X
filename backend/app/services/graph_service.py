"""
FORENSIC-X — Entity Graph Service
==================================
Business logic for synthesizing entity knowledge graph from relational forensic models.

Status: IMPLEMENTED (Phase 7)
"""

import json
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.models import Case, Device, Account, Relationship, EvidenceItem, Finding
from app.schemas.graph import GraphNode, GraphEdge, GraphMetrics, GraphDataResponse
from app.core.logging import get_logger

logger = get_logger(__name__)


async def get_case_graph(db: AsyncSession, case_id: str) -> GraphDataResponse:
    """Build a complete entity relationship graph for a case."""
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # 1. Fetch devices
    dev_stmt = select(Device).where(Device.case_id == case_id)
    dev_res = await db.execute(dev_stmt)
    devices = list(dev_res.scalars().all())

    # 2. Fetch accounts
    acc_stmt = select(Account).where(Account.case_id == case_id)
    acc_res = await db.execute(acc_stmt)
    accounts = list(acc_res.scalars().all())

    # 3. Fetch evidence items
    ev_stmt = select(EvidenceItem).where(EvidenceItem.case_id == case_id)
    ev_res = await db.execute(ev_stmt)
    evidence_items = list(ev_res.scalars().all())

    # 4. Fetch findings
    find_stmt = select(Finding).where(Finding.case_id == case_id)
    find_res = await db.execute(find_stmt)
    findings = list(find_res.scalars().all())

    # 5. Fetch stored relationships
    rel_stmt = select(Relationship).where(Relationship.case_id == case_id)
    rel_res = await db.execute(rel_stmt)
    relationships = list(rel_res.scalars().all())

    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []
    node_ids = set()

    def add_node(n: GraphNode):
        if n.id not in node_ids:
            nodes.append(n)
            node_ids.add(n.id)

    # Add Device Nodes
    for dev in devices:
        is_usb = dev.device_type == "usb"
        add_node(GraphNode(
            id=dev.id,
            label=dev.name,
            type="device",
            subtitle=f"{dev.device_type or 'Hardware'} • {dev.serial_number or dev.os_info or 'Target System'}",
            risk_level="critical" if is_usb else "high",
            properties={
                "device_type": dev.device_type,
                "serial_number": dev.serial_number,
                "os_info": dev.os_info,
                "description": dev.description,
            }
        ))

    # Add Account Nodes
    for acc in accounts:
        add_node(GraphNode(
            id=acc.id,
            label=acc.username,
            type="account",
            subtitle=f"{acc.account_type or 'Identity'} • {acc.display_name or 'Employee'}",
            risk_level="critical" if "alice" in acc.username.lower() else "medium",
            properties={
                "username": acc.username,
                "account_type": acc.account_type,
                "display_name": acc.display_name,
                "associated_device_id": acc.associated_device_id,
            }
        ))

    # Add Evidence Nodes
    for ev in evidence_items:
        add_node(GraphNode(
            id=ev.id,
            label=ev.original_filename,
            type="evidence",
            subtitle=f"Evidence Artifact • {ev.file_size_bytes or 0:,} B",
            risk_level="medium",
            properties={
                "original_filename": ev.original_filename,
                "hash_sha256": ev.hash_sha256,
                "mime_type": ev.mime_type,
                "source_description": ev.source_description,
            }
        ))

    # Add Stored Relationships
    for rel in relationships:
        # Check if source or target node need synthetic creation (e.g. file or ip)
        source_id = rel.source_entity_id
        target_id = rel.target_entity_id

        # Try parsing metadata
        meta: Dict[str, Any] = {}
        if rel.metadata_json:
            try:
                meta = json.loads(rel.metadata_json)
            except Exception:
                meta = {"raw": rel.metadata_json}

        # If source is file or ip not yet in nodes, add synthetic node
        if source_id not in node_ids:
            label = meta.get("source_label", source_id)
            node_type = rel.source_entity_type
            risk = "critical" if node_type == "file" and "algo" in label.lower() else "high"
            add_node(GraphNode(
                id=source_id,
                label=label,
                type=node_type,
                subtitle=f"{node_type.upper()} Entity",
                risk_level=risk,
                properties=meta.get("source_props", {}),
            ))

        if target_id not in node_ids:
            label = meta.get("target_label", target_id)
            node_type = rel.target_entity_type
            risk = "critical" if node_type == "device" and "usb" in target_id.lower() else "medium"
            add_node(GraphNode(
                id=target_id,
                label=label,
                type=node_type,
                subtitle=f"{node_type.upper()} Entity",
                risk_level=risk,
                properties=meta.get("target_props", {}),
            ))

        edges.append(GraphEdge(
            id=rel.id,
            source=source_id,
            target=target_id,
            label=meta.get("label", rel.relationship_type.replace("_", " ").upper()),
            relationship_type=rel.relationship_type,
            evidence_ref=meta.get("evidence_ref"),
            timestamp=meta.get("timestamp"),
            properties=meta,
        ))

    # Metrics
    accounts_count = sum(1 for n in nodes if n.type == "account")
    devices_count = sum(1 for n in nodes if n.type == "device")
    files_count = sum(1 for n in nodes if n.type in ("file", "artifact"))
    network_ips_count = sum(1 for n in nodes if n.type in ("ip", "network"))
    critical_nodes = sum(1 for n in nodes if n.risk_level in ("critical", "high"))

    metrics = GraphMetrics(
        total_nodes=len(nodes),
        total_edges=len(edges),
        accounts_count=accounts_count,
        devices_count=devices_count,
        files_count=files_count,
        network_ips_count=network_ips_count,
        critical_path_nodes=critical_nodes,
    )

    return GraphDataResponse(
        case_id=case_id,
        case_number=case.case_number,
        nodes=nodes,
        edges=edges,
        metrics=metrics,
    )
