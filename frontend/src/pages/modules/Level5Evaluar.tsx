import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Scale, FileText, Check, AlertCircle } from 'lucide-react';

interface Level5Props {
  onBack: () => void;
}

interface CaseData {
  caso: string;
  preguntas_guia: string[];
}

export const Level5Evaluar: React.FC<Level5Props> = ({ onBack }) => {
  const { token, updateModuleAnalytics, apiBase } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('case'); // case, rubric
  
  // Data
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);

  // Argument Form States
  const [averageSpeedInput, setAverageSpeedInput] = useState<string>('');
  const [verdict, setVerdict] = useState<string>('no_decision'); // guilty, innocent, no_decision
  const [argumentText, setArgumentText] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Rubric States
  const [activeSample, setActiveSample] = useState<number>(0);
  const [rubricScores, setRubricScores] = useState<{ precision: number; formulas: number; claridad: number }>({ precision: 1, formulas: 1, claridad: 1 });
  const [rubricSubmitted, setRubricSubmitted] = useState<{ [key: number]: boolean }>({});

  const sampleArguments = [
    {
      id: 0,
      studentName: "Estudiante A (Nivel Inicial)",
      text: "Yo creo que el conductor tiene razón porque el velocímetro mide la velocidad en ese momento y si él dice que iba a 80, pues es verdad. Quizás las cámaras se equivocaron con la hora o el reloj del carro tiene otro huso horario. La física a veces falla si hay interferencias del clima.",
      score: "Poco científico. Carece de fórmulas y análisis matemático. Acepta el testimonio sin pruebas."
    },
    {
      id: 1,
      studentName: "Estudiante B (Nivel Medio)",
      text: "Calculé la velocidad promedio. El carro recorrió 3 km en 2 minutos. En una hora hay 60 minutos, así que 2 minutos son 0.033 horas. Al dividir 3 km / 0.033 h da más o menos 90.9 km/h. Como 90.9 es mayor que 80 km/h, entonces el conductor sí iba rápido y la fotomulta es justa. El conductor se distrajo.",
      score: "Buen cálculo cuantitativo, aunque redondea el tiempo de manera imprecisa y carece de rigor formal para rebatir el argumento del velocímetro."
    },
    {
      id: 2,
      studentName: "Estudiante C (Nivel Avanzado - Excelente)",
      text: "La multa está justificada físicamente. El tiempo de trayecto es t = 2 min = 1/30 h. La distancia es d = 3 km. La velocidad media es v = d/t = 3 km / (1/30 h) = 90 km/h. Por el teorema del valor medio, si la velocidad promedio en un intervalo es de 90 km/h, la velocidad instantánea del auto tuvo que haber sido como mínimo de 90 km/h en algún momento. El velocímetro mide velocidad instantánea, por ende, el conductor miente o su velocímetro está descalibrado, ya que debió marcar más de 80 km/h durante el trayecto.",
      score: "Excelente. Rigor matemático exacto, despejes correctos, y rebate científicamente el argumento del velocímetro utilizando conceptos de velocidad media e instantánea."
    }
  ];

  // Timer tracking
  useEffect(() => {
    const interval = setInterval(() => {
      updateModuleAnalytics(5, 10);
    }, 10000);
    return () => {
      clearInterval(interval);
      updateModuleAnalytics(5, 3);
    };
  }, []);

  // Fetch Level 5 Activity details
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${apiBase}/activities/module/5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const acts = await res.json();
          const debateAct = acts.find((a: any) => a.tipo === 'debate');
          if (debateAct) {
            setActivityId(debateAct.id);
            setCaseData(JSON.parse(debateAct.contenido));
          }
        }
      } catch (err) {
        console.error("Error fetching Level 5 activity:", err);
      }
    };
    fetchActivity();
  }, [token]);

  // Submit essay for teacher grading
  const handleSendArgument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!argumentText.trim() || !averageSpeedInput.trim() || verdict === 'no_decision') {
      setFeedbackMsg("Por favor completa los cálculos, el veredicto y redacta tu argumentación.");
      return;
    }

    setSubmitting(true);
    setFeedbackMsg('');

    const answersPayload = {
      velocidad_promedio_calculada: averageSpeedInput,
      veredicto_seleccionado: verdict,
      argumentacion_redactada: argumentText
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
            puntuacion: 0.0, // Teachers will score this manually on their panel
            respuestas: answersPayload,
            evidencia: `Veredicto: ${verdict === 'guilty' ? 'Culpable' : 'Inocente'}. Velocidad calculada: ${averageSpeedInput} km/h.`,
            completada: true
          })
        });

        if (res.ok) {
          setIsSubmitted(true);
          setFeedbackMsg("¡Tu argumentación ha sido enviada con éxito! Tu docente la evaluará en base a la rúbrica científica.");
        } else {
          setFeedbackMsg("Error al guardar la respuesta en la base de datos.");
        }
      } catch (err) {
        console.error("Error submitting Level 5 essay:", err);
        setFeedbackMsg("Error de conexión al servidor.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleScoreRubric = (sampleId: number) => {
    setRubricSubmitted(prev => ({ ...prev, [sampleId]: true }));
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #f43f5e' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Módulo 5: EVALUAR</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Emite juicios críticos fundamentados en leyes físicas. Analiza discrepancias técnicas entre testimonios y modelos científicos de MRU y aprende a calificar la validez de un argumento usando rúbricas de evaluación.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', paddingBottom: '2px' }} className="animate-fade-in">
        <button 
          className="btn" 
          onClick={() => setActiveTab('case')} 
          style={{
            background: activeTab === 'case' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'case' ? '#f43f5e' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'case' ? '2px solid #f43f5e' : 'none'
          }}
        >
          <Scale size={16} /> Estudio de Caso: La Fotomulta
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('rubric')} 
          style={{
            background: activeTab === 'rubric' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'rubric' ? '#f43f5e' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'rubric' ? '2px solid #f43f5e' : 'none'
          }}
        >
          <FileText size={16} /> Actividad: Rúbrica Científica
        </button>
      </div>

      {/* TAB 1: CASE STUDY & FORM */}
      {activeTab === 'case' && caseData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Estudio de Caso Real</h2>
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.15)', marginBottom: '20px' }}>
              <p style={{ color: 'white', lineHeight: '1.6', fontSize: '0.92rem', marginBottom: '12px' }}>
                {caseData.caso}
              </p>
              <h4 style={{ color: '#f43f5e', fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Preguntas Orientadoras:</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {caseData.preguntas_guia.map((p, idx) => <li key={idx}>{p}</li>)}
              </ul>
            </div>

            <div className="alert-box alert-warning" style={{ fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '4px' }}>
                <AlertCircle size={14} /> Nota de Investigación:
              </div>
              Tus respuestas serán enviadas a la plataforma para el seguimiento de analíticas de aprendizaje y serán revisadas individualmente por tu profesor.
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Tu Evaluación Argumentativa</h2>
            
            {feedbackMsg && (
              <div className={`alert-box ${isSubmitted ? 'alert-success' : 'alert-danger'} animate-fade-in`}>
                {feedbackMsg}
              </div>
            )}

            <form onSubmit={handleSendArgument} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Velocidad Promedio Calculada (en km/h)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Ej. 90" 
                  value={averageSpeedInput}
                  onChange={(e) => setAverageSpeedInput(e.target.value)}
                  disabled={isSubmitted}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Veredicto Físico Científico</label>
                <select 
                  className="form-select"
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                  disabled={isSubmitted}
                >
                  <option value="no_decision">Selecciona un veredicto...</option>
                  <option value="guilty">Culpable (Excedió el límite de velocidad de 80 km/h)</option>
                  <option value="innocent">Inocente (No hay pruebas matemáticas de exceso de velocidad)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Justificación Científica (Redacta tus argumentos y ecuaciones)</label>
                <textarea
                  className="form-input"
                  rows={5}
                  placeholder="Escribe aquí tu análisis... Ej: Dado que d = 3 km y t = 2 min (1/30 h), entonces..."
                  value={argumentText}
                  onChange={(e) => setArgumentText(e.target.value)}
                  disabled={isSubmitted}
                  style={{ resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: '1.5' }}
                />
              </div>

              {!isSubmitted ? (
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  <Save size={16} /> Enviar Veredicto Científico
                </button>
              ) : (
                <button type="button" className="btn btn-outline" onClick={() => setIsSubmitted(false)}>
                  Modificar Envío
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: RUBRIC */}
      {activeTab === 'rubric' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Calibración de Argumentos (Rúbrica)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
              Evaluar implica emitir juicios fundamentados. A continuación tienes 3 respuestas reales enviadas por otros estudiantes. Selecciona un estudiante, analiza su argumentación en base a la física y evalúalo utilizando los criterios de la rúbrica interactiva.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sampleArguments.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setActiveSample(sample.id);
                    setFeedbackMsg('');
                  }}
                  className="btn btn-outline"
                  style={{
                    justifyContent: 'flex-start',
                    background: activeSample === sample.id ? 'rgba(244, 63, 94, 0.15)' : 'rgba(0,0,0,0.2)',
                    borderColor: activeSample === sample.id ? '#f43f5e' : 'var(--panel-border)'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeSample === sample.id ? '#f43f5e' : 'var(--text-muted)', marginRight: '10px' }} />
                  {sample.studentName}
                </button>
              ))}
            </div>

            <div className="glass-panel" style={{ marginTop: '24px', background: 'rgba(30, 41, 59, 0.2)' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'white', marginBottom: '8px' }}>Argumento Escrito del Estudiante:</h4>
              <p style={{ fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                "{sampleArguments[activeSample].text}"
              </p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Rúbrica de Calificación Científica</h2>
            
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Criterion 1 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ color: 'white' }}>1. Precisión Física (Juicio del caso)</label>
                  <span style={{ color: '#f43f5e', fontWeight: 600 }}>{rubricScores.precision} / 5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={rubricScores.precision}
                  onChange={(e) => setRubricScores(prev => ({ ...prev, precision: parseInt(e.target.value) }))}
                  disabled={rubricSubmitted[activeSample]}
                  style={{ width: '100%', accentColor: '#f43f5e' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>¿Diferencia velocidad promedio de instantánea y da un veredicto correcto?</span>
              </div>

              {/* Criterion 2 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ color: 'white' }}>2. Rigor Matemático (Cálculos y despejes)</label>
                  <span style={{ color: '#f43f5e', fontWeight: 600 }}>{rubricScores.formulas} / 5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={rubricScores.formulas}
                  onChange={(e) => setRubricScores(prev => ({ ...prev, formulas: parseInt(e.target.value) }))}
                  disabled={rubricSubmitted[activeSample]}
                  style={{ width: '100%', accentColor: '#f43f5e' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>¿Expresa las unidades y despeja la ecuación v = d/t correctamente?</span>
              </div>

              {/* Criterion 3 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ color: 'white' }}>3. Claridad y Coherencia Argumentativa</label>
                  <span style={{ color: '#f43f5e', fontWeight: 600 }}>{rubricScores.claridad} / 5</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={rubricScores.claridad}
                  onChange={(e) => setRubricScores(prev => ({ ...prev, claridad: parseInt(e.target.value) }))}
                  disabled={rubricSubmitted[activeSample]}
                  style={{ width: '100%', accentColor: '#f43f5e' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>¿La redacción es coherente y responde a las preguntas guía de forma lógica?</span>
              </div>

              {!rubricSubmitted[activeSample] ? (
                <button className="btn btn-primary" onClick={() => handleScoreRubric(activeSample)}>
                  Confirmar Calificación del Par
                </button>
              ) : (
                <div className="animate-fade-in">
                  <div className="alert-box alert-success" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
                    <Check size={16} style={{ display: 'inline', marginRight: '6px' }} />
                    <strong>Calificación confirmada.</strong> Promedio otorgado: {((rubricScores.precision + rubricScores.formulas + rubricScores.claridad) / 3).toFixed(1)} / 5.
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <h5 style={{ fontSize: '0.82rem', color: 'white', marginBottom: '4px' }}>Retroalimentación del Experto Docente:</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {sampleArguments[activeSample].score}
                    </p>
                  </div>
                  <button className="btn btn-outline" style={{ width: '100%', marginTop: '12px' }} onClick={() => setRubricSubmitted(prev => ({ ...prev, [activeSample]: false }))}>
                    Recalificar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
