import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ExpertDashboard } from './pages/ExpertDashboard';

// Module views
import { Level1Recordar } from './pages/modules/Level1Recordar';
import { Level2Comprender } from './pages/modules/Level2Comprender';
import { Level3Aplicar } from './pages/modules/Level3Aplicar';
import { Level4Analizar } from './pages/modules/Level4Analizar';
import { Level5Evaluar } from './pages/modules/Level5Evaluar';
import { Level6Crear } from './pages/modules/Level6Crear';

import { LogOut, BookOpen, GraduationCap, BarChart2, ShieldAlert, Award, User } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Navigate back to home if user changes or logs out
  useEffect(() => {
    if (!token) {
      setCurrentView('login');
    } else {
      if (user?.rol === 'docente') {
        setCurrentView('teacher-panel');
      } else if (user?.rol === 'experto') {
        setCurrentView('expert-panel');
      } else {
        setCurrentView('dashboard');
      }
    }
  }, [token, user]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    if (!token) {
      return <Login onSuccess={() => {}} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onSelectModule={(num) => handleNavigate(`level${num}`)} />;
      case 'teacher-panel':
        return <TeacherDashboard />;
      case 'expert-panel':
        return <ExpertDashboard />;
      case 'level1':
        return <Level1Recordar onBack={() => handleNavigate('dashboard')} />;
      case 'level2':
        return <Level2Comprender onBack={() => handleNavigate('dashboard')} />;
      case 'level3':
        return <Level3Aplicar onBack={() => handleNavigate('dashboard')} />;
      case 'level4':
        return <Level4Analizar onBack={() => handleNavigate('dashboard')} />;
      case 'level5':
        return <Level5Evaluar onBack={() => handleNavigate('dashboard')} />;
      case 'level6':
        return <Level6Crear onBack={() => handleNavigate('dashboard')} />;
      default:
        return <Dashboard onSelectModule={(num) => handleNavigate(`level${num}`)} />;
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin': return '#f43f5e'; // Rose
      case 'docente': return '#10b981'; // Emerald
      case 'experto': return '#38bdf8'; // Sky
      default: return '#a78bfa'; // Purple (Estudiante)
    }
  };

  const getRoleDisplayName = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'docente': return 'Docente';
      case 'experto': return 'Experto Validador';
      default: return 'Estudiante';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {token && user && (
        <nav className="navbar">
          <div className="nav-brand" onClick={() => {
            if (user.rol === 'docente') handleNavigate('teacher-panel');
            else if (user.rol === 'experto') handleNavigate('expert-panel');
            else handleNavigate('dashboard');
          }}>
            <BookOpen size={24} style={{ color: 'var(--primary)' }} />
            <span>BOM <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MRU-OVA</span></span>
          </div>

          <div className="nav-links">
            {user.rol === 'estudiante' && (
              <span className="nav-link active" onClick={() => handleNavigate('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GraduationCap size={18} /> Ruta de Aprendizaje
              </span>
            )}
            {user.rol === 'docente' && (
              <span className="nav-link active" onClick={() => handleNavigate('teacher-panel')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 size={18} /> Panel Docente
              </span>
            )}
            {user.rol === 'experto' && (
              <span className="nav-link active" onClick={() => handleNavigate('expert-panel')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} /> Panel Validador
              </span>
            )}
            {user.rol === 'admin' && (
              <>
                <span className="nav-link" onClick={() => handleNavigate('dashboard')}>Estudiante</span>
                <span className="nav-link" onClick={() => handleNavigate('teacher-panel')}>Docente</span>
                <span className="nav-link" onClick={() => handleNavigate('expert-panel')}>Experto</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="user-tag" style={{
              color: getRoleBadgeColor(user.rol),
              background: `${getRoleBadgeColor(user.rol)}15`,
              borderColor: `${getRoleBadgeColor(user.rol)}30`
            }}>
              <User size={14} />
              {user.nombre} ({getRoleDisplayName(user.rol)})
            </span>
            <button className="btn btn-outline" onClick={logout} style={{ padding: '6px 12px', fontSize: '0.85rem', height: '36px' }}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </nav>
      )}

      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      {token && (
        <footer style={{
          textAlign: 'center',
          padding: '20px',
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          borderTop: '1px solid var(--panel-border)',
          background: 'rgba(5, 8, 14, 0.5)'
        }}>
          BOM (Bloom-Oriented MRU) &copy; 2026. Proyecto de Investigación y Objeto Virtual de Aprendizaje (OVA).
        </footer>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
