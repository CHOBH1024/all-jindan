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
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0e9dc', borderRadius: 10, border: '1px solid #e5ded2' }}>
                <button onClick={() => toggleGoal(g.id)} style={{ width: 20, height: 20, borderRadius: 6, border: '1px solid #475569', cursor: 'pointer', background: g.done ? '#10b981' : 'transparent', color: '#fff', fontSize: 11 }}>{g.done ? '✓' : ''}</button>
                <span style={{ flex: 1, fontSize: 13, textDecoration: g.done ? 'line-through' : 'none', color: g.done ? '#9a9081' : '#3d3830' }}>{g.text}</span>
                <span style={{ fontSize: 10, color: g.period === 'short' ? '#38bdf8' : '#a78bfa', fontWeight: 700 }}>{g.period === 'short' ? '단기' : '장기'}</span>
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
              style={{ flex: 1, padding: '9px 14px', borderRadius: 10, background: '#f0e9dc', border: '1px solid #ddd3c2', color: '#3d3830', fontSize: 13 }}
            />
            <button onClick={addHabit} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#fff', background: '#2b2620' }}>추가</button>
            <button
              onClick={() => { if (confirm('이번 주 체크를 모두 초기화할까요? (새 주 시작 시 사용)')) saveHabits(habits.map(h => ({ ...h, days: [] }))); }}
              title="주간 리셋"
              style={{ padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(240,233,220,0.9)', border: '1px solid #ddd3c2', color: '#9a9081', whiteSpace: 'nowrap' }}
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

/* ---------- 주간 리포트 ---------- */
function WeeklyReport({ results }: { results: DiagnosisRecord[] }) {
  const [report, setReport] = useState<{ stats?: { diagnoses: number; comments: number; likes: number; shared: number }; message?: string } | null>(null);
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
