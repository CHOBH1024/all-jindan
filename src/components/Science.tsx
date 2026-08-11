import { useState } from 'react';
import { SITES } from '../data';
import { SCIENCE } from '../science';

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
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#8a6d3b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
          Evidence-Based
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px', fontFamily: "'Noto Serif KR',serif" }}>🔬 과학적 근거</h1>
        <p style={{ fontSize: 13, color: '#6b6355', margin: '0 0 20px', lineHeight: 1.7 }}>
          모든 진단은 심리학·행동과학의 검증된 이론과 척도에 기반합니다.
          진단 결과는 자기 이해를 위한 참고 자료이며, 임상적 진단을 대체하지 않습니다.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="진단 검색"
          style={{
            flex: 1, minWidth: 180, padding: '9px 14px', borderRadius: 6,
            background: '#fffdf8', border: '1px solid #ddd3c2', color: '#2b2620', fontSize: 13,
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: '7px 14px', borderRadius: 999, border: '1px solid #ddd3c2', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, background: cat === c ? '#2b2620' : '#fffdf8',
                color: cat === c ? '#faf7f2' : '#6b6355',
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
              background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 10, padding: 18,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 800, color: '#8a6d3b', textTransform: 'uppercase' }}>
                    {s.category}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Noto Serif KR',serif" }}>{s.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#3d3830', fontWeight: 700, lineHeight: 1.6 }}>
                📚 {sc?.theory || '심리학적 이론 기반'}
              </div>
              <div style={{ fontSize: 11, color: '#6b6355', lineHeight: 1.6 }}>
                👤 {sc?.scholars || '관련 학자 연구'}
              </div>
              <div style={{
                fontSize: 10, color: '#7a7060', background: '#f7f2e9', border: '1px solid #ece4d5',
                borderRadius: 6, padding: '6px 10px', lineHeight: 1.5,
              }}>
                📖 {sc?.ref || '학술 척도 참고'}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 24, background: '#f7f2e9', border: '1px solid #e5ded2', borderRadius: 10, padding: 16,
        fontSize: 11, color: '#6b6355', lineHeight: 1.8,
      }}>
        <strong>⚠️ 윤리적 안내:</strong> 본 진단 도구는 교육·자기이해 목적이며, 정신건강 전문가의 평가를 대체하지 않습니다.
        심각한 심리적 고통이 지속될 경우 전문가 상담을 권장합니다. (한국 자살예방전화 1393 / 정신건강 위기상담전화 1577-0199)
      </div>
    </div>
  );
}
