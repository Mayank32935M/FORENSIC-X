import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCases, fetchCase } from '../services/api';
import type { Case } from '../services/api';

interface CaseContextType {
  activeCaseId: string;
  activeCase: Case | null;
  cases: Case[];
  setActiveCaseId: (id: string) => void;
  refreshCases: () => Promise<void>;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isHealthModalOpen: boolean;
  setIsHealthModalOpen: (open: boolean) => void;
  isAlertsModalOpen: boolean;
  setIsAlertsModalOpen: (open: boolean) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>('');
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const refreshCases = async () => {
    try {
      const data = await fetchCases();
      setCases(data);
      if (data.length > 0 && !activeCaseId) {
        // Default to INS-2026-0042 if available, otherwise first
        const preferred = data.find((c) => c.case_number === 'INS-2026-0042') || data[0];
        setActiveCaseId(preferred.id);
        setActiveCase(preferred);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    }
  };

  useEffect(() => {
    refreshCases();
  }, []);

  useEffect(() => {
    if (activeCaseId) {
      const found = cases.find((c) => c.id === activeCaseId);
      if (found) {
        setActiveCase(found);
      } else {
        fetchCase(activeCaseId)
          .then(setActiveCase)
          .catch(() => null);
      }
    }
  }, [activeCaseId, cases]);

  // Keyboard shortcut listener for Cmd+K (Search) & Cmd+J (Copilot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsHealthModalOpen(false);
        setIsAlertsModalOpen(false);
        setIsCopilotOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <CaseContext.Provider
      value={{
        activeCaseId,
        activeCase,
        cases,
        setActiveCaseId,
        refreshCases,
        isSearchOpen,
        setIsSearchOpen,
        isHealthModalOpen,
        setIsHealthModalOpen,
        isAlertsModalOpen,
        setIsAlertsModalOpen,
        isCopilotOpen,
        setIsCopilotOpen,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCaseContext = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCaseContext must be used within a CaseProvider');
  }
  return context;
};
