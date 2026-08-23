import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Book, History, Brain, HelpCircle, Check, RefreshCw } from 'lucide-react';
import { OvaTools } from '../../components/OvaTools';

interface Level1Props {
  onBack: () => void;
}

interface GlossaryItem {
  term: string;
  definition: string;
  formula: string | null;
  unit: string | null;
}

interface TimelineItem {
  era: string;
  title: string;
  description: string;
  icon: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_idx: number;
}

export const Level1Recordar: React.FC<Level1Props> = ({ onBack }) => {
  const { token, updateModuleAnalytics, apiBase } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('study'); // study, cards, matching, quiz
  
  // Data States
  const [glossary, setGlossary] = useState<GlossaryItem[]>([
    { term: 'Movimiento Rectilíneo Uniforme (MRU)', definition: 'Movimiento en línea recta con velocidad constante y aceleración nula.', formula: null, unit: null }
  ]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { era: 'Concepto fundamental', title: 'Movimiento uniforme', description: 'En el MRU se recorren distancias iguales en intervalos de tiempo iguales.', icon: 'book' }
  ]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [activityIds, setActivityIds] = useState<{ [key: string]: string }>({});

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Flashcards flipped states
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});

  // Matching game states
  const [selectedVar, setSelectedVar] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [matchingFeedback, setMatchingFeedback] = useState<string>('');
  const [matchingCompleted, setMatchingCompleted] = useState<boolean>(false);

  // Quiz states
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFeedback, setQuizFeedback] = useState<string>('');

  // Active Time Tracker
  useEffect(() => {
    // Send 10s of study time every 10s
    const interval = setInterval(() => {
      updateModuleAnalytics(1, 10);
    }, 10000);

    return () => {
      clearInterval(interval);
      // Send 3 trailing seconds
      updateModuleAnalytics(1, 3);
    };
  }, []);

  // Fetch glossary, timeline and activities
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Glossary
        const glosRes = await fetch(`${apiBase}/modules/1/glossary`, { headers });
        if (glosRes.ok) setGlossary(await glosRes.json());

        // Timeline
        const timeRes = await fetch(`${apiBase}/modules/1/timeline`, { headers });
        if (timeRes.ok) setTimeline(await timeRes.json());

        // Activities (to get database IDs)
        const actRes = await fetch(`${apiBase}/activities/module/1`, { headers });
        if (actRes.ok) {
          const acts = await actRes.json();
          const ids: { [key: string]: string } = {};
          acts.forEach((a: any) => {
            if (a.tipo === 'cuestionario') ids['quiz'] = a.id;
            if (a.tipo === 'emparejamiento') ids['matching'] = a.id;
          });
          setActivityIds(ids);

          // Find quiz questions from activity content
          const quizAct = acts.find((a: any) => a.tipo === 'cuestionario');
          if (quizAct) {
            const content = JSON.parse(quizAct.contenido);
            setQuizQuestions(content.questions);
          }
        }
      } catch (err) {
        console.error("Error fetching Level 1 data:", err);
      }
    };

    fetchData();
  }, [token]);

  // Flashcard toggle helper
  const toggleCard = (idx: number) => {
    setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Matching game logic
  const handleSelectVar = (term: string) => {
    if (matchingCompleted) return;
    setSelectedVar(term);
    checkMatch(term, selectedUnit);
  };

  const handleSelectUnit = (unit: string) => {
    if (matchingCompleted) return;
    setSelectedUnit(unit);
    checkMatch(selectedVar, unit);
  };

  const checkMatch = async (variable: string | null, unit: string | null) => {
    if (!variable || !unit) return;

    // Correct pairs definitions
    const pairs: { [key: string]: string } = {
      "Distancia (d)": "Metros (m)",
      "Velocidad (v)": "Metros por segundo (m/s)",
      "Tiempo (t)": "Segundos (s)",
      "Aceleración (a)": "Nula o 0 m/s²"
    };

    if (pairs[variable] === unit) {
      setMatchedPairs(prev => [...prev, variable]);
      setMatchingFeedback("¡Correcto!");
      setSelectedVar(null);
      setSelectedUnit(null);

      // Check if all 4 are matched
      if (matchedPairs.length + 1 === 4) {
        setMatchingCompleted(true);
        setMatchingFeedback("¡Felicidades! Has completado el emparejamiento con éxito.");
        
        // Submit matching activity
        if (activityIds['matching']) {
          try {
            await fetch(`${apiBase}/activities/submit`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                actividad_id: activityIds['matching'],
                puntuacion: 100,
                respuestas: { matched: true },
                completada: true
              })
            });
          } catch (e) {
            console.error("Error submitting matching activity:", e);
          }
        }
      }
    } else {
      setMatchingFeedback("Asociación incorrecta. Inténtalo de nuevo.");
      setSelectedVar(null);
      setSelectedUnit(null);
    }
  };

  const resetMatching = () => {
    setMatchedPairs([]);
    setSelectedVar(null);
    setSelectedUnit(null);
    setMatchingFeedback('');
    setMatchingCompleted(false);
  };

  // Quiz submission logic
  const handleSelectAnswer = (qId: number, oIdx: number) => {
    if (quizSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: oIdx }));
  };

  const submitQuiz = async () => {
    if (quizSubmitted) return;
    
    // Validate that all questions are answered
    if (Object.keys(answers).length < quizQuestions.length) {
      setQuizFeedback("Por favor responde todas las preguntas del cuestionario.");
      return;
    }

    let correctCount = 0;
    quizQuestions.forEach(q => {
      if (answers[q.id] === q.correct_idx) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    setQuizFeedback(`Cuestionario calificado. Respuestas correctas: ${correctCount}/${quizQuestions.length}.`);

    // Submit quiz evaluation to backend
    if (activityIds['quiz']) {
      try {
        await fetch(`${apiBase}/activities/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            actividad_id: activityIds['quiz'],
            puntuacion: score,
            respuestas: answers,
            completada: true
          })
        });
      } catch (e) {
        console.error("Error submitting quiz:", e);
      }
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizFeedback('');
  };

  // Filter glossary
  const filteredGlossary = glossary.filter(item => 
    item.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #3b82f6' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Módulo 1: RECORDAR</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Recupera conocimientos, evoca conceptos clave, formulas matemáticas y asocia magnitudes físicas con sus unidades de medida correspondientes en el Movimiento Rectilíneo Uniforme.
        </p>
      </div>
      <OvaTools title="Nivel 1 - Recordar" description="Glosario, historia y actividades fundamentales del MRU." includeEvaluation />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', paddingBottom: '2px' }} className="animate-fade-in">
        <button 
          className="btn" 
          onClick={() => setActiveTab('study')} 
          style={{
            background: activeTab === 'study' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'study' ? '#3b82f6' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'study' ? '2px solid #3b82f6' : 'none'
          }}
        >
          <Book size={16} /> Glosario e Historia
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('cards')} 
          style={{
            background: activeTab === 'cards' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'cards' ? '#3b82f6' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'cards' ? '2px solid #3b82f6' : 'none'
          }}
        >
          <Brain size={16} /> Tarjetas de Memoria
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('matching')} 
          style={{
            background: activeTab === 'matching' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'matching' ? '#3b82f6' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'matching' ? '2px solid #3b82f6' : 'none'
          }}
        >
          <Brain size={16} /> Actividad 1: Asociación
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('quiz')} 
          style={{
            background: activeTab === 'quiz' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'quiz' ? '#3b82f6' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'quiz' ? '2px solid #3b82f6' : 'none'
          }}
        >
          <HelpCircle size={16} /> Actividad 2: Quiz
        </button>
      </div>

      {/* Content panes */}
      
      {/* STUDY TAB */}
      {activeTab === 'study' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }} className="animate-fade-in">
          {/* Glossary column */}
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Book size={20} style={{ color: '#3b82f6' }} /> Glosario Interactivo
            </h2>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar conceptos (ej. velocidad, distancia)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: '20px' }}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
              {filteredGlossary.map((item, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '16px', background: '#FFFFFF' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>{item.term}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '8px' }}>{item.definition}</p>
                  {(item.formula || item.unit) && (
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                      {item.formula && <span><strong>Fórmula:</strong> <code>{item.formula}</code></span>}
                      {item.unit && <span><strong>Unidad SI:</strong> <code>{item.unit}</code></span>}
                    </div>
                  )}
                </div>
              ))}
              {filteredGlossary.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No se encontraron términos coincidentes.</p>
              )}
            </div>
          </div>

          {/* Timeline column */}
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} style={{ color: '#3b82f6' }} /> Desarrollo Histórico del Movimiento
            </h2>
            
            <div style={{ position: 'relative', paddingLeft: '32px', borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
              {timeline.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '32px', position: 'relative' }}>
                  {/* Bullet */}
                  <div style={{
                    position: 'absolute',
                    left: '-43px',
                    top: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#04060a',
                    border: '3px solid #3b82f6',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                  }} />
                  
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>{item.era}</span>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '4px 0 8px 0' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLASHCARDS TAB */}
      {activeTab === 'cards' && (
        <div className="animate-fade-in">
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '0.95rem' }}>
            Haz clic en las tarjetas para voltearlas y revelar la definición y fórmulas de las variables fundamentales.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            maxWidth: '960px',
            margin: '0 auto'
          }}>
            {glossary.map((item, idx) => (
              <div key={idx} className="flip-card-container" onClick={() => toggleCard(idx)}>
                <div className={`flip-card-inner ${flippedCards[idx] ? 'flipped' : ''}`}>
                  <div className="flip-card-front">
                    <Brain size={24} style={{ color: '#3b82f6', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '1.2rem' }}>{item.term}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px' }}>Clic para voltear</span>
                  </div>
                  <div className="flip-card-back">
                    <p style={{ fontSize: '0.82rem', lineHeight: '1.4', marginBottom: '12px' }}>{item.definition}</p>
                    {item.formula && <p style={{ fontSize: '0.82rem', margin: '2px 0' }}><strong>Fórmula:</strong> <code>{item.formula}</code></p>}
                    {item.unit && <p style={{ fontSize: '0.82rem', margin: '2px 0' }}><strong>Unidad SI:</strong> <code>{item.unit}</code></p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MATCHING TAB */}
      {activeTab === 'matching' && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>Emparejamiento de Variables y Unidades</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '0.9rem' }}>
            Asocia cada una de las variables físicas que definen el MRU con su unidad correspondiente en el Sistema Internacional o su comportamiento.
          </p>

          {matchingFeedback && (
            <div className={`alert-box ${matchingFeedback.includes('incorrecta') ? 'alert-danger' : 'alert-success'} animate-fade-in`} style={{ textAlign: 'center' }}>
              {matchingFeedback}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
            {/* Variables Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#3b82f6', borderBottom: '1px solid rgba(59,130,246,0.2)', paddingBottom: '8px' }}>Magnitudes / Variables</h3>
              {["Distancia (d)", "Velocidad (v)", "Tiempo (t)", "Aceleración (a)"].map((v) => {
                const isMatched = matchedPairs.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => handleSelectVar(v)}
                    disabled={isMatched}
                    className="btn btn-outline"
                    style={{
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: isMatched 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : selectedVar === v 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : '#FFFFFF',
                      border: isMatched 
                        ? '1px solid rgba(16, 185, 129, 0.3)' 
                        : selectedVar === v 
                          ? '1px solid #3b82f6' 
                          : '1px solid var(--panel-border)',
                      color: isMatched ? '#16824F' : 'var(--text-primary)',
                      pointerEvents: isMatched ? 'none' : 'auto'
                    }}
                  >
                    <span>{v}</span>
                    {isMatched && <Check size={16} />}
                  </button>
                );
              })}
            </div>

            {/* Units Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#3b82f6', borderBottom: '1px solid rgba(59,130,246,0.2)', paddingBottom: '8px' }}>Unidades de Medida</h3>
              {["Segundos (s)", "Metros (m)", "Nula o 0 m/s²", "Metros por segundo (m/s)"].map((u) => {
                // Determine if this unit corresponds to a matched variable
                const pairs: { [key: string]: string } = {
                  "Distancia (d)": "Metros (m)",
                  "Velocidad (v)": "Metros por segundo (m/s)",
                  "Tiempo (t)": "Segundos (s)",
                  "Aceleración (a)": "Nula o 0 m/s²"
                };
                const isMatched = matchedPairs.some(v => pairs[v] === u);
                
                return (
                  <button
                    key={u}
                    onClick={() => handleSelectUnit(u)}
                    disabled={isMatched}
                    className="btn btn-outline"
                    style={{
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: isMatched 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : selectedUnit === u 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : '#FFFFFF',
                      border: isMatched 
                        ? '1px solid rgba(16, 185, 129, 0.3)' 
                        : selectedUnit === u 
                          ? '1px solid #3b82f6' 
                          : '1px solid var(--panel-border)',
                      color: isMatched ? '#16824F' : 'var(--text-primary)',
                      pointerEvents: isMatched ? 'none' : 'auto'
                    }}
                  >
                    <span>{u}</span>
                    {isMatched && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={resetMatching}>
              <RefreshCw size={14} /> Reiniciar Juego
            </button>
          </div>
        </div>
      )}

      {/* QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
          
          {quizFeedback && (
            <div className={`alert-box ${quizScore >= 60 ? 'alert-success' : 'alert-info'} animate-fade-in`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{quizFeedback}</span>
              {quizSubmitted && <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>Puntaje: {quizScore}%</span>}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            {quizQuestions.map((q, qIdx) => (
              <div key={q.id} className="glass-panel" style={{ padding: '20px', background: '#FFFFFF' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.5' }}>
                  {qIdx + 1}. {q.question}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((option, oIdx) => {
                    const isSelected = answers[q.id] === oIdx;
                    const isCorrect = q.correct_idx === oIdx;
                    
                    let bg = 'rgba(15, 23, 42, 0.5)';
                    let border = '1px solid var(--panel-border)';
                    let color = 'var(--text-primary)';

                    if (quizSubmitted) {
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
                      bg = 'rgba(59, 130, 246, 0.25)';
                      border = '1px solid #3b82f6';
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(q.id, oIdx)}
                        disabled={quizSubmitted}
                        className="btn btn-outline"
                        style={{
                          justifyContent: 'flex-start',
                          padding: '12px 16px',
                          background: bg,
                          border: border,
                          color: color,
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span style={{ fontSize: '0.9rem' }}>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {!quizSubmitted ? (
              <button className="btn btn-primary" onClick={submitQuiz} style={{ padding: '12px 36px' }}>
                Enviar Cuestionario
              </button>
            ) : (
              <button className="btn btn-outline" onClick={resetQuiz}>
                <RefreshCw size={14} /> Intentar de Nuevo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
