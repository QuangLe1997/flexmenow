import React, { useState } from 'react';
import { BottomSheet } from '../components/UI';
import { Check } from '../components/Icons';

// ── M2 Buy Credits ──
export function BuyCreditsSheet({ open, onClose, onBuy }) {
  const tiers = [
    { credits: 15, price: '$1.99', desc: '≈ 15 FlexShots or 2 stories', badge: null },
    { credits: 50, price: '$4.99', desc: '≈ 50 FlexShots or 6 stories', badge: 'MOST POPULAR' },
    { credits: 120, price: '$9.99', desc: '≈ 120 FlexShots or 15 stories', badge: 'SAVE 20%' },
  ];
  const [selected, setSelected] = useState(1);

  return (
    <BottomSheet open={open} onClose={onClose} title="Buy credits ⭐">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {tiers.map((tier, i) => {
          const isSelected = selected === i;
          const isPopular = i === 1;
          return (
            <button key={i} onClick={() => setSelected(i)}
              style={{
                width: '100%', textAlign: 'left', padding: '16px',
                borderRadius: 'var(--r-lg)',
                background: isSelected ? 'rgba(124,58,255,0.08)' : 'var(--bg-secondary)',
                border: isPopular ? '2px solid var(--purple-500)' : isSelected ? '2px solid var(--purple-400)' : '1px solid var(--card-border)',
                cursor: 'pointer', position: 'relative',
              }}>
              {tier.badge && (
                <div style={{ position: 'absolute', top: -10, right: 12, padding: '2px 10px', background: isPopular ? 'var(--amber-500)' : 'var(--purple-500)', fontSize: 10, fontWeight: 900, color: isPopular ? '#000' : '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', transform: 'skewX(-12deg)' }}>
                  {tier.badge}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{tier.credits} credits</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{tier.price}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tier.desc}</div>
            </button>
          );
        })}
      </div>
      <button className="btn-primary" onClick={() => { onBuy(tiers[selected].credits); onClose(); }}>
        Buy {tiers[selected].credits} credits for {tiers[selected].price}
      </button>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>Or upgrade to Premium →</button>
      </div>
    </BottomSheet>
  );
}

// ── M4 Subscription Plans ──
export function SubscriptionSheet({ open, onClose, onSubscribe }) {
  const [selected, setSelected] = useState('pro');

  const plans = [
    {
      id: 'free', name: 'Free', price: 'Current plan', isCurrent: true,
      features: ['Glow: 10/day', 'Create: 2/day', 'Story: Preview only'],
    },
    {
      id: 'basic', name: 'Basic', price: '$4.99/mo',
      features: ['Unlimited Glow', '80 Create credits', '20 Story credits', 'No ads'],
    },
    {
      id: 'pro', name: 'Pro', price: '$9.99/mo', badge: 'MOST POPULAR',
      features: ['Everything in Basic', '200 Create credits', '80 Story credits', 'Premium templates', 'Priority processing', 'HD export, no watermark'],
    },
  ];

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="brand-title" style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 4, textTransform: 'none' }}>Upgrade to Pro</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Unlock the full power of FlexMe</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxHeight: 360, overflowY: 'auto' }}>
        {plans.map(plan => {
          const isSelected = selected === plan.id;
          const isPro = plan.id === 'pro';
          return (
            <button key={plan.id} onClick={() => !plan.isCurrent && setSelected(plan.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '16px',
                borderRadius: 'var(--r-lg)',
                background: isSelected ? 'rgba(124,58,255,0.08)' : 'var(--bg-secondary)',
                border: isPro && isSelected ? '2px solid var(--purple-500)' : isSelected ? '2px solid var(--purple-400)' : '1px solid var(--card-border)',
                cursor: plan.isCurrent ? 'default' : 'pointer', position: 'relative',
                opacity: plan.isCurrent ? 0.6 : 1,
              }}>
              {plan.badge && (
                <div style={{ position: 'absolute', top: -10, right: 12, padding: '2px 10px', background: 'var(--amber-500)', fontSize: 10, fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em', transform: 'skewX(-12deg)' }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: plan.isCurrent ? 'var(--text-tertiary)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{plan.price}</span>
              </div>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Check size={14} stroke={isSelected ? 'var(--purple-500)' : 'var(--text-tertiary)'} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
              {!plan.isCurrent && isSelected && (
                <button className="btn-primary" style={{ marginTop: 12, height: 44 }}
                  onClick={(e) => { e.stopPropagation(); onSubscribe(plan.id); onClose(); }}>
                  Choose {plan.name}
                </button>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        Powered by Stripe. Cancel anytime.<br />Auto-renews monthly.
      </div>
    </BottomSheet>
  );
}
