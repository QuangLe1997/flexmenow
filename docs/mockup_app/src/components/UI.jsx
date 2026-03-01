import React from 'react';
import { Camera, Flame, Layers, Grid, User, ChevronLeft, ChevronRight, Star, Zap } from './Icons';

// ── Bottom Navigation ──
export function BottomNav({ activeTab, onTab }) {
  const tabs = [
    { id: 'glow', label: 'Glow', icon: Camera, color: null },
    { id: 'create', label: 'Create', icon: Flame, color: 'var(--amber-500)' },
    { id: 'story', label: 'Story', icon: Layers, color: 'var(--purple-500)' },
    { id: 'saved', label: 'Saved', icon: Grid, color: null },
    { id: 'me', label: 'Me', icon: User, color: null },
  ];
  return (
    <div className="tab-bar">
      {tabs.map(({ id, label, icon: Ic, color }) => {
        const isActive = activeTab === id;
        const activeColor = isActive ? (color || 'var(--purple-500)') : undefined;
        return (
          <button key={id} className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onTab(id)}
            style={activeColor ? { color: activeColor } : undefined}>
            <Ic size={24} />
            <span className="tab-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Header ──
export function Header({ title, onBack, right, transparent }) {
  return (
    <div className="hdr" style={transparent ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'transparent' } : { marginTop: 44 }}>
      {onBack ? (
        <button className="hdr-icon" onClick={onBack}><ChevronLeft size={24} /></button>
      ) : <div style={{ width: 44 }} />}
      <span className="hdr-title" style={{ textAlign: 'center' }}>{title}</span>
      {right || <div style={{ width: 44 }} />}
    </div>
  );
}

// ── Home Header ──
export function HomeHeader({ credits, onAvatar }) {
  return (
    <div className="hdr" style={{ marginTop: 44 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 24, height: 24, background: 'var(--amber-500)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)' }}>
          <Zap size={14} fill="#000" stroke="none" />
        </div>
        <span className="brand-title" style={{ fontSize: 22, color: '#fff' }}>
          Flex<span style={{ color: 'var(--amber-500)' }}>Me</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 'var(--r-full)', border: '1px solid var(--card-border)' }}>
        <Star size={16} stroke="var(--yellow-500)" fill="var(--yellow-500)" />
        <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{credits}</span>
      </div>
      <button onClick={onAvatar} style={{ width: 32, height: 32, borderRadius: 'var(--r-full)', background: 'var(--grad-hero)', border: '2px solid var(--purple-500)', cursor: 'pointer', overflow: 'hidden' }}>
        <div className="gp-portrait" style={{ width: '100%', height: '100%' }} />
      </button>
    </div>
  );
}

// ── Bottom Sheet ──
export function BottomSheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        {title && <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>{title}</div>}
        {children}
      </div>
    </>
  );
}

// ── Toast ──
export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

// ── Category Chips ──
export function CategoryChips({ items, active, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto' }}>
      {items.map(item => {
        const val = typeof item === 'string' ? item : item.label;
        const isActive = active === val || active === val.toLowerCase();
        return (
          <button key={val} className={`chip ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(val)}>
            {val}
          </button>
        );
      })}
    </div>
  );
}

// ── Template Card ──
export function TemplateCard({ template: t, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer', transition: 'transform 0.1s' }}>
      <div style={{ aspectRatio: '3/4', position: 'relative' }}>
        <div className={`img-placeholder ${t.gp}`} style={{ position: 'absolute', inset: 0 }}>
          {t.premium && (
            <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 'var(--r-full)', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🔒</div>
          )}
          {t.badge && (
            <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 10px', background: t.badge === 'HOT' ? 'var(--amber-500)' : 'var(--purple-500)', fontSize: 10, fontWeight: 900, color: t.badge === 'HOT' ? '#000' : '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', transform: 'skewX(-12deg)' }}>
              {t.badge}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{t.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
          <Star size={12} stroke="var(--yellow-500)" fill="var(--yellow-500)" />
          <span>{t.rating}</span>
          <span style={{ margin: '0 2px' }}>·</span>
          <span>{t.credits} credit{t.credits > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

// ── Story Pack Card ──
export function StoryPackCard({ pack: p, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ display: 'flex', padding: 12, gap: 12, cursor: 'pointer', height: 88, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className={p.gp} style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', opacity: 1 - i * 0.15 }} />
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {p.pics} pics · {p.credits} cr
        </div>
        <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'rgba(124,58,255,0.15)', fontSize: 10, fontWeight: 600, color: 'var(--purple-400)', marginTop: 4 }}>
          {p.category}
        </div>
      </div>
      <ChevronRight size={20} stroke="var(--text-tertiary)" />
    </div>
  );
}

// ── Credits Badge (inline) ──
export function CreditsBadge({ credits }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(124,58,255,0.1)', border: '1px solid rgba(124,58,255,0.3)', padding: '6px 12px', borderRadius: 'var(--r-full)' }}>
      <Zap size={14} stroke="var(--purple-400)" />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple-400)' }}>{credits}</span>
    </div>
  );
}
