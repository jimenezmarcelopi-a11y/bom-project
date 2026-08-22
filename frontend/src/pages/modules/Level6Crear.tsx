import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Sparkles, BookOpen, Send, Check, Eye, HelpCircle } from 'lucide-react';

interface Level6Props {
  onBack: () => void;
}

interface PortfolioItem {
  id?: string;
  puntuacion: number;
  respuestas: {
    tipo_creacion: string;
    titulo: string;
    contexto?: string;
    enunciado: string;
    datos_fisicos?: string;
    solucion_paso_a_paso?: string;
    materiales?: string;
    procedimiento?: string;
    control_errores?: string;
  };
  evidencia: string;
  comentario_docente: string | null;
  fecha_actualizacion: string;
}

export const Level6Crear: React.FC<Level6Props> = ({ onBack }) => {
  const { token, updateModuleAnalytics, apiBase } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('problem'); // problem, experiment, portfolio
  
  // Activity ID
  const [activityId, setActivityId] = useState<string | null>(null);

  // Problem Creator States
  const [probTitle, setProbTitle] = useState<string>('');
  const [probContext, setProbContext] = useState<string>('deportes');
  const [probEnunciado, setProbEnunciado] = useState<string>('');
  const [probDatos, setProbDatos] = useState<string>('');
  const [probSolucion, setProbSolucion] = useState<string>('');
  
  // AI Feedback states
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  // Experiment Designer States
  const [expTitle, setExpTitle] = useState<string>('');
  const [expMateriales, setExpMateriales] = useState<string>('');
  const [expProcedimiento, setExpProcedimiento] = useState<string>('');
  const [expErrores, setExpErrores] = useState<string>('');

  // General Portfolio States
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>([]);
  const [formFeedback, setFormFeedback] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Active time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      updateModuleAnalytics(6, 10);
    }, 10000);
    return () => {
      clearInterval(interval);
      updateModuleAnalytics(6, 3);
    };
  }, []);

  // Fetch Level 6 Activity and portfolio items
  useEffect(() => {
    fetchPortfolio();
  }, [token]);

  const fetchPortfolio = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Activity ID
      const actRes = await fetch(`${apiBase}/activities/module/6`, { headers });
      if (actRes.ok) {
        const acts = await actRes.json();
        const portAct = acts.find((a: any) => a.tipo === 'portafolio');
        if (portAct) setActivityId(portAct.id);
      }

      // My evaluations (filter for Level 6 activity ID to build portfolio)
      const evRes = await fetch(`${apiBase}/activities/my-evaluations`, { headers });
      if (evRes.ok) {
        const evals = await evRes.json();
        // Since we store all Level 6 work in evaluations, we list them
        const level6Evals = evals.filter((e: any) => e.actividad_id === "f6666666-6666-6666-6666-111111111111" || (portAct && e.actividad_id === portAct.id));
        setPortfolioList(level6Evals);
      }
    } catch (err) {
      console.error("Error loading Level 6 data:", err);
    }
  };

  // Call AI Assistant for validation
  const handleConsultAI = async () => {
    if (!probEnunciado.trim()) {
      setAiFeedback("Por favor redacta al menos el enunciado del problema antes de consultar al asistente de IA.");
      return;
    }

    setLoadingAI(true);
    setAiFeedback('');

    try {
      const res = await fetch(`${apiBase}/ai/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          problem: probEnunciado,
          student_formula: "v = d/t o d = v*t",
          student_calculation: probDatos,
          student_result: probSolucion
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiFeedback(data.feedback);
      } else {
        setAiFeedback("No se pudo obtener respuesta del asistente de IA en este momento.");
      }
    } catch (e) {
      setAiFeedback("Error de conexión al servidor del asistente de IA.");
    } finally {
      setLoadingAI(false);
    }
  };

  // Save Problem to Portfolio
  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!probTitle.trim() || !probEnunciado.trim() || !probSolucion.trim()) {
      setFormFeedback("Por favor completa los campos de título, enunciado y resolución.");
      setFormSuccess(false);
      return;
    }

    setSubmitting(true);
    setFormFeedback('');

    const respuestasPayload = {
      tipo_creacion: "problema_mru",
      titulo: probTitle,
      contexto: probContext,
      enunciado: probEnunciado,
      datos_fisicos: probDatos,
      solucion_paso_a_paso: probSolucion
    };

    if (activityId) {
      try {
        const res = await fetch(`${apiBase}/activities/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            actividad_id: activityId,
            puntuacion: 0.0, // Teachers will score portfolio items manually
            respuestas: respuestasPayload,
            evidencia: `Problema: "${probTitle}" (Contexto: ${probContext})`,
            completada: true
          })
        });

        if (res.ok) {
          setFormSuccess(true);
          setFormFeedback("¡Problema original guardado exitosamente en tu Portafolio Digital!");
          // Clear inputs
          setProbTitle('');
          setProbEnunciado('');
          setProbDatos('');
          setProbSolucion('');
          setAiFeedback('');
          
          // Refresh list
          fetchPortfolio();
        } else {
          setFormFeedback("Hubo un error al guardar la evidencia en la base de datos.");
        }
      } catch (err) {
        console.error("Error saving portfolio problem:", err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Save Experiment to Portfolio
  const handleSaveExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expMateriales.trim() || !expProcedimiento.trim()) {
      setFormFeedback("Por favor completa los campos de título, materiales y procedimiento experimental.");
      setFormSuccess(false);
      return;
    }

    setSubmitting(true);
    setFormFeedback('');

    const respuestasPayload = {
      tipo_creacion: "experimento_mru",
      titulo: expTitle,
      materiales: expMateriales,
      procedimiento: expProcedimiento,
      control_errores: expErrores
    };

    if (activityId) {
      try {
        const res = await fetch(`${apiBase}/activities/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            actividad_id: activityId,
            puntuacion: 0.0,
            respuestas: respuestasPayload,
            evidencia: `Experimento: "${expTitle}"`,
            completada: true
          })
        });

        if (res.ok) {
          setFormSuccess(true);
          setFormFeedback("¡Diseño experimental guardado exitosamente en tu Portafolio Digital!");
          // Clear inputs
          setExpTitle('');
          setExpMateriales('');
          setExpProcedimiento('');
          setExpErrores('');
          
          // Refresh list
          fetchPortfolio();
        } else {
          setFormFeedback("Hubo un error al guardar el experimento en la base de datos.");
        }
      } catch (err) {
        console.error("Error saving portfolio experiment:", err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #8b5cf6' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Módulo 6: CREAR</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          El nivel más alto de la taxonomía cognitiva. Genera conocimiento original diseñando tus propios enunciados de problemas de física o redactando guías experimentales caseras verificables.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', paddingBottom: '2px' }} className="animate-fade-in">
        <button 
          className="btn" 
          onClick={() => {
            setActiveTab('problem');
            setFormFeedback('');
          }} 
          style={{
            background: activeTab === 'problem' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'problem' ? '#8b5cf6' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'problem' ? '2px solid #8b5cf6' : 'none'
          }}
        >
          <Sparkles size={16} /> Diseñador de Problemas
        </button>
        <button 
          className="btn" 
          onClick={() => {
            setActiveTab('experiment');
            setFormFeedback('');
          }} 
          style={{
            background: activeTab === 'experiment' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'experiment' ? '#8b5cf6' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'experiment' ? '2px solid #8b5cf6' : 'none'
          }}
        >
          <BookOpen size={16} /> Diseño Experimental
        </button>
        <button 
          className="btn" 
          onClick={() => {
            setActiveTab('portfolio');
            setFormFeedback('');
          }} 
          style={{
            background: activeTab === 'portfolio' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'portfolio' ? '#8b5cf6' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'portfolio' ? '2px solid #8b5cf6' : 'none'
          }}
        >
          <Eye size={16} /> Portafolio Digital ({portfolioList.length})
        </button>
      </div>

      {/* Forms feedback */}
      {formFeedback && (
        <div className={`alert-box ${formSuccess ? 'alert-success' : 'alert-danger'} animate-fade-in`}>
          {formFeedback}
        </div>
      )}

      {/* PROBLEM CREATOR TAB */}
      {activeTab === 'problem' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Creador de Enunciados MRU</h2>
            
            <form onSubmit={handleSaveProblem} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Título del Problema</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. El Cohete Espacial a Velocidad de Crucero" 
                  value={probTitle}
                  onChange={(e) => setProbTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contexto del Enunciado</label>
                <select 
                  className="form-select"
                  value={probContext}
                  onChange={(e) => setProbContext(e.target.value)}
                >
                  <option value="deportes">Deportes (carreras, natación)</option>
                  <option value="viajes">Viajes (trenes, autos, aviones)</option>
                  <option value="ciencia_ficcion">Ciencia Ficción (cohetes, ovnis)</option>
                  <option value="cotidiano">Entorno Urbano Cotidiano</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Enunciado del Problema (Redacción descriptiva)</label>
                <textarea 
                  className="form-input"
                  rows={4}
                  placeholder="Un cohete espacial viaja en línea recta a una velocidad constante de..."
                  value={probEnunciado}
                  onChange={(e) => setProbEnunciado(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Datos de Física (Variables d, v, t con unidades)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. v = 500 m/s; t = 60 s; d = ?" 
                  value={probDatos}
                  onChange={(e) => setProbDatos(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Solución y Paso a Paso</label>
                <textarea 
                  className="form-input"
                  rows={3}
                  placeholder="Ej. d = v * t => d = 500 * 60 = 30,000 metros o 30 km."
                  value={probSolucion}
                  onChange={(e) => setProbSolucion(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={16} /> Enviar al Portafolio Digital
              </button>
            </form>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Validador Físico con Inteligencia Artificial</h2>
            <div className="glass-panel" style={{ padding: '24px', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
                  El módulo de IA de la plataforma BOM puede verificar si tu problema está correctamente redactado y si la ecuación matemática física y la resolución numérica planteada guardan coherencia científica.
                </p>
                
                {aiFeedback ? (
                  <div className="alert-box alert-info animate-fade-in" style={{ fontSize: '0.85rem', maxHeight: '350px', overflowY: 'auto', lineHeight: '1.5' }}>
                    <strong>Retroalimentación de IA:</strong>
                    <div style={{ marginTop: '8px', whiteSpace: 'pre-line' }}>{aiFeedback}</div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>
                    Presiona el botón de abajo para consultar la retroalimentación de Inteligencia Artificial sobre tu enunciado redactado.
                  </p>
                )}
              </div>

              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleConsultAI}
                disabled={loadingAI}
                style={{ width: '100%', borderColor: 'var(--primary)', color: '#c084fc', background: 'rgba(139,92,246,0.05)' }}
              >
                <Sparkles size={16} /> {loadingAI ? "Verificando con la IA..." : "Consultar Retroalimentación de IA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPERIMENT DESIGNER TAB */}
      {activeTab === 'experiment' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', textAlign: 'center' }}>Diseñador de Metodologías Experimentales</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px', fontSize: '0.9rem' }}>
            Diseña un experimento físico que puedas realizar en tu hogar utilizando elementos cotidianos para comprobar experimentalmente que un móvil describe un Movimiento Rectilíneo Uniforme.
          </p>

          <form onSubmit={handleSaveExperiment} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Título del Experimento</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Medición de velocidad constante en burbuja de aceite" 
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Materiales a utilizar</label>
              <textarea 
                className="form-input"
                rows={3}
                placeholder="Ej. Tubo transparente con aceite, cronómetro de teléfono, cinta métrica, marcador para trazar líneas de distancia cada 10 cm."
                value={expMateriales}
                onChange={(e) => setExpMateriales(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Procedimiento Experimental (Paso a paso)</label>
              <textarea 
                className="form-input"
                rows={5}
                placeholder="Ej. 1. Llenamos el tubo con aceite dejando una pequeña burbuja. 2. Marcamos distancias iguales de 10cm, 20cm, 30cm... 3. Medimos el tiempo en que la burbuja tarda en pasar por cada marca..."
                value={expProcedimiento}
                onChange={(e) => setExpProcedimiento(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cálculo de Incertidumbre y Control de Errores (Opcional)</label>
              <textarea 
                className="form-input"
                rows={3}
                placeholder="Ej. El error humano al presionar el cronómetro es el principal factor. Haremos 3 repeticiones por cada tramo y calcularemos el promedio..."
                value={expErrores}
                onChange={(e) => setExpErrores(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'center', padding: '12px 40px' }}>
              <Save size={16} /> Guardar Diseño en Portafolio
            </button>
          </form>
        </div>
      )}

      {/* PORTFOLIO TAB */}
      {activeTab === 'portfolio' && (
        <div style={{ maxWidth: '850px', margin: '0 auto' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Tu Portafolio Digital de Evidencias</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {portfolioList.map((item, idx) => {
              const creation = item.respuestas;
              const isProblem = creation.tipo_creacion === 'problema_mru';
              
              return (
                <div key={idx} className="glass-panel" style={{ background: 'rgba(30, 41, 59, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: isProblem ? '#8b5cf6' : '#06b6d4', 
                        background: isProblem ? 'rgba(139,92,246,0.12)' : 'rgba(6,182,212,0.12)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {isProblem ? 'Problema Original' : 'Diseño Experimental'}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', color: 'white', marginTop: '8px' }}>
                        {creation.titulo}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(item.fecha_actualizacion).toLocaleDateString()}
                      </span>
                      <div style={{ marginTop: '4px' }}>
                        {item.comentario_docente ? (
                          <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>
                            Calificación: {item.puntuacion} / 100
                          </span>
                        ) : (
                          <span style={{ color: 'var(--warning)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                            Pendiente de calificación
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isProblem ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                      <p><strong>Enunciado:</strong> {creation.enunciado}</p>
                      {creation.datos_fisicos && <p><strong>Datos Físicos:</strong> <code>{creation.datos_fisicos}</code></p>}
                      <p><strong>Resolución paso a paso:</strong> {creation.solucion_paso_a_paso}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                      <p><strong>Materiales:</strong> {creation.materiales}</p>
                      <p><strong>Procedimiento paso a paso:</strong> {creation.procedimiento}</p>
                      {creation.control_errores && <p><strong>Gestión de errores:</strong> {creation.control_errores}</p>}
                    </div>
                  )}

                  {/* Teacher Feedback section */}
                  {item.comentario_docente && (
                    <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid #10b981', borderRadius: '4px' }}>
                      <h4 style={{ fontSize: '0.88rem', color: 'white', fontWeight: 600, marginBottom: '4px' }}>
                        Retroalimentación de tu Profesor:
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        "{item.comentario_docente}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {portfolioList.length === 0 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                <HelpCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Aún no has enviado creaciones a tu portafolio. ¡Empieza diseñando un problema o experimento!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
