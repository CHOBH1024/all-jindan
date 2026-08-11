import { SITES } from '../data';
import { getAxis } from './Analysis';
import type { DiagnosisRecord } from '../App';

interface Props {
  results: DiagnosisRecord[];
  onGoDiagnosis: () => void;
}

// 추천 진단 엔진 — 빈 축 우선, 미완료, 최근성 기반
export function Recommend({ results, onGoDiagnosis }: Props) {
  if (results.length >= 20) return null;

  const doneSites = new Set(results.map(r => r.site));
  const axisCounts = [0, 0, 0, 0];
  const recentBySite = new Map<string, string>();
  results.forEach(r => {
    const ax = getAxis(r.site, '');
    axisCounts[ax]++;
    recentBySite.set(r.site, r.date);
  });

  // 점수화: 빈 축 +3, 적은 축 +2, 미완료 +2, 최근에 안 함 +1
  const scored = SITES.filter(s => !doneSites.has(s.name)).map(s => {
    const ax = getAxis(s.name, s.category);
    let score = 0;
    if (axisCounts[ax] === 0) score += 3;
    else if (axisCounts[ax] <= 2) score += 2;
    score += 2; // 미완료
    return { site: s, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3);

  if (scored.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>
          추천 진단
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <button
          onClick={onGoDiagnosis}
          style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >
          전체 보기 →
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
        {scored.map(({ site }) => (
          <div key={site.name} style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>{site.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>
                  {site.category}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Noto Serif KR',serif" }}>{site.title}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--sub2)', lineHeight: 1.6 }}>{site.target}</div>
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              style={{
                textAlign: 'center', padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 700,
                background: 'var(--text)', color: 'var(--bg)', textDecoration: 'none',
              }}
            >
              진단하기
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
