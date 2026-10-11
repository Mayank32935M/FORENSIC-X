import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CasesList } from './pages/CasesList';
import { CreateCase } from './pages/CreateCase';
import { CaseOverview } from './pages/CaseOverview';
import { Evidence } from './pages/Evidence';
import { Findings } from './pages/Findings';
import { RelationshipGraph } from './pages/RelationshipGraph';
import { Timeline } from './pages/Timeline';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<CasesList />} />
          <Route path="cases/new" element={<CreateCase />} />
          <Route path="cases/:id" element={<CaseOverview />} />
          <Route path="evidence" element={<Evidence />} />
          <Route path="findings" element={<Findings />} />
          <Route path="graph" element={<RelationshipGraph />} />
          <Route path="timeline" element={<Timeline />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
