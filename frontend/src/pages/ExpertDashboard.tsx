import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clipboard } from 'lucide-react';
import { ExpertEvaluationLinks } from '../components/ExpertEvaluationLinks';

interface ExpertDashboardProps {
  onNavigate: (view: string) => void;
}

export const ExpertDashboard: React.FC<ExpertDashboardProps> = ({ onNavigate }) => {
  const { token, apiBase } = useAuth();

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      
      {/* Banner */}
      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #38bdf8' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Juicio de Expertos & Validación</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Validación científica y tecnológica del Objeto Virtual de Aprendizaje (OVA) para la enseñanza del MRU. Evalúa la adecuación pedagógica (Taxonomía de Bloom), la calidad técnica (criterios COdA) y el rigor científico.
        </p>
        <button className="btn btn-primary" onClick={() => onNavigate('dashboard')} style={{ marginTop: '18px' }}>
          <Clipboard size={16} /> Ver y recorrer todos los niveles
        </button>
      </div>

      <ExpertEvaluationLinks />

    </div>
  );
};
