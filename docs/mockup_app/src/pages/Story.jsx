import React, { useState, useEffect } from 'react';
import { Header, CategoryChips, StoryPackCard } from '../components/UI';
import { Search, Heart, Star, Zap, Download, Share, CheckCircle, Loader, Clock } from '../components/Icons';
import { storyPacks, taleCategories } from '../data/mockData';

// ── S4.0 FlexTale Gallery ──
export function StoryGallery({ onPack }) {
  const [cat, setCat] = useState('All');
  const filtered = cat === 'All' ? storyPacks : storyPacks.filter(p => p.category.toLowerCase() === cat.toLowerCase());

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="hdr" style={{ marginTop: 44 }}>
        <div style={{ flex: 1 }}>
          <span className="hdr-title brand-title" style={{ textAlign: 'left', fontSize: 20, textTransform: 'none' }}>Story</span>
        </div>
        <button className="hdr-icon"><Search size={22} /></button>
      </div>

      {/* User photo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 16px 8px' }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Your photo:</span>
        <div className="gp-portrait" style={{ width: 48, height: 48, borderRadius: 'var(--r-full)', border: '2px solid var(--purple-500)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>You</span>
        <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 13 }}>Change</button>
      </div>

      <CategoryChips items={taleCategories} active={cat} onSelect={setCat} />

      <div style={{ padding: '8px 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
        ⭐ Featured
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
        {filtered.map(p => (
          <StoryPackCard key={p.id} pack={p} onClick={() => onPack(p)} />
        ))}
      </div>
    </div>
  );
}

// ── S4.1 FlexTale Detail ──
export function StoryDetail({ pack: p, onBack, onGenerate, credits }) {
  const [liked, setLiked] = useState(false);
  if (!p) return null;
  const canCreate = credits >= p.credits;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title={p.name} onBack={onBack}
        right={<button className="hdr-icon" onClick={() => setLiked(!liked)}><Heart size={22} stroke={liked ? 'var(--pink-500)' : undefined} fill={liked ? 'var(--pink-500)' : 'none'} /></button>} />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90 }}>
        {/* Hero collage */}
        <div style={{ display: 'flex', gap: 4, padding: '0 16px', marginBottom: 16 }}>
          <div className={p.gp} style={{ flex: 2, height: 200, borderRadius: 'var(--r-md)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className={p.gp} style={{ flex: 1, borderRadius: 'var(--r-md)', opacity: 0.8 }} />
            <div className={p.gp} style={{ flex: 1, borderRadius: 'var(--r-md)', opacity: 0.6 }} />
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          <div className="brand-title" style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 4, textTransform: 'none' }}>{p.name}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {p.category} · {p.pics} photos · Realistic
          </div>
          <div style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
            "{p.desc}"
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Star size={16} stroke="var(--yellow-500)" fill="var(--yellow-500)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{p.rating}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{p.uses.toLocaleString()} uses</span>
          </div>

          {/* Scenes list */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Scenes ({p.scenes.length})
          </div>
          {p.scenes.map((scene, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: i < p.scenes.length - 1 ? '1px solid var(--divider)' : 'none' }}>
              <div style={{ width: 28, fontSize: 20, fontWeight: 700, color: 'var(--purple-500)', textAlign: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{scene.emoji}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{scene.title}</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{scene.caption}"
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 34px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)' }}>
        <button className="btn-primary" onClick={() => canCreate && onGenerate(p)}
          style={{ opacity: canCreate ? 1 : 0.4 }}>
          <Zap size={18} /> {canCreate ? `Create Story (${p.credits} cr)` : 'Not enough credits'}
        </button>
      </div>
    </div>
  );
}

// ── S4.2 FlexTale Generating ──
export function StoryGenerating({ pack: p, onDone }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!p) return;
    if (done < p.scenes.length) {
      const timer = setTimeout(() => setDone(d => d + 1), 1500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onDone, 800);
      return () => clearTimeout(timer);
    }
  }, [done, p, onDone]);

  if (!p) return null;
  const pct = Math.round((done / p.scenes.length) * 100);

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 16px 0', textAlign: 'center' }}>
        <div className="brand-title" style={{ fontSize: 18, color: 'var(--text-primary)', textTransform: 'none' }}>Creating your story</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{p.name}</div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{done}/{p.scenes.length} scenes</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--purple-500)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Notify me</button>
        </div>
        <div style={{ height: 6, borderRadius: 'var(--r-full)', background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--grad-hero)', borderRadius: 'var(--r-full)', transition: 'width 0.5s' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {p.scenes.map((scene, i) => {
          const status = i < done ? 'done' : i === done ? 'active' : 'pending';
          return (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, opacity: status === 'pending' ? 0.5 : 1, transition: 'opacity 0.3s' }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {status === 'done' && <CheckCircle size={20} stroke="var(--green-500)" />}
                {status === 'active' && <Loader size={20} stroke="var(--purple-500)" />}
                {status === 'pending' && <Clock size={20} stroke="var(--text-tertiary)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {i + 1}. {scene.title}
                  </span>
                  {status === 'active' && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Creating...</span>}
                </div>
                {status === 'done' && (
                  <div className="card" style={{ marginTop: 8, display: 'flex', gap: 8, padding: 8 }}>
                    <div className={`${['gp-travel','gp-golden','gp-warm','gp-night','gp-soft','gp-cool','gp-lifestyle','gp-art','gp-luxury','gp-fresh'][i%10]}`} style={{ width: 80, height: 60, borderRadius: 'var(--r-sm)', flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      "{scene.caption}"
                    </div>
                  </div>
                )}
                {status === 'active' && (
                  <div className="shimmer" style={{ marginTop: 8, height: 60, borderRadius: 'var(--r-sm)' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── S4.3 FlexTale Complete ──
export function StoryComplete({ pack: p, onBack, onSave }) {
  const [viewMode, setViewMode] = useState('scroll');

  if (!p) return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title={p.name} onBack={onBack} />

      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        <button className={`chip ${viewMode === 'scroll' ? 'active' : ''}`} onClick={() => setViewMode('scroll')}>Scroll</button>
        <button className={`chip ${viewMode === 'slides' ? 'active' : ''}`} onClick={() => setViewMode('slides')}>Slides</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {p.scenes.map((scene, i) => (
          <div key={i} style={{ padding: '0 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
              Scene {i + 1}/{p.scenes.length}
            </div>

            <div className={`${['gp-travel','gp-golden','gp-warm','gp-night','gp-soft','gp-cool','gp-lifestyle','gp-art','gp-luxury','gp-cyber'][i%10]}`}
              style={{ width: '100%', aspectRatio: '4/3', borderRadius: 'var(--r-lg)', marginBottom: 12 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{scene.emoji}</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{scene.title}</span>
            </div>

            <div style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 8 }}>
              "{scene.caption}"
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {scene.hashtags.map(tag => (
                <span key={tag} style={{ fontSize: 14, color: 'var(--purple-500)' }}>#{tag}</span>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              📅 Suggested post time: {scene.time}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, height: 40, borderRadius: 'var(--r-md)', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                <Share size={14} /> Share
              </button>
              <button style={{ flex: 1, height: 40, borderRadius: 'var(--r-md)', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
                Redo (1 cr)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 16px 34px', background: 'var(--bg-primary)', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn-primary" onClick={onSave}>
          <Download size={18} /> Download all ({p.scenes.length} photos)
        </button>
        <button className="btn-secondary">
          <Share size={18} /> Share as Instagram carousel
        </button>
      </div>
    </div>
  );
}
