import { useState } from 'react';
import { SITES } from '../data';
import { SCIENCE } from '../science';

/* 진단 비교 가이드 — 유사 진단 A vs B */
const COMPARISONS = [
  { title: '애착 유형 vs 관계 만족도', desc: '애착 유형은 관계 패턴의 뿌리를, 관계 만족도는 현재 관계의 상태를 봅니다.', when: '관계가 반복되는 패턴이 궁금하다면 애착 유형부터, 현재 관계가 힘들다면 관계 만족도부터' },
  { title: '완벽주의 vs 번아웃', desc: '완벽주의는 기준의 높이를, 번아웃은 소진 상태를 측정합니다.', when: '끝없이 기준을 올리는 습관이면 완벽주의, 에너지가 다 빠졌다면 번아웃부터' },
  { title: '미루기 vs 집중력', desc: '미루기는 시작의 장애물을, 집중력은 유지의 어려움을 봅니다.', when: '시작이 안 되면 미루기, 시작은 하는데 오래 못 가면 집중력부터' },
  { title: 'FOMO vs 디지털 디톡스', desc: 'FOMO는 놓칠까 불안을, 디지털 디톡스는 스크린 의존도를 측정합니다.', when: '소식을 놓치는 게 불안하면 FOMO, 손에서 폰이 안 떨어지면 디톡스부터' },
  { title: '그릿 vs 미루기', desc: '그릿은 장기적 열정·끈기를, 미루기는 과제 회피를 봅니다.', when: '오래 해왔지만 성과가 안 나면 그릿, 할 일이 계속 밀리면 미루기부터' },
  { title: '가면 증후군 vs 자존감', desc: '가면 증후군은 성과를 인정 못 하는 인지 패턴, 자존감은 자기 가치의 기저를 봅니다.', when: '잘하는데도 두렵다면 가면 증후군, 전반적으로 자신이 없다면 자존감부터' },
];

export function Science() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('전체');
  const cats = ['전체', ...new Set(SITES.map(s => s.category))];
  const filtered = SITES.filter(s =>
    (cat === '전체' || s.category === cat) &&
    (q === '' || s.title.includes(q) || s.name.includes(q))
  );

  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
          Evidence-Based
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px', fontFamily: "'Noto Serif KR',serif" }}>🔬 과학적 근거</h1>
        <p style={{ fontSize: 13, color: 'var(--sub)', margin: '0 0 20px', lineHeight: 1.7 }}>
          모든 진단은 심리학·행동과학의 검증된 이론과 척도에 기반합니다.
          진단 결과는 자기 이해를 위한 참고 자료이며, 임상적 진단을 대체하지 않습니다.
        </p>
      </div>

      {/* 진단 비교 가이드 — 무엇부터 받을까? */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
          진단 비교 가이드 — 무엇부터 받을까?
        </div>
        {COMPARISONS.map((c, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: 'var(--body-text)', lineHeight: 1.8 }}>{c.desc}</div>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginTop: 6 }}>👉 {c.when}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="진단 검색"
          style={{
            flex: 1, minWidth: 180, padding: '9px 14px', borderRadius: 6,
            background: 'var(--card)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: 13,
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: '7px 14px', borderRadius: 999, border: '1px solid var(--border2)', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, background: cat === c ? 'var(--text)' : 'var(--card)',
                color: cat === c ? 'var(--bg)' : 'var(--sub)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
        {filtered.map(s => {
          const sc = SCIENCE[s.name];
          return (
            <div key={s.name} style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 18,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>
                    {s.category}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Noto Serif KR',serif" }}>{s.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 700, lineHeight: 1.6 }}>
                📚 {sc?.theory || '심리학적 이론 기반'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--sub)', lineHeight: 1.6 }}>
                👤 {sc?.scholars || '관련 학자 연구'}
              </div>
              <div style={{
                fontSize: 10, color: 'var(--sub)', background: 'var(--card2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px 10px', lineHeight: 1.5,
              }}>
                📖 {sc?.ref || '학술 척도 참고'}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 24, background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16,
        fontSize: 11, color: 'var(--sub)', lineHeight: 1.8,
      }}>
        <strong>⚠️ 윤리적 안내:</strong> 본 진단 도구는 교육·자기이해 목적이며, 정신건강 전문가의 평가를 대체하지 않습니다.
        심각한 심리적 고통이 지속될 경우 전문가 상담을 권장합니다. (한국 자살예방전화 1393 / 정신건강 위기상담전화 1577-0199)
      </div>
    </div>
  );
}
