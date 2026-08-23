import React from 'react';
import { ClipboardCheck, ExternalLink } from 'lucide-react';
import { SECTION_A_URL } from './OvaTools';

const evaluationSections = [
  { name: 'Sección A', description: 'Coherencia pedagógica y alineación con Bloom', url: SECTION_A_URL },
  { name: 'Sección B', description: 'Pertinencia técnica y funcionalidad del OVA', url: 'https://docs.google.com/forms/d/e/1FAIpQLSfPwpuKhoTTiWEIfY0osEy7afeBcQ-m5c8ekh3Hamfu2GS8Yg/viewform?usp=header' },
  { name: 'Sección C', description: 'Calidad y exactitud de los contenidos del MRU', url: 'https://docs.google.com/forms/d/e/1FAIpQLScNzXdYcVXy_u7-wrh_p0q5p95oKp3l7xrQ1SAeVjTB6oI0Vg/viewform?usp=header' },
  { name: 'Sección D', description: 'Valoración cualitativa global: fortalezas, mejoras y recomendaciones', url: 'https://docs.google.com/forms/d/e/1FAIpQLScq0HJM2DzwzLhMcl32UiErivq5ztGdlFRPGZTKNIkU2q1N3Q/viewform?usp=header' }
];

export const ExpertEvaluationLinks: React.FC = () => (
  <section className="glass-panel" style={{ marginBottom: '32px' }} aria-labelledby="evaluation-links-title">
    <h2 id="evaluation-links-title" style={{ fontSize: '1.35rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ClipboardCheck size={21} style={{ color: 'var(--primary)' }} /> Formularios de evaluación de la tesis
    </h2>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
      Accede a cada sección para valorar el OVA. Cada formulario se abre en una pestaña nueva.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
      {evaluationSections.map((section) => (
        <a key={section.name} className="btn btn-outline" href={section.url} target="_blank" rel="noreferrer" style={{ justifyContent: 'space-between', minHeight: '58px', textAlign: 'left' }}>
          <span><strong style={{ display: 'block' }}>{section.name}</strong><small style={{ color: 'var(--text-secondary)' }}>{section.description}</small></span>
          <ExternalLink size={16} />
        </a>
      ))}
    </div>
  </section>
);
