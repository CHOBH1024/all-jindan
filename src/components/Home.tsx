import { useState } from 'react';
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

      {/* 이달의 테마 — 큐레이션 */}
      <MonthlyTheme onGoDiagnosis={onGoDiagnosis} />

      {/* 상황 시뮬레이션 — 인터랙티브 */}
      <SituationSim results={results} onGoDiagnosis={onGoDiagnosis} />

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

/* ---------- 이달의 테마 (월간 큐레이션) ---------- */
function MonthlyTheme({ onGoDiagnosis }: { onGoDiagnosis: () => void }) {
  // 월별 테마 데이터 (8월: 이직 시즌, 9월: 관계 정리 등)
  const month = new Date().getMonth() + 1;
  const themes: Record<number, { title: string; desc: string; sites: string[] }> = {
    8: { title: '이직 시즌, 나의 커리어 방향 점검', desc: '가을 이직을 앞두고, 일의 방향과 강점을 확인해보세요.', sites: ['mz-radar', 'FIRE-readiness-radar', 'ai-readiness-radar', 'async-work-radar', 'code-review-roulette'] },
    9: { title: '연말 전, 관계 정리와 소통 점검', desc: '가까운 관계의 패턴을 들여다보고 소통 방식을 점검해요.', sites: ['attachment-style-radar', 'assertion-style-radar', 'argument-recovery-radar', 'defensiveness-radar', 'empathy-fatigue-radar'] },
    10: { title: '수면과 회복, 에너지 관리의 계절', desc: '일교차가 커지는 시기, 몸과 마음의 회복 습관을 점검하세요.', sites: ['sleep-hygiene-radar', 'burnout-recovery-radar', 'mindfulness-zen-radar', 'caffeine-dependency-radar', 'digital-detox-radar'] },
    11: { title: '연말 소비와 재무 마인드', desc: '지출이 많아지는 연말, 돈에 대한 감정을 점검해보세요.', sites: ['financial-anxiety-radar', 'reward-spending-radar', 'subscription-fatigue-radar', 'crypto-fomo-radar', 'FIRE-readiness-radar'] },
    12: { title: '한 해를 돌아보는 자기 점검', desc: '올해의 나를 기록하고, 내년의 방향을 설계해보세요.', sites: ['persona-mask-radar', 'perfectionism-radar', 'introvert-charm-radar', 'grit-focus-radar', 'decision-paralysis-radar'] },
    1: { title: '새해 목표, 습관의 힘', desc: '올해의 목표를 습관으로 만드는 첫 단계를 시작해요.', sites: ['procrastination-radar', 'fitness-mindset-radar', 'grit-focus-radar', 'deep-work-battery', 'micro-break-routine'] },
  };
  const theme = themes[month] || themes[8];
  const themeSites = SITES.filter(s => theme.sites.includes(s.name));

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#8a6d3b', fontWeight: 800, textTransform: 'uppercase' }}>
          {month}월의 테마
        </div>
        <div style={{ flex: 1, height: 1, background: '#e5ded2' }} />
      </div>
      <div style={{
        background: 'linear-gradient(135deg,#f7f2e9,#f0e9dc)', border: '1px solid #e5ded2', borderRadius: 12,
        padding: 20, marginBottom: 12,
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Noto Serif KR',serif", marginBottom: 4 }}>{theme.title}</div>
        <div style={{ fontSize: 12, color: '#6b6355', marginBottom: 14 }}>{theme.desc}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {themeSites.map(s => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                background: '#fffdf8', border: '1px solid #ddd3c2', color: '#5a5245',
              }}
            >
              {s.emoji} {s.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 상황 시뮬레이션 (인터랙티브) ---------- */
function SituationSim({ results, onGoDiagnosis }: { results: DiagnosisRecord[]; onGoDiagnosis: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const doneSites = new Set(results.map(r => r.site));

  const scenarios = [
    {
      title: '팀 회의에서 내 의견이 무시됐다',
      options: ['다시 한 번 조리 있게 말한다', '일단 받아들이고 나중에 따로 말한다', '속으로 정리하고 포기한다'],
      tip: '주장력과 갈등 회복 패턴을 보여주는 상황이에요. 대화 유형 진단으로 내 반응 스타일을 확인해보세요.',
      site: 'assertion-style-radar',
    },
    {
      title: '일이 몰리는데 계속 미루고 있다',
      options: ['가장 어려운 것부터 깨부순다', '작은 단위로 쪼개서 시작한다', '마감 직전에 폭발적으로 한다'],
      tip: '미루기의 원인은 의지력이 아니라 감정 조절이에요. 미루기 습관 진단으로 시작 블록을 찾아보세요.',
      site: 'procrastination-radar',
    },
    {
      title: '친한 친구가 갑자기 차갑게 대한다',
      options: ['바로 물어본다', '시간을 두고 기다린다', '내가 뭘 잘못했나 계속 생각한다'],
      tip: '애착 유형에 따라 대인 관계의 위기 대처 방식이 달라져요. 애착 유형 진단으로 내 패턴을 확인해보세요.',
      site: 'attachment-style-radar',
    },
  ];

  const s = scenarios[step];
  const allDone = answers.length === scenarios.length;

  const choose = (i: number) => {
    const next = [...answers, i];
    setAnswers(next);
    if (next.length < scenarios.length) setStep(step + 1);
  };
  const reset = () => { setAnswers([]); setStep(0); };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#8a6d3b', fontWeight: 800, textTransform: 'uppercase' }}>
          상황 시뮬레이션
        </div>
        <div style={{ flex: 1, height: 1, background: '#e5ded2' }} />
        <span style={{ fontSize: 11, color: '#7a7060' }}>{allDone ? '완료' : `${step + 1}/${scenarios.length}`}</span>
      </div>

      <div style={{
        background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 12, padding: 20,
      }}>
        {!allDone ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Noto Serif KR',serif", marginBottom: 14 }}>
              {s.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                    background: '#f7f2e9', border: '1px solid #ece4d5', color: '#3d3830',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>🎯 당신의 반응 스타일</div>
            <div style={{ fontSize: 12, color: '#5a5245', lineHeight: 1.8, marginBottom: 14 }}>
              {scenarios.map((sc, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <strong>{sc.title}</strong> → "{sc.options[answers[i]]}"
                </div>
              ))}
              <div style={{ marginTop: 10, color: '#8a6d3b', fontWeight: 700 }}>
                {scenarios[0].tip.split('. ')[0]}와 같은 패턴을 정확히 알고 싶다면, 진단으로 확인해보세요.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onGoDiagnosis()}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  background: '#2b2620', color: '#faf7f2', border: 'none',
                }}
              >
                진단 모음 가기
              </button>
              <button
                onClick={reset}
                style={{
                  padding: '10px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: '#fffdf8', border: '1px solid #ddd3c2', color: '#7a7060',
                }}
              >
                다시 하기
              </button>
            </div>
          </>
        )}
      </div>
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
