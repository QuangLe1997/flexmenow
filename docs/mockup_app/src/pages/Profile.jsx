import React, { useState } from 'react';
import { Header } from '../components/UI';
import { Settings, ChevronRight, Star, Zap, Camera, Flame, Layers, Moon, Bell, CreditCard, Shield, HelpCircle, ExternalLink, LogOut, Check } from '../components/Icons';

// ── S6.0 Profile ──
export function ProfileScreen({ credits, onSettings, onBuyCredits, onUpgrade }) {
  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="hdr" style={{ marginTop: 44 }}>
        <div style={{ flex: 1 }}>
          <span className="hdr-title brand-title" style={{ textAlign: 'left', fontSize: 20, textTransform: 'none' }}>Me</span>
        </div>
        <button className="hdr-icon" onClick={onSettings}><Settings size={22} /></button>
      </div>

      {/* Profile card */}
      <div className="card" style={{ margin: '0 16px 16px', overflow: 'hidden' }}>
        <div className="gp-profile-cover" style={{ height: 80, width: '100%' }} />
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: -24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--r-full)', background: 'var(--grad-hero)', padding: 2, flexShrink: 0 }}>
              <div className="gp-portrait" style={{ width: '100%', height: '100%', borderRadius: 'var(--r-full)' }} />
            </div>
            <div style={{ paddingTop: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Alex Chen</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>alex@email.com</div>
              <button className="btn-ghost" style={{ padding: '4px 0', fontSize: 13 }}>Edit profile</button>
            </div>
          </div>
        </div>
      </div>

      {/* Credits card */}
      <div className="card" style={{ margin: '0 16px 16px', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Star size={18} stroke="var(--yellow-500)" fill="var(--yellow-500)" />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Credits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{credits}</span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>remaining</span>
        </div>
        <div style={{ height: 6, borderRadius: 'var(--r-full)', background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${Math.min(100, (credits / 50) * 100)}%`, height: '100%', background: 'var(--grad-hero)', borderRadius: 'var(--r-full)' }} />
        </div>
        <button className="btn-primary" style={{ height: 44 }} onClick={onBuyCredits}>Buy more credits</button>
      </div>

      {/* Stats */}
      <div className="card" style={{ margin: '0 16px 16px', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>📊 Stats</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {[
            { icon: Camera, label: 'Glow', value: '234', sub: 'photos' },
            { icon: Flame, label: 'Create', value: '45', sub: 'photos' },
            { icon: Layers, label: 'Story', value: '8', sub: 'stories' },
          ].map(({ icon: Ic, label, value, sub }) => (
            <div key={label}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan */}
      <div className="card" style={{ margin: '0 16px 16px', padding: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Current plan: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Free</span></div>
        <button className="btn-primary" style={{ height: 44, background: 'var(--grad-hero)' }} onClick={onUpgrade}>
          <Zap size={16} /> Upgrade to Pro
        </button>
      </div>

      {/* Credit history */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Credit history</span>
          <button className="btn-ghost" style={{ padding: 0, fontSize: 13 }}>See all</button>
        </div>
        {[
          { text: 'FlexShot Paris', amount: '-1 cr', time: '14:30' },
          { text: 'Glow enhance', amount: '-0.5', time: '14:25' },
          { text: 'Bought credits', amount: '+15', time: '13:00', positive: true },
        ].map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--divider)' : 'none' }}>
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{h.text}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: h.positive ? 'var(--green-500)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{h.amount}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{h.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── S6.1 Settings ──
export function SettingsScreen({ onBack }) {
  const [darkMode, setDarkMode] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [lang, setLang] = useState('English');

  const Toggle = ({ on, onToggle }) => (
    <button onClick={onToggle} style={{ width: 48, height: 28, borderRadius: 14, background: on ? 'var(--purple-500)' : 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 3, [on ? 'right' : 'left']: 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'all 0.2s' }} />
    </button>
  );

  const Row = ({ icon: Ic, label, right, onClick, danger }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', cursor: onClick ? 'pointer' : 'default', borderBottom: '1px solid var(--divider)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic size={18} stroke={danger ? 'var(--red-500)' : 'var(--text-secondary)'} />
      </div>
      <span style={{ flex: 1, fontSize: 15, color: danger ? 'var(--red-500)' : 'var(--text-primary)' }}>{label}</span>
      {right || (onClick && <ChevronRight size={18} stroke="var(--text-tertiary)" />)}
    </div>
  );

  const languages = ['English', 'Tiếng Việt', 'Español', 'Português', '日本語', '한국어'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="Settings" onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 8px' }}>Appearance</div>
        <Row icon={Moon} label="Dark mode" right={<Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} />} />
        <Row icon={ExternalLink} label="Language" onClick={() => setShowLang(true)}
          right={<span style={{ fontSize: 14, color: 'var(--text-secondary)', marginRight: 8 }}>{lang}</span>} />

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 8px' }}>Notifications</div>
        <Row icon={Bell} label="Push notifications" right={<Toggle on={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />} />
        <Row icon={Bell} label="Email updates" right={<Toggle on={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />} />

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 8px' }}>Account</div>
        <Row icon={CreditCard} label="Manage subscription" onClick={() => {}} />
        <Row icon={CreditCard} label="Transaction history" onClick={() => {}} />
        <Row icon={Shield} label="Linked accounts" onClick={() => {}} />

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 8px' }}>Support</div>
        <Row icon={HelpCircle} label="Help center" onClick={() => {}} />
        <Row icon={HelpCircle} label="Contact us" onClick={() => {}} />
        <Row icon={Star} label="Rate the app" onClick={() => {}} />

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 8px' }}>Legal</div>
        <Row icon={Shield} label="Terms of Service" onClick={() => {}} />
        <Row icon={Shield} label="Privacy Policy" onClick={() => {}} />

        <div style={{ marginTop: 20 }}>
          <Row icon={LogOut} label="Log out" danger onClick={() => {}} />
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-tertiary)' }}>FlexMe v1.0.0</div>
      </div>

      {/* Language bottom sheet */}
      {showLang && (
        <>
          <div className="sheet-overlay" onClick={() => setShowLang(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Language</div>
            {languages.map(l => (
              <button key={l} onClick={() => { setLang(l); setShowLang(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid var(--divider)', cursor: 'pointer' }}>
                <span style={{ fontSize: 16, color: 'var(--text-primary)' }}>{l}</span>
                {lang === l && <Check size={20} stroke="var(--purple-500)" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
