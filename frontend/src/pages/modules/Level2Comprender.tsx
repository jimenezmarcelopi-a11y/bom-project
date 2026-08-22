import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, BookOpen, Brain, Play, RotateCcw, AlertCircle, Check } from 'lucide-react';

interface Level2Props {
  onBack: () => void;
}

export const Level2Comprender: React.FC<Level2Props> = ({ onBack }) => {
  const { token, updateModuleAnalytics, apiBase } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('animation'); // animation, matching, analogy
  
  // Simulation Settings
  const [motionType, setMotionType] = useState<string>('forward'); // forward, rest, backward
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [carX, setCarX] = useState<number>(10); // scale 0-100m
  
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Matching Activity State
  const [selectedDesc, setSelectedDesc] = useState<string | null>(null);
  const [selectedGraph, setSelectedGraph] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [activityId, setActivityId] = useState<string | null>(null);
  const [matchingCompleted, setMatchingCompleted] = useState<boolean>(false);

  // Seed timer
  useEffect(() => {
    const interval = setInterval(() => {
      updateModuleAnalytics(2, 10);
    }, 10000);
    return () => {
      clearInterval(interval);
      updateModuleAnalytics(2, 3);
    };
  }, []);

  // Fetch activity ID
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${apiBase}/activities/module/2`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const acts = await res.json();
          const matchAct = acts.find((a: any) => a.tipo === 'emparejamiento');
          if (matchAct) setActivityId(matchAct.id);
        }
      } catch (err) {
        console.error("Error fetching Level 2 activities:", err);
      }
    };
    fetchActivity();
  }, [token]);

  // Physics calculation
  const getPhysicsValues = (t: number) => {
    let x0 = 10;
    let v = 6; // m/s
    if (motionType === 'rest') {
      x0 = 50;
      v = 0;
    } else if (motionType === 'backward') {
      x0 = 90;
      v = -6;
    }
    
    // Position equation: x = x0 + vt
    const pos = Math.max(0, Math.min(100, x0 + v * t));
    return { pos, speed: v };
  };

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      const update = () => {
        setTime(prevTime => {
          const nextTime = prevTime + 0.05;
          const { pos } = getPhysicsValues(nextTime);
          setCarX(pos);
          
          // Stop when car reaches boundaries
          if ((motionType === 'forward' && pos >= 90) || 
              (motionType === 'backward' && pos <= 10) || 
              nextTime >= 13) {
            setIsPlaying(false);
            return prevTime;
          }
          return nextTime;
        });
        animationRef.current = requestAnimationFrame(update);
      };
      animationRef.current = requestAnimationFrame(update);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, motionType]);

  // Draw simulation and graphs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Track (road)
    const roadY = 90;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, roadY);
    ctx.lineTo(canvas.width - 30, roadY);
    ctx.stroke();

    // Road markings
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(30, roadY - 1);
    ctx.lineTo(canvas.width - 30, roadY - 1);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw scale ticks
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter';
    for (let i = 0; i <= 10; i++) {
      const labelX = 30 + i * ((canvas.width - 60) / 10);
      ctx.fillRect(labelX, roadY, 2, 8);
      ctx.fillText(`${i * 10}m`, labelX - 10, roadY + 20);
    }

    // Draw Car (as a clean, glowy box representation)
    const scaleFactor = (canvas.width - 60) / 100;
    const carXPixel = 30 + carX * scaleFactor;
    
    ctx.fillStyle = motionType === 'forward' ? '#3b82f6' : motionType === 'backward' ? '#ec4899' : '#10b981';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(carXPixel - 20, roadY - 30, 40, 20, 6);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset glow

    // Car cabin outline
    ctx.fillStyle = '#ffffff30';
    ctx.beginPath();
    ctx.roundRect(carXPixel - 10, roadY - 42, 20, 15, 4);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(carXPixel - 12, roadY - 5, 6, 0, Math.PI * 2);
    ctx.arc(carXPixel + 12, roadY - 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // --- DRAW GRAPHS (v-t and x-t side-by-side below) ---
    const graphWidth = 160;
    const graphHeight = 110;
    
    // --- GRAPH 1: x-t (Posición vs Tiempo) ---
    const xtX = 50;
    const xtY = 160;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    // Axes
    ctx.beginPath();
    ctx.moveTo(xtX, xtY);
    ctx.lineTo(xtX, xtY + graphHeight);
    ctx.lineTo(xtX + graphWidth, xtY + graphHeight);
    ctx.stroke();
    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Outfit';
    ctx.fillText('x (m)', xtX - 35, xtY + 12);
    ctx.fillText('t (s)', xtX + graphWidth - 10, xtY + graphHeight + 15);
    ctx.fillText('Posición vs Tiempo', xtX + 10, xtY - 10);
    
    // Draw current trajectory for x-t
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    for (let tStep = 0; tStep <= time; tStep += 0.1) {
      let x0_val = 10;
      let v_val = 6;
      if (motionType === 'rest') { x0_val = 50; v_val = 0; }
      else if (motionType === 'backward') { x0_val = 90; v_val = -6; }
      
      const xtVal = Math.max(0, Math.min(100, x0_val + v_val * tStep));
      const ptX = xtX + (tStep / 13) * graphWidth;
      const ptY = (xtY + graphHeight) - (xtVal / 100) * graphHeight;
      if (tStep === 0) ctx.moveTo(ptX, ptY);
      else ctx.lineTo(ptX, ptY);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // --- GRAPH 2: v-t (Velocidad vs Tiempo) ---
    const vtX = 280;
    const vtY = 160;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    // Axes
    ctx.beginPath();
    ctx.moveTo(vtX, vtY);
    ctx.lineTo(vtX, vtY + graphHeight);
    ctx.lineTo(vtX + graphWidth, vtY + graphHeight);
    ctx.stroke();
    // Midpoint zero velocity if backward
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vtX, vtY + graphHeight / 2);
    ctx.lineTo(vtX + graphWidth, vtY + graphHeight / 2);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Outfit';
    ctx.fillText('v (m/s)', vtX - 45, vtY + 12);
    ctx.fillText('t (s)', vtX + graphWidth - 10, vtY + graphHeight + 15);
    ctx.fillText('Velocidad vs Tiempo', vtX + 10, vtY - 10);
    
    // Speed ticks
    ctx.font = '9px Inter';
    ctx.fillText('+10', vtX - 22, vtY + 15);
    ctx.fillText('0', vtX - 15, vtY + graphHeight / 2 + 3);
    ctx.fillText('-10', vtX - 22, vtY + graphHeight - 10);

    // Draw current trajectory for v-t
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    const { speed } = getPhysicsValues(0);
    const speedY = (vtY + graphHeight / 2) - (speed / 20) * graphHeight;
    ctx.moveTo(vtX, speedY);
    ctx.lineTo(vtX + (time / 13) * graphWidth, speedY);
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [carX, time, motionType]);

  const handleStartSim = () => {
    setIsPlaying(true);
  };

  const handleResetSim = () => {
    setIsPlaying(false);
    setTime(0);
    const { pos } = getPhysicsValues(0);
    setCarX(pos);
  };

  const changeMotionType = (type: string) => {
    setIsPlaying(false);
    setMotionType(type);
    setTime(0);
    let x0 = 10;
    if (type === 'rest') x0 = 50;
    if (type === 'backward') x0 = 90;
    setCarX(x0);
  };

  // Matching game logic
  const handleSelectDesc = (desc: string) => {
    if (matchingCompleted) return;
    setSelectedDesc(desc);
    checkMatch(desc, selectedGraph);
  };

  const handleSelectGraph = (graph: string) => {
    if (matchingCompleted) return;
    setSelectedGraph(graph);
    checkMatch(selectedDesc, graph);
  };

  const checkMatch = async (desc: string | null, graph: string | null) => {
    if (!desc || !graph) return;

    const pairs: { [key: string]: string } = {
      "Movimiento uniforme alejándose del origen": "Pendiente positiva en x-t",
      "Movimiento uniforme regresando al origen": "Pendiente negativa en x-t",
      "Estado de reposo absoluto": "Pendiente nula en x-t",
      "Velocidad constante positiva": "Línea horizontal sobre el eje temporal en v-t"
    };

    if (pairs[desc] === graph) {
      setMatchedPairs(prev => [...prev, desc]);
      setFeedback("¡Asociación correcta!");
      setSelectedDesc(null);
      setSelectedGraph(null);

      if (matchedPairs.length + 1 === 4) {
        setMatchingCompleted(true);
        setFeedback("¡Excelente! Has comprendido e interpretado todas las representaciones gráficas.");

        // Submit to database
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
                puntuacion: 100,
                respuestas: { completed: true },
                completada: true
              })
            });
          } catch (e) {
            console.error("Error submitting comprehend matching:", e);
          }
        }
      }
    } else {
      setFeedback("No corresponde. Observa las gráficas del simulador y vuelve a intentarlo.");
      setSelectedDesc(null);
      setSelectedGraph(null);
    }
  };

  const resetMatching = () => {
    setMatchedPairs([]);
    setSelectedDesc(null);
    setSelectedGraph(null);
    setFeedback('');
    setMatchingCompleted(false);
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #10b981' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Módulo 2: COMPRENDER</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Interpreta el comportamiento físico del MRU. Visualiza las relaciones de cambio a través de animaciones y asocia diferentes movimientos rectilíneos con su representación gráfica exacta.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', paddingBottom: '2px' }} className="animate-fade-in">
        <button 
          className="btn" 
          onClick={() => setActiveTab('animation')} 
          style={{
            background: activeTab === 'animation' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'animation' ? '#10b981' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'animation' ? '2px solid #10b981' : 'none'
          }}
        >
          <Play size={16} /> Animación Gráfica
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('matching')} 
          style={{
            background: activeTab === 'matching' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'matching' ? '#10b981' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'matching' ? '2px solid #10b981' : 'none'
          }}
        >
          <Brain size={16} /> Actividad: Gráficas
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('analogy')} 
          style={{
            background: activeTab === 'analogy' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'analogy' ? '#10b981' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'analogy' ? '2px solid #10b981' : 'none'
          }}
        >
          <BookOpen size={16} /> Analogías Cotidianas
        </button>
      </div>

      {/* ANIMATION TAB */}
      {activeTab === 'animation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '32px' }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Simulador de Trazado de Gráficas</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
              Selecciona un escenario de movimiento, haz clic en **Iniciar** y observa cómo se grafican de manera síncrona la Posición ($x-t$) y la Velocidad ($v-t$) en tiempo real.
            </p>

            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '12px' }}>1. Selecciona el Tipo de Movimiento:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="btn btn-outline"
                  onClick={() => changeMotionType('forward')}
                  style={{
                    justifyContent: 'flex-start',
                    background: motionType === 'forward' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.2)',
                    borderColor: motionType === 'forward' ? '#3b82f6' : 'var(--panel-border)'
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', marginRight: '10px' }} />
                  <strong>MRU Directo:</strong> Velocidad positiva constante (+6 m/s) aleja al móvil del origen.
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => changeMotionType('rest')}
                  style={{
                    justifyContent: 'flex-start',
                    background: motionType === 'rest' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.2)',
                    borderColor: motionType === 'rest' ? '#10b981' : 'var(--panel-border)'
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', marginRight: '10px' }} />
                  <strong>Reposo Absoluto:</strong> Velocidad nula (0 m/s) mantiene al móvil inmóvil en 50m.
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => changeMotionType('backward')}
                  style={{
                    justifyContent: 'flex-start',
                    background: motionType === 'backward' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(0,0,0,0.2)',
                    borderColor: motionType === 'backward' ? '#ec4899' : 'var(--panel-border)'
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ec4899', marginRight: '10px' }} />
                  <strong>MRU Retroceso:</strong> Velocidad negativa (-6 m/s) acerca al móvil al origen.
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-primary" onClick={handleStartSim} disabled={isPlaying || time >= 12}>
                Iniciar Animación
              </button>
              <button className="btn btn-outline" onClick={handleResetSim}>
                <RotateCcw size={16} /> Reiniciar
              </button>
            </div>
            
            <div className="alert-box alert-info" style={{ marginTop: '24px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '4px' }}>
                <AlertCircle size={14} /> Relación Teórica:
              </div>
              Una velocidad constante se traduce en una **pendiente lineal recta** en la gráfica de posición, demostrando que distancias iguales se recorren en tiempos iguales.
            </div>
          </div>

          <div>
            <canvas 
              ref={canvasRef} 
              width={480} 
              height={300} 
              style={{
                width: '100%',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--panel-border)',
                boxShadow: 'var(--shadow-md)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '0 8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Tiempo transcurrido: <strong>{time.toFixed(1)}s</strong></span>
              <span>Posición actual: <strong>{carX.toFixed(1)}m</strong></span>
              <span>Velocidad: <strong>{getPhysicsValues(time).speed} m/s</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* MATCHING TAB */}
      {activeTab === 'matching' && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>Asociación Gráfica-Concepto</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '0.9rem' }}>
            Pon a prueba tu comprensión. Asocia cada tipo de movimiento con su comportamiento correspondiente en las gráficas de física.
          </p>

          {feedback && (
            <div className={`alert-box ${feedback.includes('incorrecta') || feedback.includes('No corresponde') ? 'alert-danger' : 'alert-success'} animate-fade-in`} style={{ textAlign: 'center' }}>
              {feedback}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
            {/* Descriptions Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#10b981', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '8px' }}>Movimiento</h3>
              {[
                "Movimiento uniforme alejándose del origen",
                "Movimiento uniforme regresando al origen",
                "Estado de reposo absoluto",
                "Velocidad constante positiva"
              ].map((d) => {
                const isMatched = matchedPairs.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => handleSelectDesc(d)}
                    disabled={isMatched}
                    className="btn btn-outline"
                    style={{
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: isMatched 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : selectedDesc === d 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(30, 41, 59, 0.2)',
                      borderColor: isMatched 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : selectedDesc === d 
                          ? '#10b981' 
                          : 'var(--panel-border)',
                      color: isMatched ? '#10b981' : 'white',
                      pointerEvents: isMatched ? 'none' : 'auto',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '0.88rem' }}>{d}</span>
                    {isMatched && <Check size={16} />}
                  </button>
                );
              })}
            </div>

            {/* Graphs Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#10b981', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '8px' }}>Descripción de Gráfica</h3>
              {[
                "Pendiente positiva en x-t",
                "Línea horizontal sobre el eje temporal en v-t",
                "Pendiente negativa en x-t",
                "Pendiente nula en x-t"
              ].map((g) => {
                const pairs: { [key: string]: string } = {
                  "Movimiento uniforme alejándose del origen": "Pendiente positiva en x-t",
                  "Movimiento uniforme regresando al origen": "Pendiente negativa en x-t",
                  "Estado de reposo absoluto": "Pendiente nula en x-t",
                  "Velocidad constante positiva": "Línea horizontal sobre el eje temporal en v-t"
                };
                const isMatched = matchedPairs.some(d => pairs[d] === g);
                
                return (
                  <button
                    key={g}
                    onClick={() => handleSelectGraph(g)}
                    disabled={isMatched}
                    className="btn btn-outline"
                    style={{
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: isMatched 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : selectedGraph === g 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(30, 41, 59, 0.2)',
                      borderColor: isMatched 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : selectedGraph === g 
                          ? '#10b981' 
                          : 'var(--panel-border)',
                      color: isMatched ? '#10b981' : 'white',
                      pointerEvents: isMatched ? 'none' : 'auto',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '0.88rem' }}>{g}</span>
                    {isMatched && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={resetMatching}>
              <RotateCcw size={14} /> Reiniciar Juego
            </button>
          </div>
        </div>
      )}

      {/* ANALOGY TAB */}
      {activeTab === 'analogy' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Comprensión mediante Analogías de la Vida Cotidiana</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', background: 'rgba(30, 41, 59, 0.2)' }}>
              <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🚶‍♂️💨</div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '6px' }}>La Cinta Transportadora del Aeropuerto</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Cuando te subes a una banda transportadora recta en el aeropuerto y te quedas quieto, la banda te mueve a una velocidad fija constante. Cada segundo recorres exactamente la misma cantidad de metros. No aceleras ni frenas: esto es un MRU perfecto en la realidad urbana.
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', background: 'rgba(30, 41, 59, 0.2)' }}>
              <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🪜</div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '6px' }}>La Escalera Mecánica</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Una escalera mecánica funciona a una velocidad uniforme regulada por motores. Si observáramos un escalón de la escalera en su tramo recto, veríamos que sube a velocidad constante. La distancia vertical y horizontal avanzan en proporciones lineales directas con el tiempo.
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', background: 'rgba(30, 41, 59, 0.2)' }}>
              <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🚢</div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '6px' }}>Un Barco de Carga en Alta Mar</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Una vez que un gran carguero alcanza el mar abierto, sus motores operan a revoluciones constantes en trayectos de cientos de millas. En ausencia de oleaje fuerte, el barco describe una trayectoria prácticamente rectilínea con velocidad uniforme durante horas, lo que constituye un excelente ejemplo de MRU a escala geográfica.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
