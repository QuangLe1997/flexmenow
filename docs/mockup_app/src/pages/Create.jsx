import React, { useState, useEffect } from 'react';
import { Header, CategoryChips, TemplateCard } from '../components/UI';
import { Search, Heart, Eye, Star, Zap, Download, Share, RotateCcw } from '../components/Icons';
import { templates, shotCategories, genSteps } from '../data/mockData';

// ── S3.0 FlexShot Gallery ──
export function CreateGallery({ credits, onTemplate }) {
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtered = templates.filter(t => {
    if (cat !== 'All' && !t.category.toLowerCase().includes(cat.toLowerCase().replace(' & fun', ''))) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div className="hdr" style={{ marginTop: 44 }}>
        <div style={{ flex: 1 }}>
          <span className="hdr-title brand-title" style={{ textAlign: 'left', fontSize: 20, textTransform: 'none' }}>Create</span>
        </div>
        <button className="hdr-icon" onClick={() => setShowSearch(!showSearch)}><Search size={22} /></button>
      </div>

      {/* Search */}
      {showSearch && (
        <div style={{ margin: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--r-md)', padding: '0 12px' }}>
          <Search size={16} stroke="var(--text-tertiary)" />
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '12px 0', fontSize: 14, color: 'var(--text-primary)' }} />
        </div>
      )}

      {/* User photo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 16px 8px' }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Your photo:</span>
        <div className="gp-portrait" style={{ width: 48, height: 48, borderRadius: 'var(--r-full)', border: '2px solid var(--purple-500)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>You</span>
        <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 13 }}>Change</button>
      </div>

      {/* Categories */}
      <CategoryChips items={shotCategories} active={cat} onSelect={setCat} />

      {/* Section header */}
      <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>🔥 Trending</span>
      </div>

      {/* Template Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
        {filtered.map(t => (
          <TemplateCard key={t.id} template={t} onClick={() => onTemplate(t)} />
        ))}
      </div>

      {/* Quick Create */}
      <div style={{ padding: '16px 16px' }}>
        <button style={{ width: '100%', height: 52, borderRadius: 'var(--r-md)', background: 'rgba(245,158,11,0.08)', border: '1.5px dashed var(--amber-500)', color: 'var(--amber-500)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
          <Zap size={18} /> Quick Create — AI picks for you
        </button>
      </div>
    </div>
  );
}

// ── S3.1 FlexShot Detail ──
export function CreateDetail({ template: t, onBack, onGenerate, credits }) {
  const [faceSim, setFaceSim] = useState(75);
  const [aspect, setAspect] = useState('1:1');
  const [liked, setLiked] = useState(false);

  if (!t) return null;
  const canCreate = credits >= t.credits;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title={t.name} onBack={onBack}
        right={<button className="hdr-icon" onClick={() => setLiked(!liked)}><Heart size={22} stroke={liked ? 'var(--pink-500)' : undefined} fill={liked ? 'var(--pink-500)' : 'none'} /></button>} />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90 }}>
        {/* Sample Image */}
        <div className={t.gp} style={{ width: '100%', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,255,255,0.1)' }}>
          📷
        </div>

        {/* Thumbnails */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={t.gp} style={{ width: 64, height: 64, borderRadius: 'var(--r-sm)', flexShrink: 0, opacity: i === 0 ? 1 : 0.6, border: i === 0 ? '2px solid var(--purple-500)' : 'none' }} />
          ))}
        </div>

        <div style={{ padding: '0 16px' }}>
          <div className="brand-title" style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 4, textTransform: 'none' }}>{t.name}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{t.category} · {t.style}</div>
          <div style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: 12 }}>
            "Standing before the iconic landmark in golden hour light"
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Star size={16} stroke="var(--yellow-500)" fill="var(--yellow-500)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t.rating}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t.uses.toLocaleString()} uses</span>
          </div>

          {/* Customize */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Customize</div>

          {/* Face similarity */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>Face similarity</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Less</span>
              <input type="range" min="50" max="100" value={faceSim}
                onChange={(e) => setFaceSim(Number(e.target.value))}
                style={{ flex: 1, appearance: 'none', height: 4, borderRadius: 'var(--r-full)', background: `linear-gradient(to right, var(--purple-500) ${(faceSim-50)*2}%, var(--bg-tertiary) ${(faceSim-50)*2}%)`, outline: 'none', cursor: 'pointer' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--purple-500)', fontFamily: 'var(--font-mono)' }}>{faceSim}%</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Lower = more creative. Higher = looks more like you.</div>
          </div>

          {/* Aspect ratio */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>Aspect ratio</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['1:1', '9:16', '16:9'].map(a => (
                <button key={a} onClick={() => setAspect(a)}
                  className={`chip ${aspect === a ? 'active' : ''}`}>{a}</button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <button className="btn-secondary" style={{ marginBottom: 12 }}>
            <Eye size={18} /> Preview — free, low quality
          </button>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 34px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)' }}>
        <button className="btn-amber" onClick={() => canCreate && onGenerate(t)}
          style={{ opacity: canCreate ? 1 : 0.4 }}>
          <Zap size={18} fill="#000" stroke="none" /> {canCreate ? `Create! (${t.credits} credit${t.credits > 1 ? 's' : ''})` : 'Not enough credits'}
        </button>
      </div>
    </div>
  );
}

// ── S3.2 FlexShot Generating ──
export function CreateGenerating({ template: t, onDone, onCancel }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < genSteps.length - 1) {
      const delay = step === 0 ? 500 : 1200;
      const timer = setTimeout(() => setStep(s => s + 1), delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onDone, 800);
      return () => clearTimeout(timer);
    }
  }, [step, onDone]);

  const { pct, text } = genSteps[step];

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
      {/* User photo with blur */}
      <div style={{ width: 160, height: 160, borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
        <div className="gp-portrait" style={{ width: '100%', height: '100%', filter: `blur(${pct < 100 ? 8 : 0}px)`, transition: 'filter 0.5s' }} />
        {pct < 100 && <div className="shimmer" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Zap size={18} stroke="var(--amber-500)" />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Creating...</span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>{t?.name}</div>

      {/* Progress bar */}
      <div style={{ width: 240, height: 6, borderRadius: 'var(--r-full)', background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--grad-btn-amber)', borderRadius: 'var(--r-full)', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 40, fontFamily: 'var(--font-mono)' }}>{pct}% · {text}</div>

      {/* Tip */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>💡 While you wait:</div>
        <button className="btn-ghost" style={{ fontSize: 14 }}>Browse more templates →</button>
      </div>

      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 14 }}>Cancel</button>
    </div>
  );
}

// ── S3.3 FlexShot Result ──
export function CreateResult({ template: t, onBack, onSave, onShare, onRedo, onTemplate }) {
  const suggestions = templates.filter(x => x.id !== t?.id).slice(0, 3);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="FlexShot Result" onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* Result image with blur reveal */}
        <div className={t?.gp || 'gp-travel'} style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s ease' }}>
          <span style={{ fontSize: 48, opacity: 0.15 }}>✨</span>
        </div>

        <div style={{ padding: '16px 16px' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{t?.name}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Created just now</div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 28 }}>
            {[
              { icon: Download, label: 'Save', onClick: onSave },
              { icon: Share, label: 'Share', onClick: onShare },
              { icon: RotateCcw, label: 'Redo', onClick: onRedo },
            ].map(({ icon: Ic, label, onClick }) => (
              <button key={label} onClick={onClick}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--r-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic size={24} stroke="var(--text-primary)" />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Suggestions */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Try these next</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
            {suggestions.map(s => (
              <div key={s.id} style={{ width: 110, flexShrink: 0 }}>
                <TemplateCard template={s} onClick={() => onTemplate(s)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
