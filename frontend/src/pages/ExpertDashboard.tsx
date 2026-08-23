import React from 'react';
import { ExpertEvaluationLinks } from '../components/ExpertEvaluationLinks';

interface ExpertDashboardProps {
  onNavigate: (view: string) => void;
}

export const ExpertDashboard: React.FC<ExpertDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <ExpertEvaluationLinks />
    </div>
  );
};
