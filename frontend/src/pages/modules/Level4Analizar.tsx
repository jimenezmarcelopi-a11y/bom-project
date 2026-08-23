import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';
import { OvaTools } from '../../components/OvaTools';

interface Level4Props {
  onBack: () => void;
}

interface ActivityData {
  enunciado: string;
  opciones_diagnostico: string[];
  correct_idx: number;
  solucion_correcta: string;
}

export const Level4Analizar: React.FC<Level4Props> = ({ onBack }) => {
  const { token, updateModuleAnalytics, apiBase } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('debugger'); // debugger, graph_analysis
  
  // Data
  const [actData, setActData] = useState<ActivityData | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);

  // Debugger state
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [debugSubmitted, setDebugSubmitted] = useState<boolean>(false);
  const [debugFeedback, setDebugFeedback] = useState<string>('');
  const [debugScore, setDebugScore] = useState<number>(0);

  // Segmented Graph Analyzer state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [answers, setAnswers] = useState<{ segA: string; segB: string; segC: string }>({ segA: '', segB: '', segC: '' });
  const [analysisFeedback, setAnalysisFeedback] = useState<string>('');
  const [analysisSuccess, setAnalysisSuccess] = useState<boolean>(false);

  // Timer tracking
  useEffect(() => {
    const interval = setInterval(() => {
      updateModuleAnalytics(4, 10);
    }, 10000);
    return () => {
      clearInterval(interval);
      updateModuleAnalytics(4, 3);
    };
  }, []);

  // Fetch Level 4 Activity
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${apiBase}/activities/module/4`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const acts = await res.json();
          const errAct = acts.find((a: any) => a.tipo === 'error_debug');
          if (errAct) {
            setActivityId(errAct.id);
            setActData(JSON.parse(errAct.contenido));
          }
        }
      } catch (err) {
        console.error("Error fetching Level 4 activity:", err);
      }
    };
    fetchActivity();
  }, [token]);

  // Submit Debugger Activity
  const submitDebugActivity = async (optIdx: number) => {
    if (debugSubmitted || !actData) return;
    
    setSelectedOpt(optIdx);
    const correct = optIdx === actData.correct_idx;
    const score = correct ? 100 : 0;
    
    setDebugSubmitted(true);
    setDebugScore(score);
    
    if (correct) {
      setDebugFeedback("¡Correcto! Identificaste el error con precisión.");
    } else {
      setDebugFeedback("Respuesta incorrecta. El error se debe a la discrepancia de unidades.");
    }

    if (activityId) {
      try {
        await fetch(`${apiBase}/activities/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            actividad_id: activityId,
            puntuacion: score,
            respuestas: { seleccion: optIdx, correcta: correct },
            completada: true
          })
        });
      } catch (e) {
        console.error("Error submitting Level 4 activity:", e);
      }
    }
  };

  const resetDebugger = () => {
    setSelectedOpt(null);
    setDebugSubmitted(false);
    setDebugFeedback('');
    setDebugScore(0);
  };

  // Render segmented graph on canvas
  useEffect(() => {
    if (activeTab !== 'graph_analysis') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Theme Colors
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Axes
    const oX = 50;
    const oY = 160;
    const w = 380;
    const h = 130;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(oX, oY - h - 10);
    ctx.lineTo(oX, oY);
    ctx.lineTo(oX + w + 10, oY);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Outfit';
    ctx.fillText('Posición x (m)', oX - 45, oY - h - 18);
    ctx.fillText('Tiempo t (s)', oX + w - 20, oY + 18);

    // Y ticks (0, 10, 20, 30, 40)
    ctx.font = '10px Inter';
    ctx.fillStyle = '#64748b';
    for (let pos = 0; pos <= 40; pos += 10) {
      const py = oY - (pos / 40) * h;
      ctx.fillRect(oX - 4, py, 4, 1);
      ctx.fillText(`${pos}`, oX - 22, py + 3);
    }

    // X ticks (0, 2, 4, 6, 8, 10)
    for (let sec = 0; sec <= 10; sec += 2) {
      const px = oX + (sec / 10) * w;
      ctx.fillRect(px, oY, 1, 4);
      ctx.fillText(`${sec}`, px - 3, oY + 15);
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    // Horizontal grid lines
    for (let pos = 10; pos <= 40; pos += 10) {
      const py = oY - (pos / 40) * h;
      ctx.beginPath();
      ctx.moveTo(oX, py);
      ctx.lineTo(oX + w, py);
      ctx.stroke();
    }
    // Vertical grid lines
    for (let sec = 2; sec <= 10; sec += 2) {
      const px = oX + (sec / 10) * w;
      ctx.beginPath();
      ctx.moveTo(px, oY);
      ctx.lineTo(px, oY - h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // DRAW SEGMENTS
    // A: (0,0) -> (4,40)
    // B: (4,40) -> (8,40)
    // C: (8,40) -> (10,10)
    const p0 = { x: oX, y: oY };
    const p1 = { x: oX + (4 / 10) * w, y: oY - h };
    const p2 = { x: oX + (8 / 10) * w, y: oY - h };
    const p3 = { x: oX + w, y: oY - (10 / 40) * h };

    // Draw lines
    ctx.lineWidth = 4;
    ctx.shadowBlur = 8;

    // Segment A (Green)
    ctx.strokeStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    // Segment B (Yellow)
    ctx.strokeStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Segment C (Red)
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.stroke();

    ctx.shadowBlur = 0; // Reset shadow

    // Segment Labels in Chart
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Inter';
    ctx.fillText('Tramo A', oX + (2 / 10) * w - 20, oY - (20 / 40) * h - 10);
    ctx.fillText('Tramo B', oX + (6 / 10) * w - 20, oY - h - 10);
    ctx.fillText('Tramo C', oX + (9 / 10) * w - 20, oY - (25 / 40) * h - 10);

  }, [activeTab]);

  // Handle segmented graph analysis checking
  const handleVerifyAnalysis = () => {
    // Correct values:
    // Tramo A velocity: 10 m/s  (40m / 4s)
    // Tramo B velocity: 0 m/s   (rest)
    // Tramo C velocity: -15 m/s ((10m - 40m) / 2s = -30/2 = -15)
    const cleanA = answers.segA.trim();
    const cleanB = answers.segB.trim();
    const cleanC = answers.segC.trim();

    if (cleanA === '10' && cleanB === '0' && cleanC === '-15') {
      setAnalysisFeedback("¡Impecable! Has calculado de forma correcta las pendientes (velocidades) de cada tramo.");
      setAnalysisSuccess(true);
    } else {
      let errors = [];
      if (cleanA !== '10') errors.push("Tramo A (recuerda: v = (x_f - x_i)/t = 40/4)");
      if (cleanB !== '0') errors.push("Tramo B (el móvil está en reposo)");
      if (cleanC !== '-15') errors.push("Tramo C (recuerda el signo: x_f = 10m, x_i = 40m, t = 2s)");
      setAnalysisFeedback(`Hay errores en: ${errors.join(', ')}. Recuerda colocar el signo negativo si retrocede.`);
    }
  };

  const handleResetAnalysis = () => {
    setAnswers({ segA: '', segB: '', segC: '' });
    setAnalysisFeedback('');
    setAnalysisSuccess(false);
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #ec4899' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Módulo 4: ANALIZAR</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Deconstruye problemas físicos y gráficas complejas en tramos de movimiento. Identifica fallos de conversión de unidades y calcula velocidades segmentadas distinguiendo sentidos de avance.
        </p>
      </div>
      <OvaTools title="Nivel 4 - Analizar" description="Análisis de errores y gráficas del MRU." includeEvaluation />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', paddingBottom: '2px' }} className="animate-fade-in">
        <button 
          className="btn" 
          onClick={() => setActiveTab('debugger')} 
          style={{
            background: activeTab === 'debugger' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'debugger' ? '#ec4899' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'debugger' ? '2px solid #ec4899' : 'none'
          }}
        >
          <AlertTriangle size={16} /> Depurador de Errores
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('graph_analysis')} 
          style={{
            background: activeTab === 'graph_analysis' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'graph_analysis' ? '#ec4899' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'graph_analysis' ? '2px solid #ec4899' : 'none'
          }}
        >
          <BarChart3 size={16} /> Analizador de Gráficas por Tramos
        </button>
      </div>

      {/* TAB 1: ERROR DEBUGGER */}
      {activeTab === 'debugger' && actData && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Encuentra el Error del Estudiante</h2>
          
          <div className="glass-panel" style={{ marginBottom: '24px', background: 'rgba(236, 72, 153, 0.03)', borderColor: 'rgba(236, 72, 153, 0.15)' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#ec4899', marginBottom: '8px', fontWeight: 600 }}>Enunciado y Solución Errónea:</h3>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {actData.enunciado}
            </p>
          </div>

          {debugFeedback && (
            <div className={`alert-box ${debugScore === 100 ? 'alert-success' : 'alert-danger'} animate-fade-in`}>
              {debugFeedback}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {actData.opciones_diagnostico.map((opt, idx) => {
              const isSelected = selectedOpt === idx;
              const isCorrect = actData.correct_idx === idx;
              
              let bg = '#FFFFFF';
              let border = '1px solid var(--panel-border)';
              let color = 'var(--text-primary)';

              if (debugSubmitted) {
                if (isCorrect) {
                  bg = 'rgba(16, 185, 129, 0.15)';
                  border = '1px solid #10b981';
                  color = '#10b981';
                } else if (isSelected) {
                  bg = 'rgba(239, 68, 68, 0.15)';
                  border = '1px solid #ef4444';
                  color = '#ef4444';
                }
              } else if (isSelected) {
                bg = 'rgba(236, 72, 153, 0.25)';
                border = '1px solid #ec4899';
              }

              return (
                <button
                  key={idx}
                  onClick={() => submitDebugActivity(idx)}
                  disabled={debugSubmitted}
                  className="btn btn-outline"
                  style={{
                    justifyContent: 'flex-start',
                    padding: '16px',
                    background: bg,
                    borderColor: border,
                    color: color,
                    textAlign: 'left',
                    lineHeight: '1.4'
                  }}
                >
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isSelected ? '#ec4899' : 'rgba(255,255,255,0.05)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.92rem' }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {debugSubmitted && (
            <div className="glass-panel animate-fade-in" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#10b981', marginBottom: '8px' }}>Explicación Física Científica:</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {actData.solucion_correcta}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button className="btn btn-outline" onClick={resetDebugger}>
                  <RefreshCw size={14} /> Volver a Intentar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRAPH SEGMENT ANALYSIS */}
      {activeTab === 'graph_analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Análisis de Movimiento por Tramos</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
              Observa con atención la gráfica de Posición contra Tiempo ($x-t$) de la derecha. El movimiento completo consta de 3 tramos bien diferenciados (A, B y C). Calcula la velocidad en cada segmento aplicando la fórmula de la pendiente:
            </p>
            
            <p style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#ec4899', padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '4px', textAlign: 'center', marginBottom: '24px' }}>
              v = (x_final - x_inicial) / (t_final - t_inicial)
            </p>

            {analysisFeedback && (
              <div className={`alert-box ${analysisSuccess ? 'alert-success' : 'alert-danger'} animate-fade-in`}>
                {analysisFeedback}
              </div>
            )}

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Velocidad Tramo A (m/s) (de t=0s a t=4s)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Calcula v..." 
                  value={answers.segA}
                  onChange={(e) => setAnswers(prev => ({ ...prev, segA: e.target.value }))}
                  disabled={analysisSuccess}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Velocidad Tramo B (m/s) (de t=4s a t=8s)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Calcula v..." 
                  value={answers.segB}
                  onChange={(e) => setAnswers(prev => ({ ...prev, segB: e.target.value }))}
                  disabled={analysisSuccess}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Velocidad Tramo C (m/s) (de t=8s a t=10s)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Calcula v..." 
                  value={answers.segC}
                  onChange={(e) => setAnswers(prev => ({ ...prev, segC: e.target.value }))}
                  disabled={analysisSuccess}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              {!analysisSuccess ? (
                <button className="btn btn-primary" onClick={handleVerifyAnalysis}>
                  Verificar Análisis
                </button>
              ) : (
                <button className="btn btn-outline" onClick={handleResetAnalysis}>
                  <RefreshCw size={14} /> Analizar de Nuevo
                </button>
              )}
            </div>
          </div>

          <div>
            <canvas 
              ref={canvasRef} 
              width={450} 
              height={220} 
              style={{
                width: '100%',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--panel-border)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '16px'
              }}
            />
            
            <div className="glass-panel" style={{ padding: '16px', background: '#FFFFFF' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Pistas de Análisis:</h4>
              <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Tramo A (Verde):</strong> Recorre 40 metros en 4 segundos hacia adelante.</li>
                <li><strong>Tramo B (Naranja):</strong> Se mantiene en la marca de 40 metros durante 4 segundos.</li>
                <li><strong>Tramo C (Rojo):</strong> Regresa de la marca de 40 metros a la marca de 10 metros en 2 segundos.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
