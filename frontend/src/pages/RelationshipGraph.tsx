import React, { useEffect, useState } from 'react';
import { useCaseContext } from '../context/CaseContext';
import { fetchCaseGraph } from '../services/api';
import type { GraphDataResponse, GraphNode, GraphEdge } from '../services/api';

export const RelationshipGraph: React.FC = () => {
  const { activeCaseId, cases, setActiveCaseId } = useCaseContext();
  const [graphData, setGraphData] = useState<GraphDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalPathOnly, setCriticalPathOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const targetCaseId = activeCaseId || cases[0]?.id;

  const loadGraph = async () => {
    if (!targetCaseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCaseGraph(targetCaseId);
      setGraphData(data);
      // Auto-select the first high-risk node
      const criticalNode = data.nodes.find((n) => n.risk_level === 'critical') || data.nodes[0] || null;
      setSelectedNode(criticalNode);
    } catch (err) {
      console.error('Failed to load case entity graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [targetCaseId]);

  // Layout node positions analytically across forensic stages
  const getNodePosition = (node: GraphNode, index: number, total: number) => {
    // 5 Stages layout:
    // Stage 1: Network Origin (IPs) -> X: 120
    // Stage 2: Identity / Accounts -> X: 320
    // Stage 3: Systems / Devices -> X: 540
    // Stage 4: Targeted Files / Artifacts -> X: 760
    // Stage 5: Exfiltration Targets / USB -> X: 940
    if (node.type === 'ip') {
      return { x: 120, y: 320 };
    }
    if (node.type === 'account') {
      return { x: 320, y: 320 };
    }
    if (node.type === 'device') {
      if (node.label.toLowerCase().includes('usb')) {
        return { x: 920, y: 440 };
      }
      return { x: 540, y: 280 };
    }
    if (node.type === 'file') {
      return { x: 740, y: 320 };
    }
    if (node.type === 'evidence') {
      // Evidence artifacts along the top or bottom
      const evidenceIdx = index % 3;
      return { x: 260 + evidenceIdx * 250, y: 120 };
    }
    // Default distributed
    return {
      x: 200 + (index % 4) * 200,
      y: 200 + Math.floor(index / 4) * 150,
    };
  };

  // Node styles by risk & type
  const getNodeColor = (node: GraphNode) => {
    if (node.risk_level === 'critical') return '#ef4444'; // Red
    if (node.risk_level === 'high') return '#f59e0b'; // Amber
    if (node.type === 'account') return '#38bdf8'; // Blue
    if (node.type === 'device') return '#a855f7'; // Purple
    if (node.type === 'file') return '#22c55e'; // Green
    if (node.type === 'evidence') return '#64748b'; // Slate
    return '#38bdf8';
  };

  const isCriticalPathNode = (nodeId: string) => {
    const cpIds = ['ip-10.0.1.55', 'acc-001', 'dev-001', 'file-algo-v2', 'dev-002'];
    return cpIds.includes(nodeId);
  };

  const isCriticalPathEdge = (edge: GraphEdge) => {
    return isCriticalPathNode(edge.source) && isCriticalPathNode(edge.target);
  };

  // Filtering
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  const filteredNodes = nodes.filter((n) => {
    if (entityFilter !== 'ALL' && n.type !== entityFilter) return false;
    if (criticalPathOnly && !isCriticalPathNode(n.id)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.label.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q) ||
        (n.subtitle && n.subtitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredEdges = edges.filter((e) => {
    if (!filteredNodeIds.has(e.source) || !filteredNodeIds.has(e.target)) return false;
    if (criticalPathOnly && !isCriticalPathEdge(e)) return false;
    return true;
  });

  // Calculate coordinates map
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, i) => {
    positions[n.id] = getNodePosition(n, i, nodes.length);
  });

  return (
    <div className="flex flex-col w-full h-[calc(100vh-8.5rem)] space-y-3">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-2.5 rounded-lg border border-outline-variant/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[20px]">hub</span>
            <span className="font-headline-md text-[15px] font-bold text-on-surface uppercase tracking-tight">
              Entity Knowledge Graph & Exfiltration Topology
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

          {/* Metrics summary */}
          {graphData && (
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-data-mono">
              <span className="px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant/50 text-on-surface">
                {graphData.metrics.total_nodes} NODES
              </span>
              <span className="px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant/50 text-on-surface">
                {graphData.metrics.total_edges} EDGES
              </span>
              <span className="px-1.5 py-0.5 bg-critical/15 text-critical border border-critical/40 font-bold rounded">
                CRITICAL ATTACK CHAIN DETECTED
              </span>
            </div>
          )}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Critical Path Toggle */}
          <button
            onClick={() => setCriticalPathOnly(!criticalPathOnly)}
            className={`px-2.5 py-1 rounded text-[11px] font-data-mono font-bold flex items-center gap-1.5 transition-all ${
              criticalPathOnly
                ? 'bg-critical text-on-error shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant'
            }`}
            title="Highlight direct attack chain: IP -> Alice -> Workstation -> IP Theft -> USB"
          >
            <span className="material-symbols-outlined text-[15px]">route</span>
            <span>{criticalPathOnly ? 'CRITICAL PATH [LOCKED]' : 'Highlight Critical Path'}</span>
          </button>

          {/* Search Bar */}
          <div className="relative flex items-center w-48 sm:w-56">
            <span className="material-symbols-outlined absolute left-2 text-outline text-[15px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entities..."
              className="w-full bg-surface-container-lowest text-on-surface text-[11px] font-data-mono pl-7 pr-6 py-1 rounded border border-outline-variant/60 focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-surface-container rounded border border-outline-variant/50 text-outline">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="px-1.5 py-1 hover:text-on-surface"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[14px]">remove</span>
            </button>
            <span className="text-[10px] font-data-mono px-1 select-none">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="px-1.5 py-1 hover:text-on-surface"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 flex overflow-hidden border border-outline-variant/70 rounded-xl bg-surface-container-lowest relative">
        {/* Left Filter Sidebar */}
        <aside className="w-56 bg-surface-container-low border-r border-outline-variant/60 flex flex-col shrink-0 z-10">
          <div className="p-3 border-b border-outline-variant/40 bg-surface-container-lowest">
            <div className="text-[10px] font-data-mono font-bold text-outline uppercase tracking-wider">
              Entity Layer Filters
            </div>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto flex-1 font-data-mono text-[11px]">
            {[
              { id: 'ALL', label: 'All Entities', icon: 'grid_view', count: nodes.length },
              { id: 'account', label: 'Subject / Identity', icon: 'person', count: nodes.filter((n) => n.type === 'account').length },
              { id: 'device', label: 'Devices / Systems', icon: 'devices', count: nodes.filter((n) => n.type === 'device').length },
              { id: 'file', label: 'Artifacts / Files', icon: 'description', count: nodes.filter((n) => n.type === 'file').length },
              { id: 'ip', label: 'Network Origin / IPs', icon: 'router', count: nodes.filter((n) => n.type === 'ip').length },
              { id: 'evidence', label: 'Raw Evidence Items', icon: 'inventory_2', count: nodes.filter((n) => n.type === 'evidence').length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setEntityFilter(f.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors ${
                  entityFilter === f.id
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                  <span className="truncate">{f.label}</span>
                </div>
                <span className="text-[10px] opacity-75 font-bold">[{f.count}]</span>
              </button>
            ))}

            <div className="pt-3 mt-3 border-t border-outline-variant/40 px-2 space-y-2">
              <div className="text-[10px] font-bold text-outline uppercase">Forensic Stages</div>
              <div className="text-[10px] space-y-1 text-on-surface-variant font-sans">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Stage 1: Remote Ingress</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400"></span>Stage 2: Session & Auth</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Stage 3: Removable Mount</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span>Stage 4: IP Harvest & Exfil</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center SVG Interactive Canvas */}
        <main className="flex-1 relative overflow-auto bg-surface-container-lowest flex items-center justify-center p-4">
          {/* Subtle Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <pattern id="graph-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="0.75" fill="#94a3b8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#graph-grid)" />
          </svg>

          {loading ? (
            <div className="text-center font-data-mono text-xs text-outline space-y-2 z-10">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
              <p>Synthesizing entity knowledge graph from relational evidence model...</p>
            </div>
          ) : (
            <div
              className="relative w-[1100px] h-[650px] transition-transform duration-150 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                <defs>
                  <marker id="arrow-standard" markerWidth="8" markerHeight="8" refX="28" refY="4" orient="auto">
                    <polygon points="0 0, 8 4, 0 8" fill="#64748b" />
                  </marker>
                  <marker id="arrow-critical" markerWidth="10" markerHeight="10" refX="28" refY="4" orient="auto">
                    <polygon points="0 0, 10 4, 0 8" fill="#ef4444" />
                  </marker>
                  <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="28" refY="4" orient="auto">
                    <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Render Edges */}
                {filteredEdges.map((edge) => {
                  const s = positions[edge.source];
                  const t = positions[edge.target];
                  if (!s || !t) return null;

                  const isEdgeSelected = selectedEdge?.id === edge.id;
                  const isCritical = isCriticalPathEdge(edge);

                  return (
                    <g
                      key={edge.id}
                      onClick={() => {
                        setSelectedEdge(edge);
                        setSelectedNode(null);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Interactive broad hit area */}
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke="transparent"
                        strokeWidth="16"
                      />
                      {/* Visible Edge Line */}
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={
                          isEdgeSelected
                            ? '#38bdf8'
                            : isCritical
                            ? '#ef4444'
                            : '#475569'
                        }
                        strokeWidth={isCritical || isEdgeSelected ? 2.5 : 1.5}
                        strokeDasharray={isCritical ? '6 3' : undefined}
                        markerEnd={
                          isEdgeSelected
                            ? 'url(#arrow-active)'
                            : isCritical
                            ? 'url(#arrow-critical)'
                            : 'url(#arrow-standard)'
                        }
                        className={isCritical ? 'animate-pulse' : ''}
                      />
                      {/* Edge Label Badge in Middle */}
                      <rect
                        x={(s.x + t.x) / 2 - 45}
                        y={(s.y + t.y) / 2 - 10}
                        width="90"
                        height="20"
                        rx="4"
                        fill="#0f172a"
                        stroke={isEdgeSelected ? '#38bdf8' : isCritical ? '#ef4444' : '#334155'}
                        strokeWidth="1"
                      />
                      <text
                        x={(s.x + t.x) / 2}
                        y={(s.y + t.y) / 2 + 3}
                        textAnchor="middle"
                        fill={isEdgeSelected ? '#38bdf8' : isCritical ? '#fca5a5' : '#94a3b8'}
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Render Nodes (Interactive HTML Elements positioned absolutely) */}
              {filteredNodes.map((node) => {
                const pos = positions[node.id] || { x: 400, y: 300 };
                const isSelected = selectedNode?.id === node.id;
                const isCritical = isCriticalPathNode(node.id);
                const borderColor = getNodeColor(node);

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedNode(node);
                      setSelectedEdge(null);
                    }}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      transform: 'translate(-50%, -50%)',
                      borderColor: isSelected ? '#38bdf8' : borderColor,
                    }}
                    className={`absolute p-2.5 rounded-xl bg-surface-container-high border-2 shadow-lg cursor-pointer transition-all w-48 text-left select-none ${
                      isSelected
                        ? 'ring-4 ring-primary/30 z-30 scale-105'
                        : isCritical
                        ? 'z-20 hover:scale-105'
                        : 'z-10 hover:scale-102 hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: borderColor }}
                        ></span>
                        <span className="text-[9px] font-data-mono font-bold uppercase text-outline">
                          {node.type}
                        </span>
                      </div>
                      {node.risk_level === 'critical' && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-data-mono font-bold bg-critical/20 text-critical border border-critical/40 uppercase">
                          CRITICAL
                        </span>
                      )}
                    </div>

                    <div className="text-[12px] font-headline-md font-bold text-on-surface truncate">
                      {node.label}
                    </div>

                    <div className="text-[9.5px] font-data-mono text-outline truncate mt-0.5">
                      {node.subtitle || node.id}
                    </div>

                    {isCritical && (
                      <div className="mt-1.5 pt-1 border-t border-outline-variant/40 flex items-center justify-between text-[8.5px] font-data-mono text-critical font-semibold">
                        <span>EXFIL ATTACK CHAIN</span>
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Inspector Panel (Opens when Node or Edge is clicked) */}
        {(selectedNode || selectedEdge) && (
          <aside className="w-80 bg-surface-container-low border-l border-outline-variant/60 flex flex-col justify-between shrink-0 z-20 shadow-2xl p-4 overflow-y-auto">
            {selectedNode && (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-outline-variant/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-white"
                      style={{ backgroundColor: getNodeColor(selectedNode) }}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {selectedNode.type === 'account'
                          ? 'person'
                          : selectedNode.type === 'device'
                          ? 'devices'
                          : selectedNode.type === 'file'
                          ? 'description'
                          : selectedNode.type === 'ip'
                          ? 'router'
                          : 'inventory_2'}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-data-mono text-outline uppercase font-bold">
                        {selectedNode.type} Entity
                      </div>
                      <h4 className="font-headline-md font-bold text-sm text-on-surface">
                        {selectedNode.label}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-outline hover:text-on-surface p-1 rounded"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Risk Level Badge */}
                <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/50 flex items-center justify-between font-data-mono text-[11px]">
                  <span className="text-outline uppercase">Forensic Risk Rating:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded uppercase ${
                      selectedNode.risk_level === 'critical'
                        ? 'bg-critical/20 text-critical border border-critical/40'
                        : selectedNode.risk_level === 'high'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-primary/20 text-primary border border-primary/40'
                    }`}
                  >
                    {selectedNode.risk_level}
                  </span>
                </div>

                {/* Properties */}
                <div className="space-y-2">
                  <div className="text-[10px] font-data-mono uppercase font-bold text-outline">
                    Recorded Attributes
                  </div>
                  <div className="space-y-1.5 font-data-mono text-[11px]">
                    {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                      <div
                        key={k}
                        className="p-2 rounded bg-surface-container border border-outline-variant/40 flex flex-col"
                      >
                        <span className="text-[9px] text-outline uppercase font-semibold">{k.replace(/_/g, ' ')}</span>
                        <span className="text-on-surface break-all font-medium mt-0.5">{String(v || 'N/A')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Edges */}
                <div className="space-y-2">
                  <div className="text-[10px] font-data-mono uppercase font-bold text-outline">
                    Connected Relations ({edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length})
                  </div>
                  <div className="space-y-1 font-data-mono text-[10px]">
                    {edges
                      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map((e) => {
                        const isSource = e.source === selectedNode.id;
                        return (
                          <div
                            key={e.id}
                            onClick={() => {
                              setSelectedEdge(e);
                              setSelectedNode(null);
                            }}
                            className="p-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 cursor-pointer flex items-center justify-between"
                          >
                            <span className="text-primary font-bold">{e.label}</span>
                            <span className="text-outline">{isSource ? 'OUTGOING' : 'INCOMING'}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {selectedEdge && (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-outline-variant/40 pb-2.5">
                  <div>
                    <div className="text-[10px] font-data-mono text-outline uppercase font-bold">
                      Relationship Link
                    </div>
                    <h4 className="font-headline-md font-bold text-sm text-primary">
                      {selectedEdge.label}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedEdge(null)}
                    className="text-outline hover:text-on-surface p-1 rounded"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Edge Details */}
                <div className="space-y-2 font-data-mono text-[11px]">
                  <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40">
                    <div className="text-[9px] text-outline uppercase font-bold">Type Identifier</div>
                    <div className="text-on-surface font-semibold mt-0.5">{selectedEdge.relationship_type}</div>
                  </div>

                  <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40">
                    <div className="text-[9px] text-outline uppercase font-bold">Corroborating Evidence Ref</div>
                    <div className="text-verified font-bold mt-0.5">{selectedEdge.evidence_ref || 'Corroborated by logs'}</div>
                  </div>

                  {selectedEdge.timestamp && (
                    <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40">
                      <div className="text-[9px] text-outline uppercase font-bold">Occurrence Timestamp (UTC)</div>
                      <div className="text-on-surface font-semibold mt-0.5">{selectedEdge.timestamp}</div>
                    </div>
                  )}

                  {selectedEdge.properties?.description && (
                    <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40">
                      <div className="text-[9px] text-outline uppercase font-bold">Forensic Synopsis</div>
                      <div className="text-on-surface font-sans text-xs mt-1 leading-relaxed">
                        {selectedEdge.properties.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-outline-variant/30 text-[10px] font-data-mono text-outline">
              FORENSIC-X ENTITY GRAPH ENGINE v1.0
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
