import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldCheck, Clipboard, Star, Check, AlertCircle, BarChart3, HelpCircle } from 'lucide-react';

interface AggregateReport {
  promedios: {
    pedagogica: number;
    tecnica: number;
    disciplinar: number;
    global: number;
  };
  conteos: {
    pedagogica: number;
    tecnica: number;
    disciplinar: number;
    total_expertos: number;
  };
  detalles_por_experto: Array<{
    nombre: string;
    fecha: string;
    pedagogica?: { valoracion: number; observaciones: string };
    tecnica?: { valoracion: number; observaciones: string };
    disciplinar?: { valoracion: number; observaciones: string };
  }>;
}

export const ExpertDashboard: React.FC = () => {
  const { token, apiBase } = useAuth();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<string>('form'); // form, report
  
  // Form States
  const [pedVal, setPedVal] = useState<number>(5);
  const [pedObs, setPedObs] = useState<string>('');
  
  const [tecVal, setTecVal] = useState<number>(5);
  const [tecObs, setTecObs] = useState<string>('');
  
  const [disVal, setDisVal] = useState<number>(5);
  const [disObs, setDisObs] = useState<string>('');

  // UI feedback states
  const [formFeedback, setFormFeedback] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Report data
  const [report, setReport] = useState<AggregateReport | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  useEffect(() => {
    fetchMyValidation();
    fetchAggregateReport();
  }, [token]);

  const fetchMyValidation = async () => {
    try {
      const res = await fetch(`${apiBase}/experts/my-validation`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const valList = await res.json();
        // prefill form if validation already exists
        const ped = valList.find((v: any) => v.dimension === 'pedagogica');
        const tec = valList.find((v: any) => v.dimension === 'tecnica');
        const dis = valList.find((v: any) => v.dimension === 'disciplinar');
        
        if (ped) { setPedVal(ped.valoracion); setPedObs(ped.observaciones); }
        if (tec) { setTecVal(tec.valoracion); setTecObs(tec.observaciones); }
        if (dis) { setDisVal(dis.valoracion); setDisObs(dis.observaciones); }

        if (valList.length > 0) {
          setFormSuccess(true);
          setFormFeedback("Has recuperado tu evaluación de experto guardada anteriormente. Puedes modificarla y volver a enviarla.");
        }
      }
    } catch (e) {
      console.error("Error fetching expert validations:", e);
    }
  };

  const fetchAggregateReport = async () => {
    setLoadingReport(true);
    try {
      const res = await fetch(`${apiBase}/experts/aggregate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReport(await res.json());
      }
    } catch (e) {
      console.error("Error loading aggregate validations report:", e);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSubmitValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedObs.trim() || !tecObs.trim() || !disObs.trim()) {
      setFormFeedback("Por favor completa las observaciones detalladas para las tres dimensiones.");
      setFormSuccess(false);
      return;
    }

    setSubmitting(true);
    setFormFeedback('');

    try {
      const res = await fetch(`${apiBase}/experts/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pedagogica_valoracion: pedVal,
          pedagogica_observaciones: pedObs,
          tecnica_valoracion: tecVal,
          tecnica_observaciones: tecObs,
          disciplinar_valoracion: disVal,
          disciplinar_observaciones: disObs
        })
      });

      if (res.ok) {
        setFormSuccess(true);
        setFormFeedback("¡Tu validación técnica-científica ha sido registrada en el sistema! Gracias por tu aporte al juicio de expertos.");
        fetchAggregateReport(); // update report
      } else {
        setFormFeedback("Error al registrar tu evaluación en la base de datos.");
      }
    } catch (err) {
      setFormFeedback("Error de conexión con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      
      {/* Banner */}
      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #38bdf8' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Juicio de Expertos & Validación</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Validación científica y tecnológica del Objeto Virtual de Aprendizaje (OVA) para la enseñanza del MRU. Evalúa la adecuación pedagógica (Taxonomía de Bloom), la calidad técnica (criterios COdA) y el rigor científico.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', paddingBottom: '2px' }} className="animate-fade-in">
        <button 
          className="btn" 
          onClick={() => setActiveTab('form')} 
          style={{
            background: activeTab === 'form' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'form' ? '#38bdf8' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'form' ? '2px solid #38bdf8' : 'none'
          }}
        >
          <Clipboard size={16} /> Instrumento de Evaluación
        </button>
        <button 
          className="btn" 
          onClick={() => {
            setActiveTab('report');
            fetchAggregateReport();
          }} 
          style={{
            background: activeTab === 'report' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'report' ? '#38bdf8' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'report' ? '2px solid #38bdf8' : 'none'
          }}
        >
          <BarChart3 size={16} /> Reporte Estadístico Consolidador
        </button>
      </div>

      {formFeedback && (
        <div className={`alert-box ${formSuccess ? 'alert-success' : 'alert-danger'} animate-fade-in`}>
          {formFeedback}
        </div>
      )}

      {/* TAB 1: EVALUATION FORM */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmitValidation} className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Dimension 1: Pedagogica */}
          <div className="glass-panel" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#c084fc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} /> 1. Dimensión Pedagógica (Estructuración Bloom)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Evalúa si los contenidos educativos y las actividades están adecuadamente estructurados de forma progresiva según los niveles cognitivos de la Taxonomía de Bloom Revisada (Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear).
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: '6px' }}>
                <label className="form-label">Valoración Técnica (1 = Deficiente, 5 = Excelente)</label>
                <span style={{ color: '#8b5cf6', fontWeight: 700 }}>{pedVal} / 5</span>
              </div>
              <input 
                type="range" min="1" max="5" 
                value={pedVal} 
                onChange={(e) => setPedVal(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#8b5cf6' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observaciones y Sugerencias de Mejora Pedagógica</label>
              <textarea 
                className="form-input" 
                rows={3} 
                placeholder="Indique las fortalezas y debilidades pedagógicas observadas en la ruta de aprendizaje..."
                value={pedObs}
                onChange={(e) => setPedObs(e.target.value)}
                style={{ resize: 'vertical', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Dimension 2: Tecnica */}
          <div className="glass-panel" style={{ borderLeft: '4px solid #10b981' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} /> 2. Dimensión Tecnológica (Criterios de Calidad COdA)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Evalúa la calidad del software educativo en base a la norma COdA: usabilidad, accesibilidad, diseño estético de interfaz, interactividad, navegación interactiva y reusabilidad del OVA.
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: '6px' }}>
                <label className="form-label">Valoración Técnica (1 = Deficiente, 5 = Excelente)</label>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{tecVal} / 5</span>
              </div>
              <input 
                type="range" min="1" max="5" 
                value={tecVal} 
                onChange={(e) => setTecVal(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observaciones y Sugerencias sobre la Interfaz y Usabilidad</label>
              <textarea 
                className="form-input" 
                rows={3} 
                placeholder="Indique aspectos de diseño, adaptabilidad y calidad de la simulación..."
                value={tecObs}
                onChange={(e) => setTecObs(e.target.value)}
                style={{ resize: 'vertical', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Dimension 3: Disciplinar */}
          <div className="glass-panel" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#7dd3fc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} /> 3. Dimensión Disciplinar (Física - Rigor Científico)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Evalúa si los conceptos científicos del Movimiento Rectilíneo Uniforme (MRU), las ecuaciones, las simulaciones físicas y la representación de gráficos coinciden estrictamente con las leyes y teorías de la Física clásica.
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: '6px' }}>
                <label className="form-label">Valoración Técnica (1 = Deficiente, 5 = Excelente)</label>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{disVal} / 5</span>
              </div>
              <input 
                type="range" min="1" max="5" 
                value={disVal} 
                onChange={(e) => setDisVal(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observaciones sobre el Rigor Físico y Científico de la Plataforma</label>
              <textarea 
                className="form-input" 
                rows={3} 
                placeholder="Indique si hay conceptos erróneos de velocidad, aceleración, unidades o resolución de fórmulas..."
                value={disObs}
                onChange={(e) => setDisObs(e.target.value)}
                style={{ resize: 'vertical', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-secondary" disabled={submitting} style={{ padding: '16px 40px', alignSelf: 'center' }}>
            <ShieldCheck size={20} /> {submitting ? "Registrando Validación..." : "Guardar y Firmar Instrumento de Validación"}
          </button>
        </form>
      )}

      {/* TAB 2: AGGREGATE STATS REPORT */}
      {activeTab === 'report' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {loadingReport ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando datos consolidados...</p>
          ) : report ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
              {/* Left Column: averages metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.4rem' }}>Promedios Generales de Validación</h3>
                
                <div className="glass-panel" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(22, 30, 49, 0.6) 100%)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Puntaje de Validación Global</div>
                  <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-title)' }}>{report.promedios.global} / 5</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Consolidado sobre {report.conteos.total_expertos} expertos validadores registrados.</p>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Ped */}
                  <div>
                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <span>Dimensión Pedagógica</span>
                      <span style={{ fontWeight: 600 }}>{report.promedios.pedagogica} / 5</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(report.promedios.pedagogica / 5) * 100}%`, background: '#8b5cf6', borderRadius: '4px' }} />
                    </div>
                  </div>

                  {/* Tec */}
                  <div>
                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <span>Dimensión Tecnológica (COdA)</span>
                      <span style={{ fontWeight: 600 }}>{report.promedios.tecnica} / 5</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(report.promedios.tecnica / 5) * 100}%`, background: '#10b981', borderRadius: '4px' }} />
                    </div>
                  </div>

                  {/* Dis */}
                  <div>
                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <span>Dimensión Disciplinar (Física)</span>
                      <span style={{ fontWeight: 600 }}>{report.promedios.disciplinar} / 5</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(report.promedios.disciplinar / 5) * 100}%`, background: '#38bdf8', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Expert comments list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.4rem' }}>Observaciones Detalladas de Expertos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
                  {report.detalles_por_experto.map((exp, idx) => (
                    <div key={idx} className="glass-panel" style={{ background: 'rgba(30, 41, 59, 0.2)' }}>
                      <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyBetween: 'space-between', fontSize: '0.85rem' }}>
                        <strong>{exp.nombre}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(exp.fecha).toLocaleDateString()}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                        {exp.pedagogica && (
                          <p>
                            <strong style={{ color: '#8b5cf6' }}>Pedagógica ({exp.pedagogica.valoracion}/5):</strong> "{exp.pedagogica.observaciones}"
                          </p>
                        )}
                        {exp.tecnica && (
                          <p>
                            <strong style={{ color: '#10b981' }}>Tecnológica ({exp.tecnica.valoracion}/5):</strong> "{exp.tecnica.observaciones}"
                          </p>
                        )}
                        {exp.disciplinar && (
                          <p>
                            <strong style={{ color: '#38bdf8' }}>Disciplinar ({exp.disciplinar.valoracion}/5):</strong> "{exp.disciplinar.observaciones}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {report.detalles_por_experto.length === 0 && (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aún no hay validaciones de expertos registradas en el sistema.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se logró consolidar el reporte.</p>
          )}

        </div>
      )}

    </div>
  );
};
