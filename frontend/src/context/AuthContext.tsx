import React, { createContext, useState, useEffect, useContext } from 'react';

export interface User {
  nombre: string;
  correo: string;
  rol: string;
}

export interface ModuleProgress {
  tiempo_permanencia: number;
  actividades_completadas: number;
  progreso_porcentaje: number;
}

export interface ProgressState {
  [moduleId: number]: ModuleProgress;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  progress: ProgressState;
  loading: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (nombre: string, correo: string, contrasena: string, rol: string) => Promise<void>;
  logout: () => void;
  fetchProgress: () => Promise<void>;
  updateModuleAnalytics: (moduleId: number, secondsToAdd: number) => Promise<void>;
  apiBase: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({});
  const [loading, setLoading] = useState<boolean>(true);
  
  const apiBase = "http://localhost:8000/api";

  // Load user from localStorage on startup
  useEffect(() => {
    const storedToken = localStorage.getItem('bom_token');
    const storedUser = localStorage.getItem('bom_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Fetch progress whenever user logs in
  useEffect(() => {
    if (token && user && user.rol === 'estudiante') {
      fetchProgress();
    } else {
      setProgress({});
    }
  }, [token, user]);

  const fetchProgress = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/activities/analytics/my-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } catch (err) {
      console.error("Error fetching progress:", err);
    }
  };

  const login = async (correo: string, contrasena: string) => {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ correo, contrasena })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Error al iniciar sesión");
    }

    const data = await res.json();
    const newUser: User = {
      nombre: data.nombre,
      correo: correo,
      rol: data.rol
    };

    setToken(data.access_token);
    setUser(newUser);
    localStorage.setItem('bom_token', data.access_token);
    localStorage.setItem('bom_user', JSON.stringify(newUser));
  };

  const register = async (nombre: string, correo: string, contrasena: string, rol: string) => {
    const res = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, correo, contrasena, rol })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Error en el registro");
    }

    // Auto-login after successful registration
    await login(correo, contrasena);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProgress({});
    localStorage.removeItem('bom_token');
    localStorage.removeItem('bom_user');
  };

  const updateModuleAnalytics = async (moduleId: number, secondsToAdd: number) => {
    if (!token || !user || user.rol !== 'estudiante') return;
    try {
      const res = await fetch(`${apiBase}/activities/analytics/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          modulo_id: moduleId,
          tiempo_adicional: secondsToAdd
        })
      });
      if (res.ok) {
        // Refresh local progress state
        await fetchProgress();
      }
    } catch (err) {
      console.error("Error updating analytics:", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      progress,
      loading,
      login,
      register,
      logout,
      fetchProgress,
      updateModuleAnalytics,
      apiBase
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
