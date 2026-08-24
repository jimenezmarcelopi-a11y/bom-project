import React from 'react';
import { Dashboard } from './Dashboard';

interface ExpertDashboardProps {
  onNavigate: (view: string) => void;
}

export const ExpertDashboard: React.FC<ExpertDashboardProps> = ({ onNavigate }) => {
  return (
    <Dashboard
      onSelectModule={(moduleNum) => onNavigate(`level${moduleNum}`)}
      onBack={undefined}
    />
  );
};
