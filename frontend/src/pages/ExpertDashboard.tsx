import React from 'react';
import { ArrowRight, BookOpen, ClipboardCheck, ExternalLink } from 'lucide-react';
import { SECTION_A_URL } from '../components/OvaTools';

interface ExpertDashboardProps {
  onNavigate: (view: string) => void;
}

const evaluationSections = [
  { name: 'Sección A', description: 'Coherencia pedagógica y alineación con Bloom', url: SECTION_A_URL },
  { name: 'Sección B', description: 'Pertinencia técnica y funcionalidad del OVA', url: 'https://docs.google.com/forms/d/e/1FAIpQLSfPwpuKhoTTiWEIfY0osEy7afeBcQ-m5c8ekh3Hamfu2GS8Yg/viewform?usp=header' },
  { name: 'Sección C', description: 'Calidad y exactitud de los contenidos del MRU', url: 'https://docs.google.com/forms/d/e/1FAIpQLScNzXdYcVXy_u7-wrh_p0q5p95oKp3l7xrQ1SAeVjTB6oI0Vg/viewform?usp=header' },
  { name: 'Sección D', description: 'Valoración cualitativa global: fortalezas, mejoras y recomendaciones', url: 'https://docs.google.com/forms/d/e/1FAIpQLScq0HJM2DzwzLhMcl32UiErivq5ztGdlFRPGZTKNIkU2q1N3Q/viewform?usp=header' }
];

export const ExpertDashboard: React.FC<ExpertDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #38bdf8' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Juicio de Expertos & Validación</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Validación científica y tecnológica del Objeto Virtual de Aprendizaje (OVA) para la enseñanza del MRU. Evalúa la adecuación pedagógica, la calidad técnica y el rigor científico.
        </p>
        <button className="btn btn-primary" onClick={() => onNavigate('dashboard')} style={{ marginTop: '18px' }}>
          <BookOpen size={16} /> Ver y recorrer todos los niveles
        </button>
      </div>

      <section className="glass-panel" style={{ marginBottom: '32px' }} aria-labelledby="expert-panels-title">
        <h2 id="expert-panels-title" style={{ fontSize: '1.35rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardCheck size={21} style={{ color: 'var(--primary)' }} /> Panel del validador
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onNavigate('dashboard')}
            style={{ justifyContent: 'space-between', minHeight: '120px', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <span>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Recorrido por niveles</strong>
              <small style={{ color: 'var(--text-secondary)' }}>Explora la ruta de aprendizaje del OVA.</small>
            </span>
            <ArrowRight size={16} />
          </button>

          {evaluationSections.map((section) => (
            <a
              key={section.name}
              className="btn btn-outline"
              href={section.url}
              target="_blank"
              rel="noreferrer"
              style={{ justifyContent: 'space-between', minHeight: '120px', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <span>
                <strong style={{ display: 'block', marginBottom: '8px' }}>{section.name}</strong>
                <small style={{ color: 'var(--text-secondary)' }}>{section.description}</small>
              </span>
              <ExternalLink size={16} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
