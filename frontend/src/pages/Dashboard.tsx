import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Play, Award, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  onSelectModule: (moduleNum: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectModule }) => {
  const { user, progress } = useAuth();

  const modules = [
    {
      id: 1,
      name: "Recordar",
      level: "Nivel 1",
      description: "Identificar conceptos básicos, unidades y fórmulas fundamentales del MRU.",
      color: "#2387D9",
      background: "#DFF4FD",
      activitiesCount: 2
    },
    {
      id: 2,
      name: "Comprender",
      level: "Nivel 2",
      description: "Interpretar relaciones entre distancia, tiempo y velocidad mediante representaciones gráficas.",
      color: "#2387D9",
      background: "#DFF4FD",
      activitiesCount: 1
    },
    {
      id: 3,
      name: "Aplicar",
      level: "Nivel 3",
      description: "Resolver problemas reales de MRU empleando un simulador interactivo y ecuaciones físicas.",
      color: "#2387D9",
      background: "#DFF4FD",
      activitiesCount: 1
    },
    {
      id: 4,
      name: "Analizar",
      level: "Nivel 4",
      description: "Deconstruir movimientos, depurar errores procedimentales y comparar gráficas de velocidad.",
      color: "#6564C8",
      background: "#BFD4F7",
      activitiesCount: 1
    },
    {
      id: 5,
      name: "Evaluar",
      level: "Nivel 5",
      description: "Emitir juicios sobre casos controversiales de exceso de velocidad basándote en evidencia física.",
      color: "#6564C8",
      background: "#BFD4F7",
      activitiesCount: 1
    },
    {
      id: 6,
      name: "Crear",
      level: "Nivel 6",
      description: "Crear problemas originales y diseñar planes experimentales caseros de MRU.",
      color: "#6564C8",
      background: "#BFD4F7",
      activitiesCount: 1
    }
  ];

  // Formatting helpers
  const formatTime = (seconds: number) => {
    if (!seconds) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Aggregates
  const totalSeconds = Object.values(progress).reduce((acc, curr) => acc + curr.tiempo_permanencia, 0);
  const totalCompleted = Object.values(progress).reduce((acc, curr) => acc + curr.actividades_completadas, 0);
  
  const totalPossibleActivities = modules.reduce((acc, curr) => acc + curr.activitiesCount, 0);
  const overallPercentage = totalPossibleActivities > 0 
    ? Math.round((totalCompleted / totalPossibleActivities) * 100) 
    : 0;

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel animate-fade-in" style={{
        marginBottom: '32px',
        background: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          right: '5%',
          top: '-20%',
          fontSize: '10rem',
          opacity: 0.05,
          fontWeight: 800,
          userSelect: 'none',
          pointerEvents: 'none',
          fontFamily: 'var(--font-title)'
        }}>BOM</div>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          ¡Hola, <span className="gradient-text">{user?.nombre}</span>!
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '750px', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Te damos la bienvenida a BOM (Bloom-Oriented MRU), un Objeto Virtual de Aprendizaje interactivo. Aquí recorrerás seis niveles cognitivos diseñados para consolidar tu dominio sobre el Movimiento Rectilíneo Uniforme.
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }} className="animate-fade-in">
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '12px', color: '#06b6d4' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Tiempo de Estudio</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px' }}>{formatTime(totalSeconds)}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Actividades Logradas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px' }}>{totalCompleted} / {totalPossibleActivities}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', color: '#8b5cf6' }}>
            <Award size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Progreso General</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{overallPercentage}%</div>
              <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${overallPercentage}%`, background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules list */}
      <h2 style={{ fontSize: '1.75rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }} className="animate-fade-in">
        <FileText style={{ color: 'var(--primary)' }} /> Ruta de la Taxonomía de Bloom
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }} className="animate-fade-in">
        {modules.map((mod) => {
          const modProgress = progress[mod.id] || { progreso_porcentaje: 0, tiempo_permanencia: 0, actividades_completadas: 0 };
          const percent = Math.round(modProgress.progreso_porcentaje);
          
          return (
            <div 
              key={mod.id}
              className="glass-panel"
              onClick={() => onSelectModule(mod.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                borderLeft: `5px solid ${mod.color}`,
                background: mod.background,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.4), 0 0 15px ${mod.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    color: mod.color,
                    background: `${mod.color}15`,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${mod.color}30`
                  }}>
                    {mod.level}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {formatTime(modProgress.tiempo_permanencia)}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {mod.name}
                </h3>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
                  {mod.description}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Actividades logradas</span>
                  <span style={{ fontWeight: 600, color: mod.color }}>{percent}%</span>
                </div>
                
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ height: '100%', width: `${percent}%`, background: mod.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ 
                    color: mod.color, 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}>
                    Ingresar Módulo <Play size={14} fill={mod.color} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
