import React, { useState } from 'react';
import { Header } from '../components/UI';
import { X, FlipH, ImageIcon, Download, Share, Zap } from '../components/Icons';
import { vibes } from '../data/mockData';

// ── S2.0 FlexLocket Camera ──
export function GlowCamera({ onClose, onCapture }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <div className="hdr" style={{ marginTop: 44 }}>
        <button className="hdr-icon" onClick={onClose}><X size={24} /></button>
        <span className="hdr-title brand-title" style={{ textAlign: 'center', textTransform: 'none' }}>Glow</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 'var(--r-full)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: 13, color: '#fff', fontFamily: 'var(--font-mono)' }}>⚡ 10</span>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div style={{ flex: 1, margin: '0 16px', borderRadius: 'var(--r-lg)', background: 'var(--bg-tertiary)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="gp-face" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
        {/* Face guide oval */}
        <div style={{ width: 180, height: 240, border: '2px dashed rgba(255,255,255,0.3)', borderRadius: '50%', position: 'relative', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontSize: 14, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
          Look straight at camera
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '24px 40px 50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{ width: 48, height: 48, borderRadius: 'var(--r-full)', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <FlipH size={22} stroke="var(--text-secondary)" />
        </button>
        {/* Shutter — double circle + Zap center */}
        <button onClick={onCapture} style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', border: '4px solid var(--bg-tertiary)', boxShadow: '0 0 0 2px rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} fill="#000" stroke="none" />
          </div>
        </button>
        <button onClick={onCapture} style={{ width: 48, height: 48, borderRadius: 'var(--r-full)', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ImageIcon size={22} stroke="var(--text-secondary)" />
        </button>
      </div>
    </div>
  );
}

// ── S2.1 FlexLocket Result ──
export function GlowResult({ onBack, onSave, onShare }) {
  const [enhance, setEnhance] = useState(70);
  const [vibe, setVibe] = useState('original');
  const [sliderPos, setSliderPos] = useState(50);

  const handleSliderDrag = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    setSliderPos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Header title="Glow" onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        {/* Gamification text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Can you spot the difference?</span>
          <span style={{ color: 'var(--purple-500)' }}>✦</span>
        </div>

        {/* Before/After slider */}
        <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: 'var(--r-lg)', overflow: 'hidden', position: 'relative', cursor: 'ew-resize', marginBottom: 8 }}
          onMouseMove={(e) => e.buttons && handleSliderDrag(e)}
          onTouchMove={handleSliderDrag}
          onClick={handleSliderDrag}>
          {/* After image */}
          <div className="gp-warm" style={{ position: 'absolute', inset: 0 }} />
          {/* Before image (clipped) */}
          <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
            <div className="gp-face" style={{ width: '100%', height: '100%' }} />
          </div>
          {/* Slider line */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, width: 2, background: '#fff', transform: 'translateX(-50%)' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 32, height: 32, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              ◀▶
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Before</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>After</span>
        </div>

        {/* Enhance Slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Enhance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="range" min="0" max="100" value={enhance}
                onChange={(e) => setEnhance(Number(e.target.value))}
                style={{ width: '100%', appearance: 'none', height: 4, borderRadius: 'var(--r-full)', background: `linear-gradient(to right, var(--purple-500) ${enhance}%, var(--bg-tertiary) ${enhance}%)`, outline: 'none', cursor: 'pointer' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--purple-500)', fontFamily: 'var(--font-mono)', width: 36, textAlign: 'right' }}>{enhance}%</span>
          </div>
        </div>

        {/* Vibe Chips */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Vibe</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {vibes.map(v => (
              <button key={v.id} onClick={() => setVibe(v.id)}
                style={{ height: 40, padding: '0 16px', borderRadius: 'var(--r-full)', border: vibe === v.id ? 'none' : '1px solid var(--divider)', background: vibe === v.id ? 'var(--grad-btn)' : 'var(--bg-tertiary)', color: vibe === v.id ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                {v.color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color }} />}
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onSave}>
            <Download size={18} /> Save
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onShare}>
            <Share size={18} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
