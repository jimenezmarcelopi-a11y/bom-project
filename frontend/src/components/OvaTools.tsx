import React, { useEffect, useRef, useState } from 'react';
import { Download, Volume2, VolumeX, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SECTION_A_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeyRRkG_abtxeTExBZZlt0zERrBoPtKucQxC150pxr7UUV5xQ/viewform?usp=header';

interface OvaToolsProps {
  title: string;
  description?: string;
  includeEvaluation?: boolean;
}

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ enabled, onToggle }) => (
  <button className="btn btn-outline" type="button" onClick={onToggle} aria-pressed={enabled}>
    {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
    {enabled ? 'Sonido activado' : 'Activar sonido'}
  </button>
);

export const OvaTools: React.FC<OvaToolsProps> = ({ title, description, includeEvaluation = false }) => {
  const { user } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => () => {
    audioContextRef.current?.close();
  }, []);

  const toggleSound = () => {
    setSoundEnabled((enabled) => !enabled);
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const downloadHtml = () => {
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;padding:0 20px;color:#172B4D;background:#F8FBFD}main{background:#fff;border:1px solid #DCE8F2;border-radius:12px;padding:28px}h1{color:#176EB8}p{line-height:1.6}</style></head><body><main><h1>${title}</h1><p>${description || 'Recurso educativo del OVA BOM.'}</p><p>Este archivo fue descargado desde BOM (Bloom-Oriented MRU).</p></main></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="ova-tools" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '24px' }}>
      <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
      <button className="btn btn-outline" type="button" onClick={downloadHtml}>
        <Download size={16} /> Descargar recurso HTML
      </button>
      {includeEvaluation && user?.rol === 'experto' && (
        <a className="btn btn-secondary" href={SECTION_A_URL} target="_blank" rel="noreferrer">
          <ClipboardCheck size={16} /> Evaluar Sección A
        </a>
      )}
    </div>
  );
};

export const useOvaSound = () => {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const play = (frequency: number) => {
    if (!enabled) return;
    const context = contextRef.current || new AudioContext();
    contextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  };
  return { enabled, setEnabled, play };
};
