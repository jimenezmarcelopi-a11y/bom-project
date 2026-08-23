import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Play, RotateCcw, HelpCircle, Check, AlertCircle, Eye } from 'lucide-react';
import { OvaTools, SoundToggle, useOvaSound } from '../../components/OvaTools';

interface Level3Props {
  onBack: () => void;
}

interface ChallengeData {
  challenge: string;
  datos: { x0: number; x_target: number; t_target: number };
  respuesta_esperada: number;
  unidad: string;
}

export const Level3Aplicar: React.FC<Level3Props> = ({ onBack }) => {
  const { token, updateModuleAnalytics, apiBase } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('simulator'); // simulator, challenge
  
  // Simulator Parameters
  const [x0, setX0] = useState<number>(0); // 0-100m
  const [v, setV] = useState<number>(5); // -20 to 20 m/s
  const [targetPos, setTargetPos] = useState<number>(80); // 0-100m
  
  // Animation States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simTime, setSimTime] = useState<number>(0);
  const [currentX, setCurrentX] = useState<number>(0);
  const [reachedTarget, setReachedTarget] = useState<boolean>(false);
  const sound = useOvaSound();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Challenge States
  const [challengeData, setChallengeData] = useState<ChallengeData>({
    challenge: 'Un móvil parte de 10 m y llega a 90 m en 8 s. Calcula su velocidad constante.',
    datos: { x0: 10, x_target: 90, t_target: 8 },
    respuesta_esperada: 10,
    unidad: 'm/s'
  });
  const [activityId, setActivityId] = useState<string | null>(null);

  // Guided solver states
  const [step, setStep] = useState<number>(1); // 1: identify data, 2: choose formula, 3: calculate
  const [inputX0, setInputX0] = useState<string>('');
  const [inputXf, setInputXf] = useState<string>('');
  const [inputT, setInputT] = useState<string>('');
  const [selectedFormula, setSelectedFormula] = useState<string>('');
  const [calculatedRes, setCalculatedRes] = useState<string>('');
  const [challengeFeedback, setChallengeFeedback] = useState<string>('');
  const [challengeSuccess, setChallengeSuccess] = useState<boolean>(false);

  // Active Time Tracker
  useEffect(() => {
    const interval = setInterval(() => {
      updateModuleAnalytics(3, 10);
    }, 10000);
    return () => {
      clearInterval(interval);
      updateModuleAnalytics(3, 3);
    };
  }, []);

  // Fetch Activity and Challenge Data
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await fetch(`${apiBase}/activities/module/3`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const acts = await res.json();
          const simAct = acts.find((a: any) => a.tipo === 'simulacion');
          if (simAct) {
            setActivityId(simAct.id);
            setChallengeData(JSON.parse(simAct.contenido));
          }
        }
      } catch (err) {
        console.error("Error fetching Level 3 challenge:", err);
      }
    };
    fetchChallenge();
  }, [token]);

  // Update simulator position based on equations
  useEffect(() => {
    setCurrentX(x0);
  }, [x0]);

  // Physics animation loop
  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        setSimTime(prev => {
          const nextTime = prev + 0.03;
          // Equation: x = x0 + vt
          const nextX = x0 + v * nextTime;
          setCurrentX(nextX);
          
          // Check if crossed target
          const crossedForward = (v > 0 && nextX >= targetPos && x0 < targetPos);
          const crossedBackward = (v < 0 && nextX <= targetPos && x0 > targetPos);
          const hitTarget = Math.abs(nextX - targetPos) < 1.0;
          
          if (crossedForward || crossedBackward || hitTarget) {
            setReachedTarget(true);
          }

          // Boundary checks
          if (nextX >= 100 || nextX <= 0 || nextTime >= 20) {
            setIsPlaying(false);
            return prev;
          }
          return nextTime;
        });
        animationRef.current = requestAnimationFrame(loop);
      };
      animationRef.current = requestAnimationFrame(loop);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, x0, v, targetPos]);

  // Render Canvas Track and Object
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Space Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines for reference
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    // Road / track
    const roadY = 110;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(40, roadY);
    ctx.lineTo(canvas.width - 40, roadY);
    ctx.stroke();

    // Scale ticks
    ctx.fillStyle = '#475569';
    ctx.font = '10px Inter';
    const scaleFactor = (canvas.width - 80) / 100;
    
    for (let i = 0; i <= 10; i++) {
      const tx = 40 + i * 10 * scaleFactor;
      ctx.fillRect(tx, roadY, 2, 8);
      ctx.fillText(`${i * 10}m`, tx - 10, roadY + 20);
    }

    // Draw Target Flag/Marker
    const targetXPixel = 40 + targetPos * scaleFactor;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = reachedTarget ? 15 : 4;
    ctx.beginPath();
    ctx.moveTo(targetXPixel, roadY - 45);
    ctx.lineTo(targetXPixel, roadY);
    ctx.stroke();
    // Flag banner
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(targetXPixel, roadY - 45);
    ctx.lineTo(targetXPixel + 18, roadY - 37);
    ctx.lineTo(targetXPixel, roadY - 29);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Mobile Object (Futuristic hover vehicle)
    const objXPixel = 40 + Math.max(0, Math.min(100, currentX)) * scaleFactor;
    
    ctx.fillStyle = '#8b5cf6';
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = isPlaying ? 12 : 5;
    
    // Core body
    ctx.beginPath();
    ctx.roundRect(objXPixel - 18, roadY - 26, 36, 16, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Thruster fire if playing
    if (isPlaying) {
      ctx.fillStyle = v > 0 ? '#ef4444' : '#06b6d4';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      if (v > 0) {
        ctx.moveTo(objXPixel - 18, roadY - 22);
        ctx.lineTo(objXPixel - 26, roadY - 18);
        ctx.lineTo(objXPixel - 18, roadY - 14);
      } else {
        ctx.moveTo(objXPixel + 18, roadY - 22);
        ctx.lineTo(objXPixel + 26, roadY - 18);
        ctx.lineTo(objXPixel + 18, roadY - 14);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // HUD Text overlay directly in canvas (minimalist)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Outfit';
    ctx.fillText(`Posición x: ${currentX.toFixed(1)} m`, 20, 24);
    ctx.fillText(`Tiempo t: ${simTime.toFixed(2)} s`, 20, 42);
    ctx.fillText(`Velocidad v: ${v} m/s`, 20, 60);

  }, [currentX, simTime, targetPos, reachedTarget, isPlaying, v]);

  const handleStart = () => {
    sound.play(700);
    setReachedTarget(false);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSimTime(0);
    setReachedTarget(false);
    setCurrentX(x0);
  };

  // Guided solver checks
  const handleNextStep = () => {
    if (step === 1) {
      // Check data identification
      const x0_num = parseFloat(inputX0);
      const xf_num = parseFloat(inputXf);
      const t_num = parseFloat(inputT);
      
      if (x0_num === challengeData?.datos.x0 && 
          xf_num === challengeData?.datos.x_target && 
          t_num === challengeData?.datos.t_target) {
        setChallengeFeedback('');
        setStep(2);
      } else {
        setChallengeFeedback('Los valores de los datos no coinciden con el enunciado del reto. Revísalos de nuevo.');
      }
    } else if (step === 2) {
      if (selectedFormula === 'v = (xf - x0) / t') {
        setChallengeFeedback('');
        setStep(3);
      } else {
        setChallengeFeedback('Esta fórmula no es la correcta para calcular la velocidad partiendo de la posición y el tiempo.');
      }
    }
  };

  const verifySolution = async () => {
    const answer = parseFloat(calculatedRes);
    if (answer === challengeData?.respuesta_esperada) {
      setChallengeFeedback('¡Excelente! Tu cálculo es correcto. La velocidad requerida es de 10 m/s.');
      setChallengeSuccess(true);

      // Submit activity to DB
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
              respuestas: { x0: inputX0, xf: inputXf, t: inputT, formula: selectedFormula, resultado: calculatedRes },
              completada: true
            })
          });
        } catch (e) {
          console.error("Error submitting Level 3 activity:", e);
        }
      }
    } else {
      setChallengeFeedback('El resultado calculado es incorrecto. Vuelve a realizar la resta y la división.');
    }
  };

  const resetChallenge = () => {
    setStep(1);
    setInputX0('');
    setInputXf('');
    setInputT('');
    setSelectedFormula('');
    setCalculatedRes('');
    setChallengeFeedback('');
    setChallengeSuccess(false);
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #f59e0b' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Módulo 3: APLICAR</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Aplica las ecuaciones algebraicas del MRU para resolver problemas cuantitativos. Utiliza el simulador de laboratorio virtual para verificar tus cálculos empíricos de forma interactiva.
        </p>
      </div>
      <OvaTools title="Nivel 3 - Aplicar" description="Laboratorio virtual para verificar cálculos de movimiento rectilíneo uniforme." includeEvaluation />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', paddingBottom: '2px' }} className="animate-fade-in">
        <button 
          className="btn" 
          onClick={() => setActiveTab('simulator')} 
          style={{
            background: activeTab === 'simulator' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'simulator' ? '#f59e0b' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'simulator' ? '2px solid #f59e0b' : 'none'
          }}
        >
          <Play size={16} /> Laboratorio de Simulación
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('challenge')} 
          style={{
            background: activeTab === 'challenge' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'challenge' ? '#f59e0b' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'challenge' ? '2px solid #f59e0b' : 'none'
          }}
        >
          <HelpCircle size={16} /> Actividad: Resolviendo el Reto
        </button>
      </div>

      {/* SIMULATOR TAB */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }} className="animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Controles del Simulador Virtual</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
              Configura las condiciones iniciales del móvil. Ajusta la posición de partida, la velocidad de crucero constante y la ubicación del sensor de llegada (banderín).
            </p>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Posición Inicial (x₀)</label>
                  <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{x0} m</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="80" 
                  value={x0} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setX0(val);
                    if (val >= targetPos) setTargetPos(val + 10);
                  }}
                  disabled={isPlaying}
                  style={{ width: '100%', accentColor: '#8b5cf6' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Velocidad (v)</label>
                  <span style={{ color: '#06b6d4', fontWeight: 600 }}>{v} m/s</span>
                </div>
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  value={v} 
                  onChange={(e) => setV(parseInt(e.target.value))}
                  disabled={isPlaying}
                  style={{ width: '100%', accentColor: '#06b6d4' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Posición del Objetivo (Banderín)</label>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{targetPos} m</span>
                </div>
                <input 
                  type="range" 
                  min={x0 + 1} 
                  max="100" 
                  value={targetPos} 
                  onChange={(e) => setTargetPos(parseInt(e.target.value))}
                  disabled={isPlaying}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleStart} disabled={isPlaying}>
                Lanzar Móvil
              </button>
              <button className="btn btn-outline" onClick={handleReset}>
                <RotateCcw size={16} /> Reiniciar
              </button>
              <SoundToggle enabled={sound.enabled} onToggle={() => sound.setEnabled(!sound.enabled)} />
            </div>

            {reachedTarget && (
              <div className="alert-box alert-success animate-fade-in" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={20} />
                <span><strong>¡Objetivo Alcanzado!</strong> El móvil cruzó la bandera a los {simTime.toFixed(2)} segundos.</span>
              </div>
            )}
          </div>

          <div>
            <canvas 
              ref={canvasRef} 
              width={480} 
              height={200} 
              style={{
                width: '100%',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--panel-border)',
                boxShadow: 'var(--shadow-md)'
              }}
            />
            
            <div className="glass-panel" style={{ marginTop: '24px', background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Ecuación del Movimiento:</h3>
              <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#5756B3', background: '#F0F2FC', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                x(t) = {x0} + ({v}) · t
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                Ajusta los valores del panel izquierdo y observa cómo se modifica la ecuación horaria de posición en tiempo real.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CHALLENGE TAB */}
      {activeTab === 'challenge' && (
        <div style={{ maxWidth: '750px', margin: '0 auto' }} className="animate-fade-in">
          
          <div className="glass-panel" style={{ marginBottom: '24px', background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={20} /> Desafío del Módulo:
            </h3>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {challengeData.challenge}
            </p>
          </div>

          {challengeFeedback && (
            <div className={`alert-box ${challengeSuccess ? 'alert-success' : 'alert-danger'} animate-fade-in`}>
              {challengeFeedback}
            </div>
          )}

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '24px' }}>
              <span style={{ fontWeight: 600, color: step >= 1 ? '#f59e0b' : 'var(--text-muted)' }}>Paso 1: Datos</span>
              <span style={{ fontWeight: 600, color: step >= 2 ? '#f59e0b' : 'var(--text-muted)' }}>Paso 2: Ecuación</span>
              <span style={{ fontWeight: 600, color: step >= 3 ? '#f59e0b' : 'var(--text-muted)' }}>Paso 3: Cálculo</span>
            </div>

            {/* STEP 1: Identify data */}
            {step === 1 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Extrae los valores del enunciado:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">x₀ (Posición Inicial en m)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Ej. 10" 
                      value={inputX0}
                      onChange={(e) => setInputX0(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">x_f (Posición Destino en m)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Ej. 90" 
                      value={inputXf}
                      onChange={(e) => setInputXf(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">t (Tiempo de viaje en s)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Ej. 8" 
                      value={inputT}
                      onChange={(e) => setInputT(e.target.value)}
                    />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleNextStep} style={{ alignSelf: 'flex-end' }}>
                  Siguiente Paso
                </button>
              </div>
            )}

            {/* STEP 2: Choose equation */}
            {step === 2 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Selecciona la fórmula de velocidad correspondiente:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    "v = d * t",
                    "v = (xf - x0) / t",
                    "v = t / (xf - x0)",
                    "v = x0 + xf * t"
                  ].map((formula) => (
                    <button
                      key={formula}
                      onClick={() => setSelectedFormula(formula)}
                      className="btn btn-outline"
                      style={{
                        justifyContent: 'flex-start',
                        background: selectedFormula === formula ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        borderColor: selectedFormula === formula ? '#f59e0b' : 'var(--panel-border)'
                      }}
                    >
                      <code>{formula}</code>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                  <button className="btn btn-outline" onClick={() => setStep(1)}>Atrás</button>
                  <button className="btn btn-primary" onClick={handleNextStep}>Siguiente Paso</button>
                </div>
              </div>
            )}

            {/* STEP 3: Calculate numerical answer */}
            {step === 3 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Realiza los cálculos y escribe el resultado final:</h4>
                
                <div className="form-group">
                  <label className="form-label">Velocidad final en m/s (solo número)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Ej. 10" 
                    value={calculatedRes}
                    onChange={(e) => setCalculatedRes(e.target.value)}
                    disabled={challengeSuccess}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                  <button className="btn btn-outline" onClick={() => setStep(2)} disabled={challengeSuccess}>Atrás</button>
                  {!challengeSuccess ? (
                    <button className="btn btn-primary" onClick={verifySolution}>
                      Verificar Respuesta
                    </button>
                  ) : (
                    <button className="btn btn-outline" onClick={resetChallenge}>
                      Resolver Nuevamente
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {challengeSuccess && (
            <div className="alert-box alert-info animate-fade-in" style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', gap: '6px', fontWeight: '600', marginBottom: '6px' }}>
                <Eye size={16} /> Demostración en el Simulador:
              </div>
              Ve a la pestaña <strong>Laboratorio de Simulación</strong> y ajusta:
              <ul style={{ paddingLeft: '18px', marginTop: '4px' }}>
                <li>Posición Inicial (x₀) = 10m</li>
                <li>Velocidad (v) = 10 m/s</li>
                <li>Posición del Objetivo = 90m</li>
              </ul>
              Presiona "Lanzar Móvil" y verás cómo el vehículo llega de forma exacta al banderín en exactamente 8 segundos, confirmando tu solución matemática en la práctica.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
