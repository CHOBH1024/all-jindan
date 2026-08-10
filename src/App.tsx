import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { DiagnosisList } from './components/DiagnosisList';
import { MyResults } from './components/MyResults';
import { Analysis } from './components/Analysis';
import { FuturePlan } from './components/FuturePlan';
import { Community } from './components/Community';
import { AuthModal } from './components/AuthModal';
import { api, getToken, getSavedUser, setToken, saveUser, type User } from './api';

export interface DiagnosisRecord {
  site: string;
  title: string;
  result: string;
  emoji: string;
  date: string;
  score?: number;
  serverId?: number;
  shared?: number;
}

export type Tab = 'home' | 'diagnosis' | 'results' | 'analysis' | 'future' | 'community';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'diagnosis', label: '진단 모음', icon: '🧩' },
  { id: 'results', label: '나의 결과', icon: '📊' },
  { id: 'analysis', label: '통합 분석', icon: '🧬' },
  { id: 'future', label: '미래 설계', icon: '🗺️' },
  { id: 'community', label: '커뮤니티', icon: '👥' },
];

export function loadResults(): DiagnosisRecord[] {
  try {
    const raw = localStorage.getItem('alljindan_results');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveResults(list: DiagnosisRecord[]) {
  localStorage.setItem('alljindan_results', JSON.stringify(list));
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [results, setResults] = useState<DiagnosisRecord[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('alljindan_theme') !== 'light');

  useEffect(() => {
    setResults(loadResults());
    setUser(getSavedUser());
    // 토큰 있으면 서버 데이터 동기화
    if (getToken()) {
      api.myDiagnoses().then(d => {
        const serverItems = (d.diagnoses || []).map((x: { site: string; title: string; result: string; emoji: string; score?: number; created_at: number; id: number; shared: number }) => ({
          site: x.site, title: x.title, result: x.result, emoji: x.emoji, score: x.score,
          date: new Date(x.created_at).toISOString().slice(0, 10),
          serverId: x.id, shared: x.shared,
        }));
        if (serverItems.length > 0) {
          setResults(serverItems);
          saveResults(serverItems);
        }
      }).catch(() => {});
    }
  }, []);

  const addResult = async (r: DiagnosisRecord) => {
    const next = [r, ...results];
    setResults(next);
    saveResults(next);
    // 로그인 시 서버에도 저장
    if (getToken()) {
      try {
        const d = await api.addDiagnosis({ site: r.site, title: r.title, result: r.result, emoji: r.emoji, score: r.score });
        if (d.id) {
          const synced = next.map(x => x === r ? { ...x, serverId: d.id } : x);
          setResults(synced);
          saveResults(synced);
        }
      } catch {}
    }
  };

  const removeResult = async (idx: number) => {
    const target = results[idx];
    const next = results.filter((_, i) => i !== idx);
    setResults(next);
    saveResults(next);
    if (target.serverId) {
      try { await api.deleteDiagnosis(target.serverId); } catch {}
    }
  };

  const shareResult = async (idx: number) => {
    const target = results[idx];
    if (!target.serverId) {
      // 서버에 먼저 저장 후 공유
      try {
        const d = await api.addDiagnosis({ site: target.site, title: target.title, result: target.result, emoji: target.emoji, score: target.score });
        await api.shareDiagnosis(d.id);
        const next = results.map((x, i) => i === idx ? { ...x, serverId: d.id, shared: 1 } : x);
        setResults(next);
        saveResults(next);
      } catch {}
    } else {
      try {
        await api.shareDiagnosis(target.serverId);
        const next = results.map((x, i) => i === idx ? { ...x, shared: 1 } : x);
        setResults(next);
        saveResults(next);
      } catch {}
    }
  };

  const handleLogin = (u: User) => {
    setUser(u);
    // 로그인 후 서버 데이터 로드
    api.myDiagnoses().then(d => {
      const serverItems = (d.diagnoses || []).map((x: { site: string; title: string; result: string; emoji: string; score?: number; created_at: number; id: number; shared: number }) => ({
        site: x.site, title: x.title, result: x.result, emoji: x.emoji, score: x.score,
        date: new Date(x.created_at).toISOString().slice(0, 10),
        serverId: x.id, shared: x.shared,
      }));
      if (serverItems.length > 0) {
        setResults(serverItems);
        saveResults(serverItems);
      }
    }).catch(() => {});
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('alljindan_theme', next ? 'dark' : 'light');
  };

  const logout = () => {
    setToken(null);
    saveUser(null);
    setUser(null);
  };

  const theme = {
    bg: dark ? 'linear-gradient(160deg,#0a0a14 0%,#101828 100%)' : 'linear-gradient(160deg,#f1f5f9 0%,#e2e8f0 100%)',
    text: dark ? '#e2e8f0' : '#0f172a',
    sub: dark ? '#94a3b8' : '#64748b',
    card: dark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.8)',
    border: dark ? '#1e293b' : '#cbd5e1',
    header: dark ? 'rgba(10,10,20,0.85)' : 'rgba(255,255,255,0.9)',
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: "'Pretendard','Noto Sans KR',system-ui,sans-serif", transition: 'background .3s, color .3s' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: theme.header, backdropFilter: 'blur(12px)', borderBottom: '1px solid ' + theme.border }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setTab('home')}>
            <span style={{ fontSize: 26 }}>🧬</span>
            <span>올<span style={{ color: '#818cf8' }}>진단</span></span>
          </div>
          <nav style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                  background: tab === t.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                  color: tab === t.id ? '#fff' : theme.sub,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
          <button
            onClick={toggleTheme}
            title="테마 전환"
            style={{ padding: '8px 10px', borderRadius: 999, border: '1px solid ' + theme.border, cursor: 'pointer', fontSize: 14, background: 'transparent' }}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                {(user.name || '?')[0]}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{user.name}</div>
              <button onClick={logout} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>로그아웃</button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{ padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              로그인
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 20px 60px' }}>
        {tab === 'home' && <Home onGoDiagnosis={() => setTab('diagnosis')} resultCount={results.length} />}
        {tab === 'diagnosis' && <DiagnosisList results={results} onSave={addResult} />}
        {tab === 'results' && <MyResults results={results} onRemove={removeResult} onShare={shareResult} isLoggedIn={!!user} />}
        {tab === 'analysis' && <Analysis results={results} onGoDiagnosis={() => setTab('diagnosis')} />}
        {tab === 'future' && <FuturePlan results={results} />}
        {tab === 'community' && <Community />}
      </main>

      <footer style={{ borderTop: '1px solid #1e293b', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="https://hub.pomyjo.com/" style={{ padding: '10px 20px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>🧠 POMYJO 진단 허브</a>
          <a href="mailto:nokira1024@gmail.com" style={{ padding: '10px 20px', borderRadius: 999, background: 'rgba(30,41,59,0.6)', color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📧 문의: nokira1024@gmail.com</a>
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>© 2026 올진단 · POMYJO · 문의: nokira1024@gmail.com · 진단 결과는 자기 이해를 위한 참고 자료입니다</div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
    </div>
  );
}
