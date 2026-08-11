import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { DiagnosisList } from './components/DiagnosisList';
import { MyResults } from './components/MyResults';
import { Analysis } from './components/Analysis';
import { FuturePlan } from './components/FuturePlan';
import { Community } from './components/Community';
import { Science } from './components/Science';
import { AuthModal } from './components/AuthModal';
import { PremiumModal } from './components/PremiumModal';
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

export type Tab = 'home' | 'diagnosis' | 'results' | 'analysis' | 'future' | 'community' | 'science';

const TABS: { id: Tab; label: (en: boolean) => string; icon: string }[] = [
  { id: 'home', label: en => en ? 'Home' : '홈', icon: '🏠' },
  { id: 'diagnosis', label: en => en ? 'Diagnoses' : '진단 모음', icon: '🧩' },
  { id: 'results', label: en => en ? 'My Results' : '나의 결과', icon: '📊' },
  { id: 'analysis', label: en => en ? 'Analysis' : '통합 분석', icon: '🧬' },
  { id: 'future', label: en => en ? 'Future' : '미래 설계', icon: '🗺️' },
  { id: 'community', label: en => en ? 'Community' : '커뮤니티', icon: '👥' },
  { id: 'science', label: en => en ? 'Science' : '과학적 근거', icon: '🔬' },
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
  const [showPremium, setShowPremium] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [showMore, setShowMore] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState<{ users?: number; premiumUsers?: number; orders?: number; revenue?: number; recentOrders?: { id: number; item: string; amount: number; email: string; created_at: number }[] } | null>(null);
  const [dark, setDark] = useState(() => localStorage.getItem('alljindan_theme') !== 'light');
  const [en, setEn] = useState(() => localStorage.getItem('alljindan_lang') === 'en');

  const t = (ko: string, eng: string) => en ? eng : ko;

  useEffect(() => {
    setResults(loadResults());
    setUser(getSavedUser());
    // 다크 모드 CSS 변수 적용
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    // iOS 주소바 색상 동기화
    const mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.setAttribute('content', dark ? '#171310' : '#2b2620');
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    // 프리미엄/관리자 상태 로드
    if (getToken()) {
      api.myStatus().then(d => {
        setIsPremium(!!d.isPremium);
        setIsAdmin(!!d.isAdmin);
        if (d.isAdmin) {
          api.adminStats().then(s => setAdminStats(s)).catch(() => {});
        }
      }).catch(() => {});
    }
    // 토큰 있으면 서버 데이터 동기화 (병합 — 데이터 유실 방지)
    if (getToken()) {
      api.myDiagnoses().then(d => {
        const serverItems = (d.diagnoses || []).map((x: { site: string; title: string; result: string; emoji: string; score?: number; created_at: number; id: number; shared: number }) => ({
          site: x.site, title: x.title, result: x.result, emoji: x.emoji, score: x.score,
          date: new Date(x.created_at).toISOString().slice(0, 10),
          serverId: x.id, shared: x.shared,
        }));
        const local = loadResults();
        const seen = new Set<string>();
        const merged: DiagnosisRecord[] = [];
        const push = (r: DiagnosisRecord) => {
          const key = `${r.site}|${r.result}|${r.date}`;
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(r);
        };
        serverItems.forEach(push);
        local.forEach(push);
        if (merged.length > 0) {
          setResults(merged);
          saveResults(merged);
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
    // 로그인 후 서버 데이터 로드 → 로컬과 병합 (데이터 유실 방지)
    api.myDiagnoses().then(d => {
      const serverItems = (d.diagnoses || []).map((x: { site: string; title: string; result: string; emoji: string; score?: number; created_at: number; id: number; shared: number }) => ({
        site: x.site, title: x.title, result: x.result, emoji: x.emoji, score: x.score,
        date: new Date(x.created_at).toISOString().slice(0, 10),
        serverId: x.id, shared: x.shared,
      }));
      const local = loadResults();
      // 병합: 서버 + 로컬, 같은 (site+result+date) 중복 제거
      const seen = new Set<string>();
      const merged: DiagnosisRecord[] = [];
      const push = (r: DiagnosisRecord) => {
        const key = `${r.site}|${r.result}|${r.date}`;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(r);
      };
      serverItems.forEach(push);
      local.forEach(push);
      if (merged.length > 0) {
        setResults(merged);
        saveResults(merged);
      }
    }).catch(() => {});
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('alljindan_theme', next ? 'dark' : 'light');
  };

  const toggleLang = () => {
    const next = !en;
    setEn(next);
    localStorage.setItem('alljindan_lang', next ? 'en' : 'ko');
  };

  const logout = () => {
    setToken(null);
    saveUser(null);
    setUser(null);
  };

  const deleteAccount = async () => {
    if (!confirm('정말 계정을 삭제할까요? 모든 데이터가 사라집니다. (이 작업은 되돌릴 수 없어요)')) return;
    try {
      await api.deleteAccount();
      localStorage.removeItem('alljindan_results');
      setResults([]);
      logout();
      alert('계정이 삭제되었습니다. 이용해주셔서 감사합니다.');
    } catch {
      alert('계정 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const theme = {
    bg: dark
      ? 'linear-gradient(160deg,#171310 0%,#211b14 100%)'
      : 'linear-gradient(160deg,#faf7f2 0%,#f3ede2 100%)',
    text: 'var(--text)',
    sub: 'var(--sub)',
    card: 'var(--card)',
    border: 'var(--border)',
    header: 'var(--header)',
    accent: 'var(--accent)',
  };

  const openAdmin = () => {
    api.adminStats().then(s => {
      setAdminStats(s);
      setShowAdmin(true);
    }).catch(() => alert('관리자 통계를 불러오지 못했어요.'));
  };

  const handlePremiumPurchased = (product: string) => {
    if (product === 'premium_month' || product === 'premium_year') {
      setIsPremium(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: "'Noto Serif KR','Noto Sans KR',system-ui,sans-serif", transition: 'background .3s, color .3s' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: theme.header, backdropFilter: 'blur(12px)', borderBottom: '1px solid ' + theme.border }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '8px 14px' : '12px 20px', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
          <div style={{ fontSize: isMobile ? 17 : 22, fontWeight: 900, letterSpacing: -1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Noto Serif KR',serif" }} onClick={() => setTab('home')}>
            <span style={{ fontSize: isMobile ? 20 : 24 }}>🧬</span>
            <span>올<span style={{ color: 'var(--accent)' }}>진단</span></span>
          </div>
          {!isMobile && (
            <nav style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
              {TABS.map(tabItem => (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                    background: tab === tabItem.id ? 'var(--text)' : 'transparent',
                    color: tab === tabItem.id ? 'var(--bg)' : theme.sub,
                  }}
                >
                  {tabItem.icon} {tabItem.label(en)}
                </button>
              ))}
            </nav>
          )}
          <button
            onClick={toggleLang}
            title={en ? '한국어' : 'English'}
            style={{ padding: isMobile ? '6px 7px' : '8px 10px', borderRadius: 999, border: '1px solid ' + theme.border, cursor: 'pointer', fontSize: isMobile ? 10 : 12, fontWeight: 800, background: 'transparent', color: theme.sub }}
          >
            {en ? 'KO' : 'EN'}
          </button>
          <button
            onClick={toggleTheme}
            title="테마 전환"
            style={{ padding: isMobile ? '6px 7px' : '8px 10px', borderRadius: 999, border: '1px solid ' + theme.border, cursor: 'pointer', fontSize: isMobile ? 12 : 14, background: 'transparent' }}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
              {isPremium && (
                <span style={{
                  fontSize: isMobile ? 8 : 10, padding: isMobile ? '3px 7px' : '4px 10px', borderRadius: 999, fontWeight: 800,
                  background: 'linear-gradient(135deg,var(--gold),var(--accent))', color: 'var(--bg)',
                }}>
                  👑 PRO
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={openAdmin}
                  style={{
                    padding: isMobile ? '4px 7px' : '6px 10px', borderRadius: 8, fontSize: isMobile ? 9 : 11, cursor: 'pointer',
                    background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)',
                  }}
                >
                  📊 관리자
                </button>
              )}
              <div style={{ width: isMobile ? 26 : 32, height: isMobile ? 26 : 32, borderRadius: '50%', background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 11 : 14, fontWeight: 800 }}>
                {(user.name || '?')[0]}
              </div>
              {!isMobile && <div style={{ fontSize: 12, fontWeight: 700 }}>{user.name}</div>}
              {!isMobile && <button onClick={logout} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)', color: 'var(--error)' }}>로그아웃</button>}
              <button onClick={deleteAccount} title="계정 삭제" style={{ padding: isMobile ? '4px 7px' : '6px 10px', borderRadius: 8, fontSize: isMobile ? 10 : 11, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--hint)' }}>🗑️</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
              {!isMobile && (
                <button
                  onClick={() => setShowPremium(true)}
                  style={{
                    padding: '9px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                    background: 'transparent', border: '1px solid #c9a867', color: 'var(--accent)',
                  }}
                >
                  💎 프리미엄
                </button>
              )}
              <button
                onClick={() => setShowAuth(true)}
                style={{ padding: isMobile ? '7px 12px' : '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: isMobile ? 12 : 13, fontWeight: 800, color: 'var(--bg)', background: 'var(--text)' }}
              >
                {isMobile ? '로그인' : '로그인'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main key={tab} style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '20px 16px 110px' : '40px 32px 80px' }} className="anim-fade">
        {tab === 'home' && <Home onGoDiagnosis={() => setTab('diagnosis')} resultCount={results.length} />}
        {tab === 'diagnosis' && <DiagnosisList results={results} onSave={addResult} onGoAnalysis={() => setTab('analysis')} />}
        {tab === 'results' && <MyResults results={results} onRemove={removeResult} onShare={shareResult} isLoggedIn={!!user} onShowLogin={() => setShowAuth(true)} />}
        {tab === 'analysis' && <Analysis results={results} onGoDiagnosis={() => setTab('diagnosis')} />}
        {tab === 'future' && <FuturePlan results={results} isPremium={isPremium} onShowPremium={() => setShowPremium(true)} />}
        {tab === 'community' && <Community />}
        {tab === 'science' && <Science />}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="https://pomyjo.com/" style={{ padding: '10px 20px', borderRadius: 999, background: 'var(--text)', color: 'var(--bg)', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>🧠 POMYJO 진단 허브</a>
          <a href="mailto:nokira1024@gmail.com" style={{ padding: '10px 20px', borderRadius: 999, background: 'var(--card3)', color: 'var(--hint)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📧 문의: nokira1024@gmail.com</a>
        </div>
        <div style={{ fontSize: 11, color: 'var(--hint)' }}>© 2026 올진단 · POMYJO · 문의: nokira1024@gmail.com · 진단 결과는 자기 이해를 위한 참고 자료입니다</div>
      </footer>

      {/* 모바일 하단 탭 바 */}
      {isMobile && (
        <>
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
            background: theme.header, backdropFilter: 'blur(12px)',
            borderTop: '1px solid ' + theme.border,
            padding: '8px 4px calc(8px + env(safe-area-inset-bottom))',
            display: 'flex', justifyContent: 'space-around',
          }}>
            {TABS.slice(0, 4).map(tabItem => {
              const active = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => { setTab(tabItem.id); setShowMore(false); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '6px 10px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 10, fontWeight: active ? 800 : 600,
                    color: active ? 'var(--accent)' : theme.sub, minWidth: 60,
                  }}
                >
                  <span style={{ fontSize: 19 }}>{tabItem.icon}</span>
                  {tabItem.label(en).split(' ')[0]}
                </button>
              );
            })}
            {/* 더보기 */}
            <button
              onClick={() => setShowMore(!showMore)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 10px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 10, fontWeight: showMore || ['future', 'community', 'science'].includes(tab) ? 800 : 600,
                color: showMore || ['future', 'community', 'science'].includes(tab) ? 'var(--accent)' : theme.sub, minWidth: 60,
              }}
            >
              <span style={{ fontSize: 19 }}>⋯</span>
              더보기
            </button>
          </nav>
          {/* 더보기 시트 */}
          {showMore && (
            <div className="anim-up" style={{
              position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 59,
              background: theme.header, backdropFilter: 'blur(12px)',
              borderTop: '1px solid ' + theme.border, borderRadius: '16px 16px 0 0',
              padding: '16px 20px calc(16px + env(safe-area-inset-bottom))',
              boxShadow: '0 -8px 32px rgba(43,38,32,0.12)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {TABS.slice(4).map(tabItem => (
                  <button
                    key={tabItem.id}
                    onClick={() => { setTab(tabItem.id); setShowMore(false); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '14px 8px', borderRadius: 12, border: '1px solid ' + theme.border, cursor: 'pointer',
                      background: tab === tabItem.id ? 'rgba(138,109,59,0.08)' : 'transparent',
                      fontSize: 11, fontWeight: tab === tabItem.id ? 800 : 600, color: tab === tabItem.id ? 'var(--accent)' : theme.text,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{tabItem.icon}</span>
                    {tabItem.label(en)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {showMore && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 58, background: 'rgba(43,38,32,0.3)' }} onClick={() => setShowMore(false)} />
          )}
        </>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} onPurchased={handlePremiumPurchased} />}
      {showAdmin && adminStats && (
        <div className="anim-fade" style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(43,38,32,0.6)', backdropFilter: 'blur(4px)', padding: 16,
        }} onClick={() => setShowAdmin(false)}>
          <div onClick={e => e.stopPropagation()} className="anim-scale" style={{
            width: '100%', maxWidth: 480, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 24, boxShadow: '0 20px 60px rgba(43,38,32,0.3)', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, fontFamily: "'Noto Serif KR',serif" }}>📊 관리자 대시보드</h2>
              <button onClick={() => setShowAdmin(false)} style={{ background: 'none', border: 'none', color: 'var(--sub2)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: '사용자', value: adminStats.users ?? 0 },
                { label: '프리미엄', value: adminStats.premiumUsers ?? 0 },
                { label: '주문', value: adminStats.orders ?? 0 },
                { label: '매출', value: (adminStats.revenue ?? 0).toLocaleString() + '원' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: 'var(--card2)', borderRadius: 8, padding: '10px 4px' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent)' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--sub2)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, letterSpacing: 1, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>
              최근 주문
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(adminStats.recentOrders || []).map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--card2)', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.item}</span>
                  <span style={{ color: 'var(--sub2)' }}>{o.email}</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{o.amount.toLocaleString()}원</span>
                </div>
              ))}
              {(adminStats.recentOrders || []).length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--hint)', textAlign: 'center', padding: 16 }}>아직 주문이 없습니다</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
