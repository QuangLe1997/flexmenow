import React, { useState, useEffect } from 'react';
import { Camera, Flame, Layers, Zap } from '../components/Icons';

// ── S0.1 Splash ──
export function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="screen" style={{ background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="gp-hero" style={{ position: 'absolute', inset: 0, opacity: 0.25 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #050505 70%)' }} />
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 56, height: 56, background: 'var(--amber-500)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(245,158,11,0.4), 0 0 80px rgba(245,158,11,0.15)', transform: 'rotate(12deg)' }}>
          <Zap size={32} fill="#000" stroke="none" />
        </div>
        <div className="brand-title" style={{ fontSize: 40, color: '#fff' }}>
          Flex<span style={{ color: 'var(--amber-500)' }}>Me</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: 500 }}>Flex your dream life</div>
      </div>
      <div style={{ position: 'absolute', bottom: '25%', display: 'flex', gap: 8, zIndex: 1 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber-500)', animation: `pulse 1.2s infinite ${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── S0.2 Welcome Tour ──
const slides = [
  { icon: Camera, title: 'Glow up, naturally', sub: 'AI enhances your photo so subtly, no one can tell the difference.', color: '#fff', bg: 'rgba(255,255,255,0.1)', image: 'gp-onb-locket' },
  { icon: Flame, title: 'Transform in seconds', sub: 'Pick a template. Upload a selfie. AI puts you anywhere.', color: 'var(--amber-500)', bg: 'rgba(245,158,11,0.1)', image: 'gp-onb-shot' },
  { icon: Layers, title: 'Live the story', sub: 'AI creates a photo series with you as the main character.', color: 'var(--purple-500)', bg: 'rgba(124,58,255,0.1)', image: 'gp-onb-tale' },
];

export function Welcome({ onDone }) {
  const [slide, setSlide] = useState(0);
  const s = slides[slide];
  const Ic = s.icon;
  const isLast = slide === slides.length - 1;

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', padding: '0 0 40px' }}>
      <div style={{ textAlign: 'right', padding: '60px 24px 0' }}>
        <button onClick={onDone} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, padding: '8px 0' }}>Skip</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ width: 200, height: 200, borderRadius: 'var(--r-2xl)', overflow: 'hidden', marginBottom: 32, position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div className={s.image} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at center, transparent 60%, ${s.color}15 100%)` }} />
        </div>
        <div className="brand-title" style={{ fontSize: 28, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'none' }}>{s.title}</div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 300, fontWeight: 500 }}>{s.sub}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {slides.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === slide ? 'var(--purple-500)' : 'var(--text-tertiary)', transition: 'all 0.3s' }} />
        ))}
      </div>

      <div style={{ padding: '0 24px' }}>
        <button className="btn-primary" onClick={() => isLast ? onDone() : setSlide(slide + 1)}>
          {isLast ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// ── S0.3 Personalization ──
const personalizeOptions = [
  { icon: Camera, title: 'Look better naturally', sub: 'Subtle AI photo enhancement', color: '#fff', bg: 'rgba(255,255,255,0.08)' },
  { icon: Flame, title: 'Transform into anything', sub: 'AI puts you in any scene', color: 'var(--amber-500)', bg: 'rgba(245,158,11,0.1)' },
  { icon: Layers, title: 'Create photo stories', sub: 'A full story with you as star', color: 'var(--purple-500)', bg: 'rgba(124,58,255,0.1)' },
];

export function Personalize({ onDone }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selected !== null) {
      const t = setTimeout(() => onDone(selected), 500);
      return () => clearTimeout(t);
    }
  }, [selected, onDone]);

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', padding: '100px 24px 40px', alignItems: 'center' }}>
      <div className="brand-title" style={{ fontSize: 24, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 32, textTransform: 'none' }}>
        What excites you most?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {personalizeOptions.map((opt, i) => {
          const Ic = opt.icon;
          const isSelected = selected === i;
          return (
            <button key={i} onClick={() => setSelected(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 'var(--r-lg)', background: 'var(--bg-secondary)', border: isSelected ? `2px solid var(--purple-500)` : '2px solid transparent', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSelected ? '0 0 0 4px rgba(124,58,255,0.1)' : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic size={24} stroke={opt.color} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{opt.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>{opt.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── S0.4 Login ──
export function Login({ onDone }) {
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 40, height: 40, background: 'var(--amber-500)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, transform: 'rotate(12deg)', boxShadow: '0 0 30px rgba(245,158,11,0.3)' }}>
          <Zap size={22} fill="#000" stroke="none" />
        </div>
        <div className="brand-title" style={{ fontSize: 32, color: '#fff' }}>
          Flex<span style={{ color: 'var(--amber-500)' }}>Me</span>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onDone} style={{ width: '100%', height: 52, borderRadius: 'var(--r-md)', background: '#fff', color: '#111', border: 'none', fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
        <button onClick={onDone} style={{ width: '100%', height: 52, borderRadius: 'var(--r-md)', background: '#000', color: '#fff', border: '1px solid var(--divider)', fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Continue with Apple
        </button>
      </div>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        By signing in, you agree to our{' '}
        <span style={{ color: 'var(--purple-500)' }}>Terms of Service</span> and{' '}
        <span style={{ color: 'var(--purple-500)' }}>Privacy Policy</span>
      </div>
    </div>
  );
}
