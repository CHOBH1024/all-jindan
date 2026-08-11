import { useState } from 'react';
import type { DiagnosisRecord } from '../App';
import { ShareCardModal } from './ShareCardModal';

interface Props {
  results: DiagnosisRecord[];
  onGoDiagnosis: () => void;
}

// 사이트 → 4축 매핑 (성격/커리어/관계/습관)
const AXIS_MAP: Record<string, string> = {
"adhd-focus-radar": "습관",
  "ai-readiness-radar": "커리어",
  "attachment-style-radar": "관계",
  "burnout-prevention-radar": "커리어",
  "burnout-recovery-radar": "습관",
  "caffeine-dependency-radar": "습관",
  "caffeine-half-life-clock": "습관",
  "crypto-fomo-radar": "성격",
  "defensiveness-radar": "관계",
  "digital-detox-radar": "습관",
  "empathy-fatigue-radar": "관계",
  "financial-anxiety-radar": "습관",
  "fitness-mindset-radar": "습관",
  "introvert-charm-radar": "성격",
  "mindfulness-zen-radar": "습관",
  "networking-battery-radar": "관계",
  "notion-obsessive-radar": "커리어",
  "perfectionism-radar": "성격",
  "persona-mask-radar": "성격",
  "procrastination-radar": "습관",
  "reward-spending-radar": "습관",
  "runway-calculator": "커리어",
  "sleep-hygiene-radar": "습관",
  "subscription-fatigue-radar": "습관",
  "argument-recovery-radar": "관계",
  "assertion-style-radar": "관계",
  "async-work-radar": "커리어",
  "FIRE-readiness-radar": "커리어",
  "digital-sovereignty-fit": "커리어",
  "side-hustle-fit": "커리어",
  "imposter-syndrome-radar": "성격",
  "leadership-archetype": "커리어",
  "conflict-style-radar": "관계",
  "decision-paralysis-radar": "습관",
  "grit-focus-radar": "커리어",
  "micro-achievement-journal": "커리어",
  "micro-break-routine": "커리어",
  "deep-work-battery": "습관",
  "code-review-roulette": "커리어",
  "prompt-efficiency-score": "커리어",
  "meeting-cost-clock": "커리어",
  "regret-spending-log": "습관",
  "subtle-sabotage-test": "습관",
  "async-readiness-index": "커리어",
  "hyper-automation-tower": "커리어",
  "mz-radar": "커리어",
  "genius-radar": "성격",
  "fx-radar": "성격",
  "mood-weather": "성격",
  "burnout-radar": "커리어",
  "money-radar": "습관",
  "side-hustle-radar": "커리어",
  "true-hourly-rate": "커리어",
  "control-tower": "커리어",
  "harness-report": "성격",
  "jeongbu": "성격",
  "jikjang": "커리어",
  "serverguchuk1024": "커리어",
  "ilban-leadership-site": "커리어",
  "sinang-inside": "성격",
  "sibiljo": "커리어",
  "regulation-hub": "커리어",
  "make-it-mine-35": "습관",
  "Gajeong": "관계",
  "juganbogo3": "커리어",
  "juganbogo4": "커리어",
  "SOMOPUMGWANRI": "성격",
  "MIRRIOR-APP": "성격",
  "dowajoyo": "커리어",
  "trend-dashboard": "성격",
  "FocusFlow1024": "습관",
  "aikiugihimdulda": "관계",
  "MindPrism1024": "성격",
  "chotan": "성격",
  "ilban-leadership": "커리어",
  "tongHAP": "성격",
};

const CAT_TO_AXIS: Record<string, number> = { '성격·심리': 0, '일·커리어': 1, '건강·습관': 3, '기타': 0 };
const AXIS_NAMES = ['성격', '커리어', '관계', '습관'];

export function getAxis(site: string, category: string): number {
  const axis = AXIS_MAP[site];
  if (axis === '관계') return 2;
  if (axis === '커리어') return 1;
  if (axis === '습관') return 3;
  if (axis === '성격') return 0;
  return CAT_TO_AXIS[category] ?? 0;
}

