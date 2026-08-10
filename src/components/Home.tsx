import { SITES } from '../data';

interface Props {
  onGoDiagnosis: () => void;
  resultCount: number;
}

export function Home({ onGoDiagnosis, resultCount }: Props) {
  const categories = [...new Set(SITES.map(s => s.category))];
  return (
    <div>
      {/* 히어로 */}
      <section style={{ textAlign: 'center', padding: '48px 0 32px' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🧬</div>
        <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: -2, lineHeight: 1.2 }}>
          나는 어떤 사람인가?
        </h1>
        <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: '#94a3b8', maxWidth: 560, margin: '0 auto 24px', lineHeight: 1.7 }}>
          {SITES.length}개의 진단을 하나로. 성격, 커리어, 관계, 습관을 통합해<br />
          <strong style={{ color: '#c7d2fe' }}>지금의 나</strong>를 이해하고 <strong style={{ color: '#c7d2fe' }}>앞으로의 삶</strong>을 설계합니다.
        </p>
        <button
          onClick={onGoDiagnosis}
          style={{
            padding: '14px 36px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 16, fontWeight: 800, color: '#fff',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
            transition: 'transform .15s',
          }}
        >
          진단 시작하기 →
        </button>
      </section>

      {/* 통계 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, maxWidth: 720, margin: '0 auto 40px' }}>
        {[
          { n: `${SITES.length}개`, l: '통합 진단' },
          { n: `${categories.length}개`, l: '카테고리' },
          { n: `${resultCount}개`, l: '내가 완료한 진단' },
          { n: '4축', l: '종합 분석' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#818cf8' }}>{s.n}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </section>

      {/* 카테고리 소개 */}
      <section style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>어떤 영역을 진단하나요?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {categories.map((cat, i) => {
            const items = SITES.filter(s => s.category === cat);
            return (
              <div key={i} style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{cat}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
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
