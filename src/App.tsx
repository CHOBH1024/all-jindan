import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { DiagnosisList } from './components/DiagnosisList';
import { MyResults } from './components/MyResults';
import { Analysis } from './components/Analysis';
import { FuturePlan } from './components/FuturePlan';

export interface DiagnosisRecord {
  site: string;
  title: string;
  result: string;
  emoji: string;
  date: string;
  score?: number;
}

export type Tab = 'home' | 'diagnosis' | 'results' | 'analysis' | 'future';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'diagnosis', label: '진단 모음', icon: '🧩' },
  { id: 'results', label: '나의 결과', icon: '📊' },
  { id: 'analysis', label: '통합 분석', icon: '🧬' },
  { id: 'future', label: '미래 설계', icon: '🗺️' },
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

  useEffect(() => {
    setResults(loadResults());
  }, []);

  const addResult = (r: DiagnosisRecord) => {
    const next = [r, ...results];
    setResults(next);
    saveResults(next);
  };

  const removeResult = (idx: number) => {
    const next = results.filter((_, i) => i !== idx);
    setResults(next);
    saveResults(next);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a0a14 0%,#101828 100%)', color: '#e2e8f0', fontFamily: "'Pretendard','Noto Sans KR',system-ui,sans-serif" }}>
      {/* 상단 네비 */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e293b' }}>
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
                  color: tab === t.id ? '#fff' : '#94a3b8',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
          <div style={{ fontSize: 11, color: '#64748b', textAlign: 'right' }}>
            <div style={{ fontWeight: 800, color: '#818cf8' }}>{results.length}개 진단 완료</div>
            <div>나를 이해하는 첫걸음</div>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 20px 60px' }}>
        {tab === 'home' && <Home onGoDiagnosis={() => setTab('diagnosis')} resultCount={results.length} />}
        {tab === 'diagnosis' && <DiagnosisList results={results} onSave={addResult} />}
        {tab === 'results' && <MyResults results={results} onRemove={removeResult} />}
        {tab === 'analysis' && <Analysis results={results} onGoDiagnosis={() => setTab('diagnosis')} />}
        {tab === 'future' && <FuturePlan results={results} />}
      </main>

      {/* 푸터 */}
      <footer style={{ borderTop: '1px solid #1e293b', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="https://hub.pomyjo.com/" style={{ padding: '10px 20px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>🧠 POMYJO 진단 허브</a>
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>© 2026 올진단 · POMYJO · 진단 결과는 자기 이해를 위한 참고 자료입니다</div>
      </footer>
    </div>
  );
}