export function Analysis({ results, onGoDiagnosis }: Props) {
  const [showShare, setShowShare] = useState(false);
  if (results.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🧬</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>통합 분석을 시작하려면 진단이 필요해요</h1>
        <p style={{ fontSize: 13, color: '#9a9081', margin: '0 0 20px' }}>진단 3개 이상 기록하면 종합 프로필이 완성됩니다.</p>
        <button
          onClick={onGoDiagnosis}
          style={{ padding: '12px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#fff', background: '#2b2620' }}
        >
          진단하러 가기 →
        </button>
      </div>
    );
  }

  // 4축 점수 계산 (사이트별 정밀 매핑 — 기록 수 기반 + 점수 있으면 반영)
  const axisScores = [0, 0, 0, 0];
  const axisCounts = [0, 0, 0, 0];
  for (const r of results) {
    const ax = getAxis(r.site, catOf(r.title));
    axisCounts[ax]++;
    axisScores[ax] += r.score ?? 70;
  }
  const scores = axisScores.map((s, i) => axisCounts[i] > 0 ? Math.min(100, Math.round(s / axisCounts[i])) : 0);
  const hasAxis = axisCounts.some(c => c > 0);
  const fullAxes = axisCounts.filter(c => c > 0).length;
  const balanced = fullAxes === 4;

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
  const conflicts = generateConflicts(scores, axisCounts);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>🧬 통합 분석</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#6b6355', margin: 0, flex: 1 }}>{results.length}개의 진단을 종합한 "지금의 나"</p>
        {balanced && (
          <span style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800,
            background: 'linear-gradient(135deg,#c9a867,#a8853f)', color: '#fff',
            boxShadow: '0 2px 10px rgba(201,168,103,0.35)',
          }}>
            🏅 균형 프로필 — 4축 완성
          </span>
        )}
        {!balanced && fullAxes > 0 && (
          <span style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: 'rgba(138,109,59,0.1)', border: '1px solid rgba(138,109,59,0.3)', color: '#8a6d3b',
          }}>
            {fullAxes}/4 축 완성
          </span>
        )}
        {results.length > 0 && (
          <button
            onClick={() => setShowShare(true)}
            style={{
              padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer',
              background: 'rgba(138,109,59,0.1)', border: '1px solid rgba(138,109,59,0.3)', color: '#8a6d3b', whiteSpace: 'nowrap',
            }}
          >
            📤 공유 카드 만들기
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        {/* 4축 레이더 (간이 차트) */}
        <div style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px' }}>4축 종합 레이더</h2>
          {hasAxis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {AXIS_NAMES.map((name, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{name}</span>
                    <span style={{ color: '#8a6d3b', fontWeight: 800 }}>{scores[i] > 0 ? scores[i] : '미측정'}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(51,65,85,0.5)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${scores[i]}%`, background: '#8a6d3b', borderRadius: 999, transition: 'width .5s' }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#7a7060', marginTop: 4 }}>
                {axisCounts[0] > 0 && `성격 ${axisCounts[0]}개 · `}{axisCounts[1] > 0 && `커리어 ${axisCounts[1]}개 · `}{axisCounts[3] > 0 && `습관 ${axisCounts[3]}개`}
              </div>
              {/* 빈 축 CTA */}
              {axisCounts.some(c => c === 0) && (
                <button
                  onClick={onGoDiagnosis}
                  style={{
                    marginTop: 12, padding: '10px 0', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: '#f7f2e9', border: '1px solid #e5ded2', color: '#8a6d3b',
                  }}
                >
                  {AXIS_NAMES.filter((_, i) => axisCounts[i] === 0).map(n => n).join('·')} 축 진단하러 가기 →
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#9a9081' }}>진단을 더 기록하면 레이더가 채워집니다.</div>
          )}
        </div>

        {/* 종합 프로필 */}
        <div style={{ background: 'linear-gradient(135deg,rgba(138,109,59,0.1),rgba(139,92,246,0.08))', border: '1px solid rgba(138,109,59,0.3)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>나의 종합 프로필</h2>
          <div style={{ fontSize: 13, color: '#6b6355', lineHeight: 1.8 }}>
            <p style={{ margin: '0 0 8px' }}>
              당신은 <strong style={{ color: '#8a6d3b' }}>{topCat ? topCat[0] : '다양한'} 영역</strong>에서 가장 많은 진단을 받았어요.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              최근 결과: {topResults.map((r, i) => <span key={i}>{r.emoji} {r.result}{i < topResults.length - 1 ? ', ' : ''}</span>)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#9a9081' }}>
              진단을 더 많이 기록할수록, 이 프로필은 당신을 더 정확히 그려냅니다.
              <div style={{ fontSize: 10, color: '#7a7060', marginTop: 8, lineHeight: 1.6 }}>
                * 본 분석은 자기이해를 위한 참고 자료이며, 의학적·임상적 진단을 대체하지 않습니다.
              </div>
            </p>
          </div>
        </div>
      </div>

      {/* 강점 / 주의점 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginTop: 16 }}>
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', color: '#15803d' }}>💪 종합 강점</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#6b6355', lineHeight: 2 }}>
            {strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 10px', color: '#fbbf24' }}>⚠️ 주의 포인트</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#6b6355', lineHeight: 2 }}>
            {warnings.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      {/* 축 간 충돌 인사이트 */}
      {conflicts.length > 0 && (
        <div style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 16, padding: 20, marginTop: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px' }}>⚡ 축 간 인사이트</h2>
          <p style={{ fontSize: 11, color: '#7a7060', margin: '0 0 12px' }}>서로 다른 영역의 점수가 만드는 독특한 패턴</p>
          {conflicts.map((c, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: 10, marginBottom: 8,
              background: '#f7f2e9', border: '1px solid #ece4d5', fontSize: 13, lineHeight: 1.7,
            }}>
              <strong style={{ color: '#8a6d3b' }}>{c.title}</strong>
              <div style={{ fontSize: 12, color: '#5a5245', marginTop: 4 }}>{c.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* 재진단 변화 추이 */}
      <TrendChart results={results} />

      {showShare && <ShareCardModal results={results} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function TrendChart({ results }: { results: DiagnosisRecord[] }) {
  // 같은 제목(사이트)의 재진단 기록 찾기 — 2개 이상이면 그래프
  const byTitle = new Map<string, DiagnosisRecord[]>();
  for (const r of results) {
    if (r.score === undefined) continue;
    const list = byTitle.get(r.title) || [];
    list.push(r);
    byTitle.set(r.title, list);
  }
  const trends = [...byTitle.entries()].filter(([, list]) => list.length >= 2).sort((a, b) => b[1].length - a[1].length);

  if (trends.length === 0) return null;

  return (
    <div style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 16, padding: 20, marginTop: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px' }}>📈 재진단 변화 추이</h2>
      <p style={{ fontSize: 11, color: '#9a9081', margin: '0 0 16px' }}>같은 진단을 다시 받으면 변화를 그래프로 볼 수 있어요</p>
      {trends.map(([title, list]) => {
        const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
        const max = Math.max(...sorted.map(s => s.score || 0), 100);
        return (
          <div key={title} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              {sorted[0].emoji} {title}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, padding: '0 4px' }}>
              {sorted.map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#8a6d3b' }}>{s.score}</div>
                  <div style={{
                    width: '100%', maxWidth: 50, height: Math.max(8, ((s.score || 0) / max) * 60), borderRadius: '6px 6px 2px 2px',
                    background: '#2b2620', transition: 'height .5s',
                  }} />
                  <div style={{ fontSize: 9, color: '#9a9081' }}>{s.date.slice(5)}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#9a9081', marginTop: 6 }}>
              {sorted.length >= 2 && (sorted[sorted.length - 1].score || 0) > (sorted[0].score || 0)
                ? `📈 ${sorted[0].score}점 → ${sorted[sorted.length - 1].score}점 (${sorted[sorted.length - 1].score! - sorted[0].score!}점 상승!)`
                : `📉 ${sorted[0].score}점 → ${sorted[sorted.length - 1].score}점`}
            </div>
          </div>
        );
      })}
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

/* ---------- 종합 프로필 공유 (navigator.share + 클립보드) ---------- */
export async function shareProfile(results: DiagnosisRecord[]) {
  const top = results.slice(0, 5);
  const lines = top.map(r => `${r.emoji} ${r.title}: ${r.result}${r.score !== undefined ? ` (${r.score}점)` : ''}`);
  const text = [
    '🧬 나는 어떤 사람인가 — 올진단 종합 프로필',
    '',
    ...lines,
    '',
    `${results.length}개 진단을 통합 분석했어요`,
    '👉 all-jindan.pomyjo.com 에서 나도 받아보기',
  ].join('\n');
  const url = 'https://all-jindan.pomyjo.com/';
  try {
    if (navigator.share) {
      await navigator.share({ title: '올진단 종합 프로필', text, url });
      return;
    }
  } catch {}
  try {
    await navigator.clipboard.writeText(text + '\n' + url);
    alert('📋 종합 프로필이 복사되었습니다! (붙여넣어 공유하세요)');
  } catch {
    window.open('https://x.com/intent/post?text=' + encodeURIComponent(text + '\n' + url), '_blank');
      }
    }

    /* ---------- 축 간 충돌 인사이트 (규칙 기반) ---------- */
    function generateConflicts(scores: number[], axisCounts: number[]) {
      const out: { title: string; text: string }[] = [];
      const has = (i: number) => axisCounts[i] > 0;
      const high = (i: number) => has(i) && scores[i] >= 70;
      const low = (i: number) => has(i) && scores[i] <= 40;
      const names = ['성격', '커리어', '관계', '습관'];

      // 관계↑ + 습관↓
      if (high(2) && low(3)) {
        out.push({ title: '관계 에너지는 높은데, 자기관리가 낮아요', text: '타인을 향한 관심과 에너지는 풍부하지만, 자신을 돌보는 시간이 부족할 수 있어요. 관계에 쓰는 만큼의 휴식과 루틴이 필요합니다.' });
      }
      // 커리어↑ + 관계↓
      if (high(1) && low(2)) {
        out.push({ title: '커리어 집중이 관계를 압박하고 있어요', text: '일적 성취에 몰입하는 동안 가까운 사람들과의 연결이 소홀해지기 쉬워요. 주 1회 의미 있는 대화를 의도적으로 만들어보세요.' });
      }
      // 습관↑ + 성격(자기이해)↓
      if (high(3) && low(0)) {
        out.push({ title: '습관은 잘 지키는데, 내면 탐구는 부족해요', text: '규칙적인 생활은 훌륭하지만, 자기 자신에 대한 이해를 위한 진단이 아직 적어요. 성격·심리 영역의 진단으로 균형을 맞춰보세요.' });
      }
      // 커리어↑ + 습관↓
      if (high(1) && low(3)) {
        out.push({ title: '일은 열심히 하는데, 몸이 따라주지 못할 때', text: '커리어에 쏟는 에너지가 수면·운동·휴식 같은 기초 습관을 압박하고 있어요. 하루 7시간 수면을 최우선 목표로 삼아보세요.' });
      }
      // 관계↑ + 커리어↓
      if (high(2) && low(1)) {
        out.push({ title: '관계에서는 활발하지만, 커리어 방향이 흐릿해요', text: '사람과의 연결에서는 에너지를 얻지만, 직업적 방향에 대한 확신이 낮아요. 커리어 영역 진단으로 방향을 잡아보세요.' });
      }
      return out.slice(0, 3);
    }
