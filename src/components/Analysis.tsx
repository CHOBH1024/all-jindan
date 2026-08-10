import type { DiagnosisRecord } from '../App';

interface Props {
  results: DiagnosisRecord[];
  onGoDiagnosis: () => void;
}

// 사이트 → 4축 매핑 (성격/커리어/관계/습관)
const AXIS_MAP: Record<string, string[]> = {
  '성격·심리': ['personality'],
  '일·커리어': ['career'],
  '건강·습관': ['habit'],
  '기타': ['personality'],
};

const AXIS_NAMES = ['성격', '커리어', '관계', '습관'];
const CAT_TO_AXIS: Record<string, number> = { '성격·심리': 0, '일·커리어': 1, '건강·습관': 3, '기타': 0 };

export function Analysis({ results, onGoDiagnosis }: Props) {
  if (results.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🧬</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>통합 분석을 시작하려면 진단이 필요해요</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>진단 3개 이상 기록하면 종합 프로필이 완성됩니다.</p>
        <button
          onClick={onGoDiagnosis}
          style={{ padding: '12px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          진단하러 가기 →
        </button>
      </div>
    );
  }

  // 4축 점수 계산 (기록 수 기반 + 점수 있으면 반영)
  const axisScores = [0, 0, 0, 0];
  const axisCounts = [0, 0, 0, 0];
  for (const r of results) {
    const ax = CAT_TO_AXIS[catOf(r.title)] ?? 0;
    axisCounts[ax]++;
    axisScores[ax] += r.score ?? 70;
  }
  const scores = axisScores.map((s, i) => axisCounts[i] > 0 ? Math.min(100, Math.round(s / axisCounts[i])) : 0);
  const hasAxis = axisCounts.some(c => c > 0);

  // 종합 성격 요약 (가장 많은 카테고리 + 최근 결과 기반)
  const catCounts: Record<string, number> = {};
  for (const r of results) {
    const c = catOf(r.title);
    catCounts[c] = (catCounts[c] || 0) + 1;
  }
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
  const topResults = [...results].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const strengths = generateStrengths(results);
  const warnings = generateWarnings(results);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>🧬 통합 분석</h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>{results.length}개의 진단을 종합한 "지금의 나"</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        {/* 4축 레이더 (간이 차트) */}
        <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px' }}>4축 종합 레이더</h2>
          {hasAxis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {AXIS_NAMES.map((name, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{name}</span>
                    <span style={{ color: '#818cf8', fontWeight: 800 }}>{scores[i] > 0 ? scores[i] : '미측정'}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(51,65,85,0.5)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${scores[i]}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 999, transition: 'width .5s' }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {axisCounts[0] > 0 && `성격 ${axisCounts[0]}개 · `}{axisCounts[1] > 0 && `커리어 ${axisCounts[1]}개 · `}{axisCounts[3] > 0 && `습관 ${axisCounts[3]}개`}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#64748b' }}>진단을 더 기록하면 레이더가 채워집니다.</div>
          )}
        </div>

        {/* 종합 프로필 */}
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>나의 종합 프로필</h2>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8 }}>
            <p style={{ margin: '0 0 8px' }}>
              당신은 <strong style={{ color: '#a5b4fc' }}>{topCat ? topCat[0] : '다양한'} 영역</strong>에서 가장 많은 진단을 받았어요.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              최근 결과: {topResults.map((r, i) => <span key={i}>{r.emoji} {r.result}{i < topResults.length - 1 ? ', ' : ''}</span>)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              진단을 더 많이 기록할수록, 이 프로필은 당신을 더 정확히 그려냅니다.
            </p>
          </div>
        </div>
      </div>

      {/* 강점 / 주의점 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginTop: 16 }}>
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', color: '#34d399' }}>💪 종합 강점</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#cbd5e1', lineHeight: 2 }}>
            {strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', color: '#fbbf24' }}>⚠️ 주의 포인트</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#cbd5e1', lineHeight: 2 }}>
            {warnings.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function catOf(title: string): string {
  const t = title;
  if (t.includes('리더') || t.includes('커리어') || t.includes('직장') || t.includes('업무') || t.includes('프롬프트') || t.includes('코드') || t.includes('딥워크') || t.includes('부업') || t.includes('사이드')) return '일·커리어';
  if (t.includes('수면') || t.includes('번아웃') || t.includes('카페인') || t.includes('운동') || t.includes('디톡스') || t.includes('휴식') || t.includes('마음챙김') || t.includes('기분') || t.includes('육아') || t.includes('성취')) return '건강·습관';
  if (t.includes('애착') || t.includes('갈등') || t.includes('논쟁') || t.includes('주장') || t.includes('내향') || t.includes('공감') || t.includes('네트워킹')) return '관계';
  return '성격·심리';
}

function generateStrengths(results: DiagnosisRecord[]): string[] {
  const s: string[] = [];
  if (results.some(r => r.title.includes('수면') || r.title.includes('습관'))) s.push('자기관리 습관에 관심이 많아요 — 꾸준함의 기반이 있어요');
  if (results.some(r => r.title.includes('번아웃') || r.title.includes('스트레스'))) s.push('스트레스 신호를 인지하는 능력이 뛰어나요');
  if (results.some(r => r.title.includes('커리어') || r.title.includes('직장') || r.title.includes('리더'))) s.push('커리어 성장에 대한 진지한 고민이 있어요');
  if (results.some(r => r.title.includes('애착') || r.title.includes('관계'))) s.push('관계의 질을 소중히 여겨요');
  if (s.length === 0) s.push('자기 이해에 대한 높은 관심 — 이미 성장의 첫걸음을 뗐어요');
  return s.slice(0, 3);
}

function generateWarnings(results: DiagnosisRecord[]): string[] {
  const w: string[] = [];
  if (results.some(r => r.title.includes('번아웃')) && results.some(r => r.title.includes('수면'))) w.push('번아웃 + 수면 신호가 함께 보여요 — 휴식 루틴이 필요해요');
  if (results.some(r => r.title.includes('미루기') || r.title.includes('결정'))) w.push('실행 전 고민이 길어질 때가 있어요 — 작게 시작해보세요');
  if (results.some(r => r.title.includes('완벽'))) w.push('완벽주의 성향 — "완료"가 "완벽"보다 중요할 때가 있어요');
  if (w.length === 0) w.push('현재 기록만으로는 특별한 위험 신호가 없어요 — 진단을 늘려 더 정확히 볼 수 있어요');
  return w.slice(0, 3);
}
