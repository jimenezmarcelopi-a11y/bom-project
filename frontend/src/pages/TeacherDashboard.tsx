import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, CheckSquare, BarChart, User, Clock, Award, Star, RefreshCw, Send } from 'lucide-react';

interface StudentReportItem {
  id: number;
  nombre: string;
  correo: string;
  modulos: {
    [modName: string]: {
      progreso: number;
      tiempo: number;
      completadas: number;
    }
  };
  tiempo_total_segundos: number;
  actividades_totales_completadas: number;
  evaluaciones: Array<{
    evaluacion_id: string;
    actividad_titulo: string;
    puntuacion: number;
    completada: boolean;
    evidencia: string;
    comentario_docente: string | null;
    fecha: string;
  }>;
}

interface PendingGradeItem {
  evaluacion_id: string;
  estudiante_nombre: string;
  actividad_titulo: string;
  tipo: string;
  respuestas: any;
  evidencia: string;
  puntuacion: number;
  fecha: string;
}

interface SystemStats {
  usuarios_conteo: {
    admin: number;
    docente: number;
    experto: number;
    estudiante: number;
  };
  total_evaluaciones: number;
  total_evaluaciones_completadas: number;
  promedio_calificaciones: number;
}

export const TeacherDashboard: React.FC = () => {
  const { token, apiBase } = useAuth();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<string>('students'); // students, grading, stats
  
  // Data
  const [studentsList, setStudentsList] = useState<StudentReportItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentReportItem | null>(null);
  const [pendingList, setPendingList] = useState<PendingGradeItem[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  
  // Loading & Feedback
  const [loading, setLoading] = useState<boolean>(true);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // Grading form state
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeComment, setGradeComment] = useState<string>('');
  const [activeGradingId, setActiveGradingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Students
      const stRes = await fetch(`${apiBase}/admin/students-report`, { headers });
      if (stRes.ok) setStudentsList(await stRes.json());

      // Pending grades
      const pendRes = await fetch(`${apiBase}/admin/pending-grades`, { headers });
      if (pendRes.ok) setPendingList(await pendRes.json());

      // Stats
      const statsRes = await fetch(`${apiBase}/admin/system-stats`, { headers });
      if (statsRes.ok) setStats(await statsRes.json());
      
    } catch (e) {
      console.error("Error loading teacher panel:", e);
    } finally {
      setLoading(false);
    }
  };

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGradingId || !gradeComment.trim()) {
      setGradingFeedback("Por favor completa la calificación y agrega un comentario de retroalimentación.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/activities/grade/${activeGradingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          puntuacion: gradeScore,
          comentario_docente: gradeComment
        })
      });

      if (res.ok) {
        setGradingFeedback("Calificación registrada con éxito.");
        setActiveGradingId(null);
        setGradeComment('');
        
        // Refresh
        fetchData();
      } else {
        setGradingFeedback("Error al registrar la calificación.");
      }
    } catch (err) {
      setGradingFeedback("Error de conexión con el servidor.");
    }
  };

  const formatSeconds = (totalSecs: number) => {
    if (!totalSecs) return "0s";
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      
      {/* Banner */}
      <div className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '5px solid #10b981' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Panel del Docente</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitorea el avance de tu aula escolar en la Taxonomía de Bloom de MRU, califica los portafolios y respuestas abiertas de tus alumnos y analiza las estadísticas generales del sistema.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', paddingBottom: '2px' }} className="animate-fade-in">
        <button 
          className="btn" 
          onClick={() => {
            setActiveTab('students');
            setSelectedStudent(null);
          }} 
          style={{
            background: activeTab === 'students' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'students' ? '#10b981' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'students' ? '2px solid #10b981' : 'none'
          }}
        >
          <Users size={16} /> Lista de Estudiantes ({studentsList.length})
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('grading')} 
          style={{
            background: activeTab === 'grading' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'grading' ? '#10b981' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'grading' ? '2px solid #10b981' : 'none'
          }}
        >
          <CheckSquare size={16} /> Evaluar Actividades ({pendingList.length})
        </button>
        <button 
          className="btn" 
          onClick={() => setActiveTab('stats')} 
          style={{
            background: activeTab === 'stats' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'stats' ? '#10b981' : 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '10px 18px',
            borderBottom: activeTab === 'stats' ? '2px solid #10b981' : 'none'
          }}
        >
          <BarChart size={16} /> Métricas de Aula
        </button>
        
        <button className="btn btn-outline" onClick={fetchData} style={{ marginLeft: 'auto', padding: '6px 12px', height: '36px' }}>
          <RefreshCw size={14} /> Refrescar
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Cargando datos del panel...</p>
      ) : (
        <div className="animate-fade-in">
          
          {/* TAB 1: STUDENTS LIST */}
          {activeTab === 'students' && !selectedStudent && (
            <div className="glass-panel" style={{ overflowX: 'auto', padding: '0px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--panel-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Nombre</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Correo</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tiempo Total</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Actividades Logradas</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((st) => (
                    <tr key={st.id} style={{ borderBottom: '1px solid var(--panel-border)', hover: { background: 'rgba(255,255,255,0.01)' } }}>
                      <td style={{ padding: '16px 20px', fontWeight: 600 }}>{st.nombre}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{st.correo}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} /> {formatSeconds(st.tiempo_total_segundos)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>{st.actividades_totales_completadas} completadas</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setSelectedStudent(st)}>
                          Revisar Progreso
                        </button>
                      </td>
                    </tr>
                  ))}
                  {studentsList.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay estudiantes registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* STUDENT DETAIL SUB-VIEW */}
          {activeTab === 'students' && selectedStudent && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }} className="animate-fade-in">
              {/* Left sidebar: general progress */}
              <div className="glass-panel" style={{ height: 'fit-content' }}>
                <button className="btn btn-outline" style={{ width: '100%', marginBottom: '20px' }} onClick={() => setSelectedStudent(null)}>
                  Atrás a la lista
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--panel-border)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justify: 'center', color: '#10b981' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>{selectedStudent.nombre}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedStudent.correo}</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Ruta de Taxonomía</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {["Recordar", "Comprender", "Aplicar", "Analizar", "Evaluar", "Crear"].map((modName, idx) => {
                    const info = selectedStudent.modulos[modName] || { progreso: 0, tiempo: 0 };
                    return (
                      <div key={idx} style={{ fontSize: '0.88rem' }}>
                        <div style={{ display: 'flex', justify: 'space-between', marginBottom: '4px' }}>
                          <span>Nivel {idx + 1}: {modName}</span>
                          <span style={{ fontWeight: 600 }}>{Math.round(info.progreso)}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${info.progreso}%`, background: '#10b981', borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                          <Clock size={10} /> {formatSeconds(info.tiempo)} de estudio
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right panel: activity attempts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.4rem' }}>Evidencias y Evaluaciones Entregadas</h3>
                {selectedStudent.evaluaciones.map((ev) => (
                  <div key={ev.evaluacion_id} className="glass-panel" style={{ background: 'rgba(30, 41, 59, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'white' }}>{ev.actividad_titulo}</h4>
                      <div>
                        {ev.comentario_docente ? (
                          <span style={{ color: '#10b981', fontWeight: 700 }}>Puntuación: {ev.puntuacion} / 100</span>
                        ) : (
                          <span style={{ color: 'var(--warning)', fontStyle: 'italic', fontSize: '0.85rem' }}>Falta Calificar</span>
                        )}
                      </div>
                    </div>
                    {ev.evidencia && <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}><strong>Registro de Evidencia:</strong> {ev.evidencia}</p>}
                    
                    {ev.comentario_docente && (
                      <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(16,185,129,0.08)', borderLeft: '3px solid #10b981', borderRadius: '4px', fontSize: '0.85rem' }}>
                        <strong>Comentario Calificación:</strong> "{ev.comentario_docente}"
                      </div>
                    )}
                  </div>
                ))}
                {selectedStudent.evaluaciones.length === 0 && (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    El alumno aún no ha completado actividades evaluables en el sistema.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GRADING PENDING QUEUE */}
          {activeTab === 'grading' && (
            <div style={{ display: 'grid', gridTemplateColumns: pendingList.length > 0 && activeGradingId ? '1fr 1fr' : '1fr', gap: '32px' }} className="animate-fade-in">
              {/* Left Column: pending list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Cola de Calificaciones Pendientes</h2>
                
                {gradingFeedback && (
                  <div className="alert-box alert-info animate-fade-in">
                    {gradingFeedback}
                  </div>
                )}

                {pendingList.map((item) => (
                  <div 
                    key={item.evaluacion_id} 
                    className="glass-panel" 
                    style={{ 
                      cursor: 'pointer',
                      background: activeGradingId === item.evaluacion_id ? 'rgba(16,185,129,0.06)' : 'rgba(30, 41, 59, 0.25)',
                      borderColor: activeGradingId === item.evaluacion_id ? '#10b981' : 'var(--panel-border)',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setActiveGradingId(item.evaluacion_id);
                      setGradingFeedback('');
                    }}
                  >
                    <div style={{ display: 'flex', justify: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                        {item.tipo === 'debate' ? 'Evaluación (Caso)' : 'Creación (Portfolio)'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(item.fecha).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '4px' }}>{item.actividad_titulo}</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      Alumno: <strong>{item.estudiante_nombre}</strong>
                    </p>
                  </div>
                ))}

                {pendingList.length === 0 && (
                  <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                    <Award size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>¡Felicidades! No tienes entregas pendientes por calificar en el aula.</p>
                  </div>
                )}
              </div>

              {/* Right Column: active grading panel */}
              {activeGradingId && (
                <div className="glass-panel animate-fade-in" style={{ height: 'fit-content' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Formulario de Calificación</h3>
                  
                  {(() => {
                    const item = pendingList.find(p => p.evaluacion_id === activeGradingId);
                    if (!item) return null;
                    const answers = item.respuestas;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <p style={{ margin: '4px 0' }}><strong>Entregado por:</strong> {item.estudiante_nombre}</p>
                          <p style={{ margin: '4px 0' }}><strong>Actividad:</strong> {item.actividad_titulo}</p>
                        </div>

                        {/* Rendering different detail depending on activity type */}
                        {item.tipo === 'debate' ? (
                          <div style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                            <p style={{ margin: '4px 0' }}><strong>Velocidad Promedio Calculada:</strong> <code>{answers.velocidad_promedio_calculada} km/h</code></p>
                            <p style={{ margin: '4px 0' }}><strong>Veredicto:</strong> <code>{answers.veredicto_seleccionado === 'guilty' ? 'Culpable' : 'Inocente'}</code></p>
                            <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '4px' }}>
                              <strong>Justificación Argumentada:</strong>
                              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '4px' }}>"{answers.argumentacion_redactada}"</p>
                            </div>
                          </div>
                        ) : (
                          // Portfolio creation type
                          <div style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                            <p style={{ margin: '4px 0' }}><strong>Tipo de Creación:</strong> <code>{answers.tipo_creacion === 'problema_mru' ? 'Problema MRU Original' : 'Metodología Experimental'}</code></p>
                            <p style={{ margin: '4px 0' }}><strong>Título:</strong> <code>{answers.titulo}</code></p>
                            
                            {answers.tipo_creacion === 'problema_mru' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                                <p><strong>Contexto:</strong> {answers.contexto}</p>
                                <p><strong>Enunciado:</strong> "{answers.enunciado}"</p>
                                <p><strong>Datos:</strong> <code>{answers.datos_fisicos}</code></p>
                                <p><strong>Resolución:</strong> {answers.solucion_paso_a_paso}</p>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                                <p><strong>Materiales:</strong> {answers.materiales}</p>
                                <p><strong>Procedimiento:</strong> "{answers.procedimiento}"</p>
                                <p><strong>Control Errores:</strong> {answers.control_errores}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <form onSubmit={submitGrade} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
                          <div className="form-group">
                            <div style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: '4px' }}>
                              <label className="form-label">Calificación (0 - 100)</label>
                              <span style={{ color: '#10b981', fontWeight: 700 }}>{gradeScore} / 100</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" 
                              value={gradeScore} 
                              onChange={(e) => setGradeScore(parseInt(e.target.value))}
                              style={{ width: '100%', accentColor: '#10b981' }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Comentarios / Retroalimentación Pedagógica</label>
                            <textarea
                              className="form-input"
                              rows={4}
                              placeholder="Ej: Excelente despeje de variables. Recuerda explicitar la hipótesis en el diseño experimental..."
                              value={gradeComment}
                              onChange={(e) => setGradeComment(e.target.value)}
                              style={{ resize: 'vertical', fontSize: '0.85rem' }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setActiveGradingId(null)} style={{ flex: 1 }}>
                              Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', boxShadow: 'none' }}>
                              <Send size={14} /> Registrar Calificación
                            </button>
                          </div>
                        </form>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLASSROOM METRICS */}
          {activeTab === 'stats' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
              {/* Metrics cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#10b981' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Alumnos Totales</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.usuarios_conteo.estudiante}</div>
                  </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', color: '#38bdf8' }}>
                    <Star size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Validadores Expertos</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.usuarios_conteo.experto}</div>
                  </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', color: '#8b5cf6' }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Entregas</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total_evaluaciones}</div>
                  </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', color: '#f59e0b' }}>
                    <Award size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Promedio Académico</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.promedio_calificaciones} %</div>
                  </div>
                </div>
              </div>

              {/* Research utility note */}
              <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.03)', borderColor: 'rgba(16,185,129,0.15)' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#10b981', marginBottom: '8px' }}>Métricas para la Investigación Científica</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Este Objeto Virtual de Aprendizaje (OVA) está diseñado para recolectar analíticas de aprendizaje con el fin de medir la eficacia de la Taxonomía de Bloom en la asimilación del MRU. Los reportes anteriores y el tiempo total de estudio sirven como indicadores empíricos para validar las hipótesis planteadas en la tesis de maestría sobre el rendimiento estudiantil antes y después de usar el OVA.
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
