import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, UserCheck, ShieldAlert, ArrowRight, User } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  
  // Form Fields
  const [nombre, setNombre] = useState<string>('');
  const [correo, setCorreo] = useState<string>('');
  const [contrasena, setContrasena] = useState<string>('');
  const [rol, setRol] = useState<string>('estudiante');
  
  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isRegistering) {
        if (!nombre || !correo || !contrasena) {
          throw new Error("Por favor completa todos los campos.");
        }
        await register(nombre, correo, contrasena, rol);
      } else {
        if (!correo || !contrasena) {
          throw new Error("Por favor ingresa tu correo y contraseña.");
        }
        await login(correo, contrasena);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 70px)',
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* Visual background accents */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(139, 92, 246, 0.15)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '20%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(6, 182, 212, 0.15)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        zIndex: 1,
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '50%',
            marginBottom: '16px',
            color: '#8b5cf6'
          }}>
            <Sparkles size={32} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>
            <span className="gradient-text">BOM</span> Platform
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {isRegistering 
              ? "Crea tu cuenta de aprendizaje para el OVA de MRU" 
              : "Objeto Virtual de Aprendizaje de Movimiento Rectilíneo Uniforme"}
          </p>
        </div>

        {error && (
          <div className="alert-box alert-danger animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Mateo Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              className="form-input"
              placeholder="estudiante@bom.edu"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Rol de Acceso</label>
              <select
                className="form-select"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
              >
                <option value="estudiante">Estudiante (Ver OVA y realizar actividades)</option>
                <option value="docente">Docente (Monitoreo de grupo y calificaciones)</option>
                <option value="experto">Experto Validador (Evaluar OVA con instrumento científico)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? "Procesando..." : isRegistering ? "Registrarse y Entrar" : "Iniciar Sesión"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--panel-border)',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegistering ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta aún?"}{" "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegistering ? "Inicia Sesión" : "Regístrate aquí"}
          </button>
        </div>

        {/* Demo Credentials Alert helper */}
        {!isRegistering && (
          <div className="alert-box alert-info" style={{ marginTop: '20px', fontSize: '0.82rem', lineHeight: '1.4' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserCheck size={14} /> Cuentas de Demostración Sembradas:
            </div>
            <ul style={{ paddingLeft: '14px' }}>
              <li><strong>Estudiante:</strong> <code>estudiante@bom.edu</code> / <code>estudiante123</code></li>
              <li><strong>Docente:</strong> <code>docente@bom.edu</code> / <code>docente123</code></li>
              <li><strong>Experto:</strong> <code>experto@bom.edu</code> / <code>experto123</code></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
