import { useState, useEffect } from 'react';
import type { DiagnosisRecord } from '../App';

interface Props {
  results: DiagnosisRecord[];
}

interface Goal {
  id: number;
  text: string;
  period: 'short' | 'long';
  done: boolean;
}

interface Habit {
  id: number;
  name: string;
  days: string[];
}

const WEEK = ['월', '화', '수', '목', '금', '토', '일'];

export function FuturePlan({ results }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalText, setGoalText] = useState('');
  const [goalPeriod, setGoalPeriod] = useState<'short' | 'long'>('short');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitName, setHabitName] = useState('');

  useEffect(() => {
    try {
      setGoals(JSON.parse(localStorage.getItem('alljindan_goals') || '[]'));
      setHabits(JSON.parse(localStorage.getItem('alljindan_habits') || '[]'));
    } catch {}
  }, []);

  const saveGoals = (g: Goal[]) => {
    setGoals(g);
    localStorage.setItem('alljindan_goals', JSON.stringify(g));
  };
  const saveHabits = (h: Habit[]) => {
    setHabits(h);
    localStorage.setItem('alljindan_habits', JSON.stringify(h));
  };

  const addGoal = () => {
    if (!goalText.trim()) return;
    saveGoals([...goals, { id: Date.now(), text: goalText.trim(), period: goalPeriod, done: false }]);
    setGoalText('');
  };

  const toggleGoal = (id: number) => saveGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));

  const addHabit = () => {
    if (!habitName.trim()) return;
    saveHabits([...habits, { id: Date.now(), name: habitName.trim(), days: [] }]);
    setHabitName('');
  };

  const toggleDay = (hid: number, day: string) => {
    saveHabits(habits.map(h => {
      if (h.id !== hid) return h;
      const days = h.days.includes(day) ? h.days.filter(d => d !== day) : [...h.days, day];
      return { ...h, days };
    }));
  };

  const removeHabit = (id: number) => saveHabits(habits.filter(h => h.id !== id));

  // 스트릭 보호권 (주 1회)
  const [shieldUsed, setShieldUsed] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('alljindan_shield') || 'null');
      const week = Math.floor(Date.now() / (7 * 86400000));
      return s && s.week === week && s.used;
    } catch { return false; }
  });
  const useShield = () => {
    if (shieldUsed) return;
    if (!confirm('이번 주 리셋 시 체크를 유지하는 보호권을 사용할까요? (주 1회)')) return;
    const week = Math.floor(Date.now() / (7 * 86400000));
    localStorage.setItem('alljindan_shield', JSON.stringify({ week, used: true }));
    setShieldUsed(true);
  };

  // 진단 기반 목표 추천
  const suggestedGoals: string[] = [];
  if (results.some(r => r.title.includes('수면'))) suggestedGoals.push('😴 수면 7시간 루틴 만들기');
  if (results.some(r => r.title.includes('번아웃'))) suggestedGoals.push('🧘 매일 10분 휴식 시간 확보');
  if (results.some(r => r.title.includes('미루기') || r.title.includes('결정'))) suggestedGoals.push('🎯 오늘 할 일 3가지 정하기');
  if (results.some(r => r.title.includes('커리어') || r.title.includes('직장'))) suggestedGoals.push('📈 이번 분기 커리어 목표 1개 설정');
  if (results.some(r => r.title.includes('카페인'))) suggestedGoals.push('☕ 카페인 오후 3시 이후 금지');
  if (results.some(r => r.title.includes('운동'))) suggestedGoals.push('💪 주 3회 운동하기');
  if (suggestedGoals.length === 0) suggestedGoals.push('🧩 진단을 기록하면 맞춤 목표가 추천됩니다');

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>🗺️ 미래 설계</h1>
      <p style={{ fontSize: 13, color: '#9a9081', margin: '0 0 20px' }}>진단 결과를 바탕으로, 앞으로의 삶을 만들어갑니다.</p>

      <WeeklyReport results={results} />

      {/* 주간 챌린지 */}
      <WeeklyChallenge habits={habits} results={results} onGoDiagnosis={() => {}} />

      {/* 분기 성장 맵 */}
      <QuarterMap goals={goals} results={results} habits={habits} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        {/* 목표 설정 */}
        <div style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>🎯 목표 설정</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              placeholder="새 목표 입력..."
              style={{ flex: 1, padding: '9px 14px', borderRadius: 10, background: '#f0e9dc', border: '1px solid #ddd3c2', color: '#3d3830', fontSize: 13 }}
            />
            <select
              value={goalPeriod}
              onChange={e => setGoalPeriod(e.target.value as 'short' | 'long')}
              style={{ padding: '9px', borderRadius: 10, background: '#f0e9dc', border: '1px solid #ddd3c2', color: '#6b6355', fontSize: 12 }}
            >
              <option value="short">단기</option>
              <option value="long">장기</option>
            </select>
            <button onClick={addGoal} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#fff', background: '#2b2620' }}>추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {goals.map(g => (
              <div key={g.id} style={{ padding: '10px 12px', background: '#f0e9dc', borderRadius: 10, border: '1px solid #e5ded2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => toggleGoal(g.id)} style={{ width: 20, height: 20, borderRadius: 6, border: '1px solid #475569', cursor: 'pointer', background: g.done ? '#15803d' : 'transparent', color: '#fff', fontSize: 11 }}>{g.done ? '✓' : ''}</button>
                  <span style={{ flex: 1, fontSize: 13, textDecoration: g.done ? 'line-through' : 'none', color: g.done ? '#9a9081' : '#3d3830' }}>{g.text}</span>
                  <span style={{ fontSize: 10, color: '#8a6d3b', fontWeight: 700 }}>{g.period === 'short' ? '단기' : '장기'}</span>
                </div>
                {/* 목표-진단-습관 연결 */}
                {goalLinks(g.text, results, habits).map((link, li) => (
                  <div key={li} style={{ fontSize: 10, color: '#7a7060', marginTop: 6, paddingLeft: 30 }}>
                    {link}
                  </div>
                ))}
              </div>
            ))}
            {goals.length === 0 && <div style={{ fontSize: 12, color: '#9a9081', textAlign: 'center', padding: 16 }}>목표를 추가해보세요</div>}
          </div>
        </div>

        {/* 습관 트래커 */}
        <div style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>✅ 습관 트래커</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={habitName}
              onChange={e => setHabitName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
              placeholder="새 습관 (예: 30분 독서)"
              style={{ flex: 1, padding: '9px 14px', borderRadius: 6, background: '#fffdf8', border: '1px solid #ddd3c2', color: '#2b2620', fontSize: 13 }}
            />
            <button onClick={addHabit} style={{ padding: '9px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#faf7f2', background: '#2b2620' }}>추가</button>
            <button
              onClick={useShield}
              disabled={shieldUsed}
              title="이번 주 리셋 시 체크 유지 (주 1회)"
              style={{
                padding: '9px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: shieldUsed ? 'not-allowed' : 'pointer',
                background: shieldUsed ? 'rgba(138,109,59,0.08)' : 'rgba(138,109,59,0.12)',
                border: '1px solid ' + (shieldUsed ? 'rgba(138,109,59,0.2)' : 'rgba(138,109,59,0.4)'),
                color: shieldUsed ? '#9a9081' : '#8a6d3b', whiteSpace: 'nowrap',
              }}
            >
              🛡️ {shieldUsed ? '보호권 사용함' : '보호권 사용'}
            </button>
            <button
              onClick={() => { if (confirm('이번 주 체크를 모두 초기화할까요? (새 주 시작 시 사용)')) saveHabits(habits.map(h => ({ ...h, days: [] }))); }}
              title="주간 리셋"
              style={{ padding: '9px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: '#fffdf8', border: '1px solid #ddd3c2', color: '#7a7060', whiteSpace: 'nowrap' }}
            >
              🔄 주간 리셋
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {habits.map(h => (
              <div key={h.id} style={{ padding: '10px 12px', background: '#f0e9dc', borderRadius: 10, border: '1px solid #e5ded2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{h.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                    background: h.days.length >= 4 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)',
                    border: '1px solid ' + (h.days.length >= 4 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'),
                    color: h.days.length >= 4 ? '#dc2626' : '#15803d',
                  }}>
                    🔥 이번 주 {h.days.length}일
                  </span>
                  <button onClick={() => removeHabit(h.id)} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626' }}>삭제</button>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {WEEK.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDay(h.id, d)}
                      style={{
                        width: 30, height: 30, borderRadius: 8, fontSize: 11, cursor: 'pointer', border: '1px solid #ddd3c2',
                        background: h.days.includes(d) ? '#10b981' : 'transparent', color: h.days.includes(d) ? '#fff' : '#9a9081',
                        fontWeight: 700,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {habits.length === 0 && <div style={{ fontSize: 12, color: '#9a9081', textAlign: 'center', padding: 16 }}>습관을 추가하고 매일 체크하세요</div>}
          </div>
        </div>
      </div>

      {/* 진단 기반 추천 */}
      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(138,109,59,0.25)', borderRadius: 16, padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', color: '#8a6d3b' }}>✨ 진단 기반 추천 목표</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {suggestedGoals.map((g, i) => (
            <span key={i} style={{ padding: '8px 14px', borderRadius: 999, background: 'rgba(138,109,59,0.1)', border: '1px solid rgba(138,109,59,0.3)', color: '#6b6355', fontSize: 12, fontWeight: 600 }}>{g}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 목표-진단-습관 연결 (키워드 기반) ---------- */
function goalLinks(text: string, results: DiagnosisRecord[], habits: { id: number; name: string; days: string[] }[]): string[] {
  const links: string[] = [];
  const doneSites = new Set(results.map(r => r.site));
  const has = (kw: string[]) => kw.some(k => text.includes(k));

  if (has(['관계', '연애', '가족', '친구', '소통'])) {
    links.push('🧩 근거 진단: 애착 유형 진단' + (doneSites.has('attachment-style-radar') ? ' (완료 ✓)' : ''));
  }
  if (has(['커리어', '직장', '이직', '일', '승진', '취업'])) {
    links.push('🧩 근거 진단: MZ 직장 DNA' + (doneSites.has('mz-radar') ? ' (완료 ✓)' : ''));
  }
  if (has(['수면', '잠'])) {
    links.push('🧩 근거 진단: 수면 위생 진단' + (doneSites.has('sleep-hygiene-radar') ? ' (완료 ✓)' : ''));
  }
  if (has(['운동', '건강', '체력'])) {
    links.push('🧩 근거 진단: 운동 마인드셋' + (doneSites.has('fitness-mindset-radar') ? ' (완료 ✓)' : ''));
  }
  if (has(['미루', '집중', '공부', '습관'])) {
    links.push('🧩 근거 진단: 미루기 습관 진단' + (doneSites.has('procrastination-radar') ? ' (완료 ✓)' : ''));
  }
  // 관련 습관
  const habitNames = habits.map(h => h.name).join(' ');
  if (has(['수면', '잠']) && !habitNames.includes('수면')) links.push('✅ 연결 습관: "밤 12시 취침" 습관을 추가해보세요');
  if (has(['운동', '건강']) && !habitNames.includes('운동')) links.push('✅ 연결 습관: "하루 30분 걷기" 습관을 추가해보세요');
  if (has(['공부', '독서']) && !habitNames.includes('독서')) links.push('✅ 연결 습관: "30분 독서" 습관을 추가해보세요');
  return links.slice(0, 2);
}

/* ---------- 분기 성장 맵 (클리어 체크리스트) ---------- */
function QuarterMap({ goals, results, habits }: {
  goals: { id: number; text: string; done: boolean }[];
  results: DiagnosisRecord[];
  habits: { id: number; name: string; days: string[] }[];
}) {
  const quarter = Math.floor(new Date().getMonth() / 3) + 1;

  // 체크리스트 항목 (자동 판정)
  const items = [
    { id: 'g1', label: '목표 1개 완료', auto: goals.filter(g => g.done).length >= 1 },
    { id: 'g3', label: '목표 3개 설정', auto: goals.length >= 3 },
    { id: 'r1', label: '재진단 1회 (같은 진단 2번째)', auto: results.length >= 8 },
    { id: 'r2', label: '다른 축 진단 1개', auto: results.length >= 4 },
    { id: 'h1', label: '습관 1개 4주 유지', auto: habits.some(h => h.days.length >= 10) },
    { id: 's1', label: '결과 공유 1회', auto: results.some(r => r.shared) },
  ];

  const doneCount = items.filter(i => i.auto).length;
  const allDone = doneCount === items.length;

  return (
    <div style={{
      background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 12, padding: 20, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#8a6d3b', fontWeight: 800, textTransform: 'uppercase' }}>
          {quarter}분기 성장 맵
        </div>
        <div style={{ flex: 1, height: 1, background: '#e5ded2' }} />
        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(138,109,59,0.08)', border: '1px solid rgba(138,109,59,0.3)', color: '#8a6d3b' }}>
          {doneCount}/{items.length}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#7a7060', marginBottom: 10 }}>
        {allDone ? '🎉 분기 목표 완료! 성장의 한 장을 넘겼어요.' : '분기가 끝나기 전에, 이 6개의 체크를 채워보세요.'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
            background: item.auto ? 'rgba(138,109,59,0.08)' : '#f7f2e9',
            border: '1px solid ' + (item.auto ? 'rgba(138,109,59,0.3)' : '#ece4d5'),
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800,
              background: item.auto ? '#8a6d3b' : 'transparent', border: '1.5px solid ' + (item.auto ? '#8a6d3b' : '#c9bda8'),
              color: '#fff', flexShrink: 0,
            }}>
              {item.auto ? '✓' : ''}
            </span>
            <span style={{ fontSize: 12, color: item.auto ? '#5a5245' : '#3d3830' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 주간 챌린지 ---------- */
function WeeklyChallenge({ habits, results, onGoDiagnosis }: {
  habits: { id: number; name: string; days: string[] }[];
  results: DiagnosisRecord[];
  onGoDiagnosis: () => void;
}) {
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      const d = JSON.parse(localStorage.getItem('alljindan_challenge') || '{}');
      const week = Math.floor(Date.now() / (7 * 86400000));
      return d && d.week === week ? d.done : {};
    } catch { return {}; }
  });

  const missions = [
    { id: 'habit4', label: '이번 주 습관 체크 4회', check: () => habits.reduce((a, h) => a + h.days.length, 0) >= 4 },
    { id: 'diag1', label: '진단 1개 새로 기록', check: () => {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      return results.filter(r => new Date(r.date) >= weekAgo).length >= 1;
    } },
    { id: 'reflect', label: '성찰 질문에 답하기', check: () => {
      try { return !!localStorage.getItem('alljindan_reflection_' + new Date().toISOString().slice(0, 10)); } catch { return false; }
    } },
  ];

  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    const week = Math.floor(Date.now() / (7 * 86400000));
    localStorage.setItem('alljindan_challenge', JSON.stringify({ week, done: next }));
  };

  const completed = missions.filter(m => done[m.id]).length;
  const allDone = completed === missions.length;

  return (
    <div style={{
      background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 12, padding: 20, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#8a6d3b', fontWeight: 800, textTransform: 'uppercase' }}>
          이번 주 챌린지
        </div>
        <div style={{ flex: 1, height: 1, background: '#e5ded2' }} />
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
          background: allDone ? 'rgba(138,109,59,0.15)' : 'rgba(138,109,59,0.08)',
          border: '1px solid rgba(138,109,59,0.3)', color: '#8a6d3b',
        }}>
          {completed}/{missions.length}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#7a7060', marginBottom: 10 }}>
        {allDone ? '🎉 이번 주 챌린지 완료! 작은 습관이 모여 큰 변화가 됩니다.' : '가벼운 미션 3개를 완료해보세요.'}
      </div>
      {missions.map(m => {
        const auto = m.check();
        const isDone = done[m.id] || auto;
        return (
          <button
            key={m.id}
            onClick={() => toggle(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', marginBottom: 6,
              borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              background: isDone ? 'rgba(138,109,59,0.08)' : '#f7f2e9',
              border: '1px solid ' + (isDone ? 'rgba(138,109,59,0.3)' : '#ece4d5'),
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              background: isDone ? '#8a6d3b' : 'transparent', border: '1.5px solid ' + (isDone ? '#8a6d3b' : '#c9bda8'),
              color: '#fff', flexShrink: 0,
            }}>
              {isDone ? '✓' : ''}
            </span>
            <span style={{ fontSize: 13, color: isDone ? '#5a5245' : '#3d3830' }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- 주간 리포트 ---------- */
function WeeklyReport({ results }: { results: DiagnosisRecord[] }) {
  const [report, setReport] = useState<{ stats?: { diagnoses: number; comments: number; likes: number; shared: number }; message?: string } | null>(null);
  const [coach, setCoach] = useState<{ interpretation?: string; keep?: string; reduce?: string; miniGoal?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    import('../api').then(({ api, getToken }) => {
      const hasToken = !!getToken();
      setIsLoggedIn(hasToken);
      if (hasToken) {
        api.weeklyReport().then(d => {
          setReport(d);
          setLoading(false);
        }).catch(() => { setReport(null); setLoading(false); });
        api.coach().then(d => {
          setCoach(d.briefing || null);
        }).catch(() => {});
      } else {
        setLoading(false);
      }
    });
  }, []);

  // 비로그인: 로컬 기반 주간 요약
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekResults = results.filter(r => new Date(r.date) >= weekAgo);

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(138,109,59,0.1),rgba(138,109,59,0.1))',
      border: '1px solid rgba(138,109,59,0.3)', borderRadius: 16, padding: 20, marginBottom: 16,
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 8px' }}>📬 이번 주 리포트</h2>
      {loading ? (
        <div style={{ fontSize: 12, color: '#9a9081' }}>로딩 중...</div>
      ) : isLoggedIn && report?.stats ? (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            {[
              { label: '진단', value: report.stats.diagnoses },
              { label: '댓글', value: report.stats.comments },
              { label: '좋아요', value: report.stats.likes },
              { label: '공유', value: report.stats.shared },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: 60, textAlign: 'center', background: 'rgba(15,23,42,0.5)', borderRadius: 10, padding: '10px 6px' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#8a6d3b' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#9a9081' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#6b6355' }}>{report.message}</div>
          {/* 주간 코치 브리핑 */}
          {coach && (
            <div style={{ marginTop: 12, padding: '14px 16px', background: '#f7f2e9', border: '1px solid #ece4d5', borderRadius: 10 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, color: '#8a6d3b', textTransform: 'uppercase', marginBottom: 8 }}>
                🧑‍🏫 이번 주 코치 브리핑
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.7, marginBottom: 8 }}>{coach.interpretation}</div>
              <div style={{ fontSize: 12, color: '#5a5245', lineHeight: 1.9 }}>
                <div>✅ <strong>유지할 것:</strong> {coach.keep}</div>
                <div>➖ <strong>줄일 것:</strong> {coach.reduce}</div>
                <div>🎯 <strong>미니 목표:</strong> {coach.miniGoal}</div>
              </div>
            </div>
          )}
          {/* 성찰 프롬프트 */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, color: '#8a6d3b', textTransform: 'uppercase', marginBottom: 8 }}>
              📝 이번 주 성찰 질문
            </div>
            <div style={{ fontSize: 13, color: '#3d3830', lineHeight: 1.8, fontFamily: "'Noto Serif KR',serif" }}>
              "이번 주, 관계에서 가장 에너지를 쓴 순간은 언제였나요?"
            </div>
            <div style={{ fontSize: 11, color: '#7a7060', marginTop: 4 }}>주간 리포트는 개인 기록으로 저장됩니다.</div>
          </div>
          {/* 최근 진단 기반 미니 팁 */}
          {results[0] && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#fffdf8', border: '1px solid #ece4d5', borderRadius: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: 1, fontWeight: 800, color: '#8a6d3b', textTransform: 'uppercase', marginBottom: 6 }}>
                🧩 최근 진단 기준 미니 팁
              </div>
              <div style={{ fontSize: 12, color: '#5a5245', lineHeight: 1.7 }}>
                "{results[0].title}"에서 <strong style={{ color: '#8a6d3b' }}>{results[0].result}</strong> 결과를 기록했어요.{' '}
                {results[0].score !== undefined && results[0].score >= 70
                  ? '높은 점수는 에너지의 신호예요. 이 강점을 이번 주 목표 1개에 연결해보세요.'
                  : results[0].score !== undefined && results[0].score <= 40
                  ? '낮은 점수는 부족함이 아니라 우선순위예요. 작은 실천 1개부터 시작해보세요.'
                  : '이 결과를 바탕으로, 이번 주 실천할 작은 행동 1개를 정해보세요.'}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#9a9081', lineHeight: 1.7 }}>
          {weekResults.length > 0
            ? <>이번 주 진단 <strong style={{ color: '#8a6d3b' }}>{weekResults.length}개</strong> 기록! 꾸준함이 힘입니다 💪 <br />로그인하면 상세 리포트를 받을 수 있어요.</>
            : <>이번 주에는 아직 진단 기록이 없어요. 5분이면 하나 받을 수 있어요! 🧩 <br />로그인하면 상세 리포트가 제공됩니다.</>}
        </div>
      )}
    </div>
  );
}
