import React from 'react';

export const RelationshipGraph: React.FC = () => {
  return (
    <div className="flex w-full h-[calc(100vh-8rem)]">
      {/* Left Sidebar / Controls */}
      <aside className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col">
        <div className="p-3 bg-surface-container-lowest border-b border-outline-variant/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
            <span className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-tight">Graph Topology</span>
          </div>
          <span className="text-[10px] text-outline font-data-mono">CASE: SYN-001 (18 Nodes)</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Node Entities</span>
            <div className="space-y-1">
              <label className="flex items-center justify-between p-1.5 bg-surface-container hover:bg-surface-container-high cursor-pointer rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary"></span>
                  <span className="font-data-mono text-[11px] text-on-surface">Subject / User</span>
                </div>
                <span className="text-[9px] px-1 py-0.5 bg-primary/20 text-primary font-bold rounded">1</span>
              </label>
              <label className="flex items-center justify-between p-1.5 bg-surface-container hover:bg-surface-container-high cursor-pointer rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-outline"></span>
                  <span className="font-data-mono text-[11px] text-on-surface">File / Artifact</span>
                </div>
                <span className="text-[9px] px-1 py-0.5 bg-outline/20 text-on-surface font-bold rounded">8</span>
              </label>
              <label className="flex items-center justify-between p-1.5 bg-surface-container hover:bg-surface-container-high cursor-pointer rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary"></span>
                  <span className="font-data-mono text-[11px] text-on-surface">USB / Removable</span>
                </div>
                <span className="text-[9px] px-1 py-0.5 bg-secondary/20 text-secondary font-bold rounded">2</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Epistemic Tier</span>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-1.5 bg-secondary-container/10 hover:bg-secondary-container/20 text-left rounded">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-secondary"></span>
                  <span className="text-[10px] text-secondary uppercase font-bold">VERIFIED</span>
                </div>
                <span className="font-data-mono text-[9px] text-secondary font-bold">14</span>
              </button>
              <button className="w-full flex items-center justify-between p-1.5 bg-surface-container text-left rounded">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary"></span>
                  <span className="text-[10px] text-primary uppercase font-bold">INFERENCE</span>
                </div>
                <span className="font-data-mono text-[9px] text-primary font-bold">7</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 relative overflow-hidden flex items-center justify-center bg-surface-container-lowest">
        <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-3 font-data-mono text-[9px] text-outline bg-surface-container-low px-2 py-1 rounded border border-outline-variant/60">
          <span className="text-primary font-bold">GRAPH_COORDS</span>
          <span>X: 0x01A4 [420.28]</span>
          <span>Y: 0x037A [890.14]</span>
          <span>ZOOM: 1.25x</span>
        </div>
        
        {/* SVG Grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <pattern height="24" id="grid-dots" patternUnits="userSpaceOnUse" width="24">
              <circle cx="12" cy="12" fill="#859399" r="0.75"></circle>
            </pattern>
          </defs>
          <rect fill="url(#grid-dots)" height="100%" width="100%"></rect>
        </svg>

        {/* Dummy SVG Nodes (simplified for React UI) */}
        <svg className="w-full h-full cursor-grab active:cursor-grabbing select-none" viewBox="0 0 1000 680">
          <defs>
            <marker id="arrow" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="20" refY="5" viewBox="0 0 10 10">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#3c494e"></path>
            </marker>
            <marker id="arrow-exfil" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="22" refY="5" viewBox="0 0 10 10">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8"></path>
            </marker>
          </defs>

          {/* Edges */}
          <line markerEnd="url(#arrow)" stroke="#3c494e" strokeWidth="1.5" x1="400" x2="250" y1="200" y2="350"></line>
          <line markerEnd="url(#arrow-exfil)" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" x1="250" x2="550" y1="350" y2="400"></line>
          <line markerEnd="url(#arrow)" stroke="#3c494e" strokeWidth="1.5" x1="250" x2="150" y1="350" y2="250"></line>

          {/* Nodes */}
          {/* User Node */}
          <g transform="translate(400,200)">
            <circle cx="0" cy="0" r="24" fill="#1c2025" stroke="#38bdf8" strokeWidth="2"></circle>
            <text fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="10" fontWeight="bold" textAnchor="middle" x="0" y="40">J.Doe_Acct</text>
            <text fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" x="0" y="52">SUBJECT_01</text>
          </g>

          {/* Laptop Node */}
          <g transform="translate(250,350)">
            <circle cx="0" cy="0" r="32" fill="#1c2025" stroke="#a5e7ff" strokeWidth="2.5"></circle>
            <text fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" textAnchor="middle" x="0" y="48">DEV-LPT-99</text>
            <text fill="#859399" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" x="0" y="60">EVD-001</text>
          </g>

          {/* USB Node */}
          <g transform="translate(550,400)">
            <circle cx="0" cy="0" r="28" fill="#1c2025" stroke="#4edea3" strokeWidth="2"></circle>
            <text fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="10" fontWeight="bold" textAnchor="middle" x="0" y="45">SanDisk_Ultra</text>
            <text fill="#4edea3" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" x="0" y="57">EVD-003</text>
          </g>
          
          {/* Event Node */}
          <g transform="translate(150,250)">
            <circle cx="0" cy="0" r="16" fill="#1c2025" stroke="#859399" strokeWidth="1.5"></circle>
            <text fill="#e2e8f0" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="0" y="30">EVTX:4624</text>
          </g>

        </svg>
      </main>
    </div>
  );
};
