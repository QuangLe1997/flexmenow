import React, { useState } from 'react';
import { BottomNav, Toast } from './components/UI';
import { Splash, Welcome, Personalize, Login } from './pages/Onboarding';
import Home from './pages/Home';
import { GlowCamera, GlowResult } from './pages/Glow';
import { CreateGallery, CreateDetail, CreateGenerating, CreateResult } from './pages/Create';
import { StoryGallery, StoryDetail, StoryGenerating, StoryComplete } from './pages/Story';
import Saved from './pages/Saved';
import { ProfileScreen, SettingsScreen } from './pages/Profile';
import { BuyCreditsSheet, SubscriptionSheet } from './pages/Modals';

export default function App() {
  // Navigation state
  const [screen, setScreen] = useState('splash'); // splash | welcome | personalize | login | main | sub screens
  const [prevScreens, setPrevScreens] = useState([]);
  const [tab, setTab] = useState('glow');

  // App state
  const [credits, setCredits] = useState(12);
  const [toast, setToast] = useState(null);

  // Sub-screen data
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);

  // Modal state
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  // Navigation helpers
  const go = (s) => { setPrevScreens(p => [...p, screen]); setScreen(s); };
  const back = () => {
    if (prevScreens.length > 0) {
      setScreen(prevScreens[prevScreens.length - 1]);
      setPrevScreens(p => p.slice(0, -1));
    } else {
      setScreen('main');
    }
  };
  const goMain = (t) => { setScreen('main'); setTab(t || tab); setPrevScreens([]); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── Render current screen ──
  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <Splash onDone={() => setScreen('welcome')} />;

      case 'welcome':
        return <Welcome onDone={() => setScreen('personalize')} />;

      case 'personalize':
        return <Personalize onDone={() => setScreen('login')} />;

      case 'login':
        return <Login onDone={() => goMain('glow')} />;

      case 'main':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {tab === 'home' && (
                <Home credits={credits}
                  onTab={(t) => setTab(t)}
                  onTemplate={(t) => { setSelectedTemplate(t); go('create-detail'); }}
                  onAvatar={() => setTab('me')} />
              )}
              {tab === 'glow' && (
                <GlowCamera
                  onClose={() => setTab('home')}
                  onCapture={() => go('glow-result')} />
              )}
              {tab === 'create' && (
                <CreateGallery credits={credits}
                  onTemplate={(t) => { setSelectedTemplate(t); go('create-detail'); }} />
              )}
              {tab === 'story' && (
                <StoryGallery
                  onPack={(p) => { setSelectedPack(p); go('story-detail'); }} />
              )}
              {tab === 'saved' && <Saved />}
              {tab === 'me' && (
                <ProfileScreen credits={credits}
                  onSettings={() => go('settings')}
                  onBuyCredits={() => setShowBuyCredits(true)}
                  onUpgrade={() => setShowSubscription(true)} />
              )}
            </div>
            <BottomNav activeTab={tab} onTab={(t) => setTab(t)} />
          </div>
        );

      case 'glow-result':
        return (
          <GlowResult
            onBack={back}
            onSave={() => showToast('Image saved!')}
            onShare={() => showToast('Link copied!')} />
        );

      case 'create-detail':
        return (
          <CreateDetail
            template={selectedTemplate}
            credits={credits}
            onBack={back}
            onGenerate={(t) => {
              setCredits(c => c - t.credits);
              go('create-generating');
            }} />
        );

      case 'create-generating':
        return (
          <CreateGenerating
            template={selectedTemplate}
            onDone={() => { setScreen('create-result'); }}
            onCancel={back} />
        );

      case 'create-result':
        return (
          <CreateResult
            template={selectedTemplate}
            onBack={() => goMain('create')}
            onSave={() => showToast('Image saved!')}
            onShare={() => showToast('Link copied!')}
            onRedo={() => { setCredits(c => c - 1); setScreen('create-generating'); }}
            onTemplate={(t) => { setSelectedTemplate(t); setScreen('create-detail'); }} />
        );

      case 'story-detail':
        return (
          <StoryDetail
            pack={selectedPack}
            credits={credits}
            onBack={back}
            onGenerate={(p) => {
              setCredits(c => c - p.credits);
              go('story-generating');
            }} />
        );

      case 'story-generating':
        return (
          <StoryGenerating
            pack={selectedPack}
            onDone={() => setScreen('story-complete')} />
        );

      case 'story-complete':
        return (
          <StoryComplete
            pack={selectedPack}
            onBack={() => goMain('story')}
            onSave={() => showToast('All photos saved!')} />
        );

      case 'settings':
        return <SettingsScreen onBack={back} />;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16 }}>
      <div className="phone-shell">
        <div className="phone-notch" />
        {renderScreen()}
        <Toast message={toast} />

        {/* Modals */}
        <BuyCreditsSheet
          open={showBuyCredits}
          onClose={() => setShowBuyCredits(false)}
          onBuy={(n) => { setCredits(c => c + n); showToast(`+${n} credits added!`); }} />

        <SubscriptionSheet
          open={showSubscription}
          onClose={() => setShowSubscription(false)}
          onSubscribe={(plan) => {
            const add = plan === 'basic' ? 80 : 200;
            setCredits(c => c + add);
            showToast(`Subscribed to ${plan}! +${add} credits`);
          }} />
      </div>
    </div>
  );
}
