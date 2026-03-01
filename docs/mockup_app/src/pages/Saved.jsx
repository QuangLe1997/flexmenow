import React, { useState } from 'react';
import { CategoryChips } from '../components/UI';
import { Camera, Flame, Layers } from '../components/Icons';
import { savedItems } from '../data/mockData';

export default function Saved() {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Glow', 'Create', 'Story'];

  const items = filter === 'All' ? savedItems :
    savedItems.filter(s => s.type === filter.toLowerCase());

  const grouped = items.reduce((acc, item) => {
    (acc[item.date] = acc[item.date] || []).push(item);
    return acc;
  }, {});

  const badgeIcon = (type) => {
    if (type === 'glow') return <Camera size={10} stroke="#fff" />;
    if (type === 'create') return <Flame size={10} stroke="var(--amber-500)" />;
    return <Layers size={10} stroke="var(--purple-400)" />;
  };

  const badgeBg = (type) => {
    if (type === 'glow') return 'rgba(255,255,255,0.2)';
    if (type === 'create') return 'rgba(245,158,11,0.3)';
    return 'rgba(124,58,255,0.3)';
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="hdr" style={{ marginTop: 44 }}>
        <div style={{ flex: 1 }}>
          <span className="hdr-title brand-title" style={{ textAlign: 'left', fontSize: 20, textTransform: 'none' }}>Saved</span>
        </div>
        <button className="hdr-icon" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Sort</button>
      </div>

      <CategoryChips items={filters} active={filter} onSelect={setFilter} />

      {Object.entries(grouped).map(([date, dateItems]) => (
        <div key={date}>
          <div style={{ padding: '12px 16px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {date}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, padding: '0 16px' }}>
            {dateItems.map(item => (
              <div key={item.id} style={{ aspectRatio: '1', position: 'relative', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}>
                <div className={item.gp} style={{ width: '100%', height: '100%' }} />
                {/* Feature badge */}
                <div style={{ position: 'absolute', bottom: 4, left: 4, width: 20, height: 20, borderRadius: 'var(--r-full)', background: badgeBg(item.type), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {badgeIcon(item.type)}
                </div>
                {item.count && (
                  <div style={{ position: 'absolute', top: 4, right: 4, padding: '1px 6px', borderRadius: 'var(--r-full)', background: 'rgba(0,0,0,0.6)', fontSize: 10, color: '#fff' }}>
                    {item.count}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>No creations yet</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Start with Glow!</div>
        </div>
      )}
    </div>
  );
}
