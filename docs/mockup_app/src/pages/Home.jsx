import React from 'react';
import { HomeHeader, TemplateCard } from '../components/UI';
import { Camera, Flame, Layers, ChevronRight } from '../components/Icons';
import { templates } from '../data/mockData';

export default function Home({ credits, onTab, onTemplate, onAvatar }) {
  const trending = templates.filter(t => t.badge === 'HOT').slice(0, 4);

  return (
    <div style={{ paddingBottom: 100 }}>
      <HomeHeader credits={credits} onAvatar={onAvatar} />

      {/* Greeting */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>Hey there! 👋</div>
      </div>

      {/* FlexLocket Hero Card */}
      <div onClick={() => onTab('glow')} style={{ margin: '0 16px 12px', borderRadius: 'var(--r-lg)', cursor: 'pointer', position: 'relative', overflow: 'hidden', height: 160 }}>
        <div className="gp-onb-locket" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,255,0.7), rgba(124,58,255,0.3))' }} />
        <div style={{ position: 'relative', padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Camera size={20} stroke="#fff" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>FlexLocket</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>Enhance any photo naturally</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 14, fontWeight: 500 }}>
            Capture now <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {/* Feature Cards Row */}
      <div style={{ display: 'flex', gap: 12, padding: '0 16px', marginBottom: 24 }}>
        <div onClick={() => onTab('create')} className="card" style={{ flex: 1, cursor: 'pointer', borderColor: 'rgba(245,158,11,0.15)', overflow: 'hidden' }}>
          <div className="gp-ban-shot" style={{ height: 80, width: '100%' }} />
          <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={18} stroke="var(--amber-500)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>FlexShot</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{templates.length} templates</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--amber-500)', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
              Explore <ChevronRight size={14} />
            </div>
          </div>
        </div>
        <div onClick={() => onTab('story')} className="card" style={{ flex: 1, cursor: 'pointer', overflow: 'hidden' }}>
          <div className="gp-ban-tale" style={{ height: 80, width: '100%' }} />
          <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={18} stroke="var(--purple-400)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>FlexTale</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>25 stories</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--purple-500)', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
              Explore <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="brand-title" style={{ fontSize: 18, color: 'var(--text-primary)', textTransform: 'none' }}>Recent</span>
          <button className="btn-ghost" style={{ padding: 0, fontSize: 14 }} onClick={() => onTab('saved')}>See all</button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {['gp-travel', 'gp-art', 'gp-warm', 'gp-night', 'gp-cool', 'gp-cyber'].map((gp, i) => (
            <div key={i} className={gp} style={{ width: 80, height: 80, borderRadius: 'var(--r-md)', flexShrink: 0 }} />
          ))}
        </div>
      </div>

      {/* Trending Templates */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="brand-title" style={{ fontSize: 18, color: 'var(--text-primary)', textTransform: 'none' }}>Trending templates</span>
          <button className="btn-ghost" style={{ padding: 0, fontSize: 14 }} onClick={() => onTab('create')}>See all</button>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {trending.map(t => (
            <div key={t.id} style={{ width: 140, flexShrink: 0 }}>
              <TemplateCard template={t} onClick={() => onTemplate(t)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
