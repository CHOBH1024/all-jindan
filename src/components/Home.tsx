import { SITES } from '../data';
import { Recommend } from './Recommend';
import type { DiagnosisRecord } from '../App';

interface Props {
  onGoDiagnosis: () => void;
  resultCount: number;
}

function loadResultsLocal() {
  try {
    const raw = localStorage.getItem('alljindan_results');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function Home({ onGoDiagnosis, resultCount }: Props) {
  const categories = [...new Set(SITES.map(s => s.category))];
  const results = loadResultsLocal();
  return (
    <div>
      <section style={{ padding: '64px 0 36px', textAlign: 'center', position: 'relative' }}>
        <div style={{
          fontSize: 11, letterSpacing: 3, color: '#8a6d3b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 16,
        }}>
          Self-Knowledge, Systematically
        </div>
        <h1 style={{
          fontSize: 'clamp(30px,5vw,46px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: -1,
          lineHeight: 1.35, fontFamily: "'Noto Serif KR',serif",
        }}>
          나는 어떤 사람인가,<br />진단으로 <span style={{ color: '#8a6d3b' }}>쌓아가는</span> 나의 지도
        </h1>
        <p style={{ fontSize: 'clamp(13px,2vw,15px)', color: '#6b6355', maxWidth: 540, margin: '0 auto 28px', lineHeight: 1.8 }}>
          {SITES.length}개의 진단을 하나의 종합 프로필로. 성격, 커리어, 관계, 습관 —<br />
          네 개의 축으로 <strong style={{ color: '#5a5245' }}>오늘의 나</strong>와 <strong style={{ color: '#5a5245' }}>내일의 나</strong>를 잇습니다.
        </p>
        <button
          onClick={onGoDiagnosis}
          style={{
            padding: '13px 34px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, color: '#faf7f2', background: '#2b2620',
            boxShadow: '0 4px 16px rgba(43,38,32,0.2)', transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#453e33'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2b2620'; }}
        >
          진단 시작하기
        </button>
        <div style={{ fontSize: 12, color: '#7a7060', marginTop: 12 }}>무료 · 로그인 없이 3분</div>
      </section>

      {/* 통계 */}
      <section style={{ display: 'flex', gap: 40, justifyContent: 'center', maxWidth: 720, margin: '0 auto 40px', flexWrap: 'wrap' }}>
        {[
          { n: `${SITES.length}`, l: '진단 도구' },
          { n: `${categories.length}`, l: '카테고리' },
          { n: '4', l: '통합 축' },
          { n: `${resultCount}`, l: '나의 기록' },
        ].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#8a6d3b', fontFamily: "'Noto Serif KR',serif" }}>{s.n}</div>
            <div style={{ fontSize: 11, color: '#7a7060', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </section>

      {/* 추천 진단 (온보딩 — 빈 축 메우기) */}
      <Recommend results={results} onGoDiagnosis={onGoDiagnosis} />

      {/* 오늘의 한 화면 — 대시보드 */}
      {results.length > 0 && <TodayDashboard results={results} onGoDiagnosis={onGoDiagnosis} />}

      {/* 카테고리 소개 */}
      <section style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>어떤 영역을 진단하나요?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {categories.map((cat, i) => {
            const items = SITES.filter(s => s.category === cat);
            return (
              <div key={i} style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{cat}</div>
                <div style={{ fontSize: 12, color: '#9a9081' }}>
                  {items.slice(0, 4).map(s => s.emoji + ' ' + s.title).join(' · ')}
                  {items.length > 4 ? ` · 외 ${items.length - 4}개` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ---------- 오늘의 한 화면 (대시보드) ---------- */
function TodayDashboard({ results, onGoDiagnosis }: { results: DiagnosisRecord[]; onGoDiagnosis: () => void }) {
  // 오늘 습관 (localStorage)
  let habits: { id: number; name: string; days: string[] }[] = [];
  try {
    habits = JSON.parse(localStorage.getItem('alljindan_habits') || '[]');
  } catch {}
  const todayKR = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];
  const todayHabits = habits.filter(h => h.days.includes(todayKR));
  const doneToday = todayHabits.length;

  // 최근 진단 1개
  const recent = [...results].sort((a, b) => b.date.localeCompare(a.date))[0];

  // 인사이트 1줄 (단순 규칙)
  const totalScore = results.filter(r => r.score !== undefined).length;
  const insight = totalScore >= 3
    ? `${totalScore}개 진단 데이터가 쌓였어요. 통합 분석이 점점 선명해지고 있습니다.`
    : `진단 ${3 - totalScore}개만 더 기록하면 4축 레이더가 완성돼요.`;

  return (
    <div style={{
      background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 12, padding: 20, marginBottom: 24,
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: '#8a6d3b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
        오늘의 한 화면
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        {/* 습관 미니 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>✅ 오늘 습관 {todayHabits.length > 0 ? `${doneToday}개` : '없음'}</div>
          {todayHabits.length > 0 ? (
            todayHabits.map(h => (
              <div key={h.id} style={{ fontSize: 12, color: '#6b6355', padding: '6px 0', borderBottom: '1px solid #f0e9dc' }}>
                {h.name}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 12, color: '#7a7060' }}>오늘 체크할 습관이 없어요.<br />미래 설계에서 추가해보세요.</div>
          )}
        </div>
        {/* 최근 진단 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>🕐 최근 진단</div>
          {recent && (
            <div style={{ background: '#f7f2e9', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{recent.emoji} {recent.title}</div>
              <div style={{ fontSize: 12, color: '#6b6355', marginTop: 4 }}>{recent.result}{recent.score !== undefined ? ` · ${recent.score}점` : ''}</div>
            </div>
          )}
        </div>
        {/* 인사이트 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>💡 오늘의 인사이트</div>
          <div style={{ fontSize: 12, color: '#6b6355', lineHeight: 1.7 }}>{insight}</div>
          <button
            onClick={onGoDiagnosis}
            style={{
              marginTop: 10, padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: '#2b2620', color: '#faf7f2', border: 'none',
            }}
          >
            진단 더 하기
          </button>
        </div>
      </div>
    </div>
  );
}
