import type { DiagnosisRecord } from '../App';

interface Props {
  results: DiagnosisRecord[];
  onRemove: (idx: number) => void;
  onShare: (idx: number) => void;
  isLoggedIn: boolean;
}

export function MyResults({ results, onRemove, onShare, isLoggedIn }: Props) {
  if (results.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>📊</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>아직 기록된 진단이 없어요</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          진단 모음에서 진단을 받고 <strong>결과 기록</strong> 버튼으로 저장하세요.<br />
          기록이 쌓이면 <strong>통합 분석</strong>에서 나만의 종합 프로필이 완성됩니다!
        </p>
      </div>
    );
  }

  const byDate = [...results].sort((a, b) => b.date.localeCompare(a.date));
  const recent = byDate[0];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>📊 나의 결과</h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>총 {results.length}개 진단 기록 — 결과를 쌓을수록 종합 분석이 정밀해집니다.</p>

      {/* 최근 결과 카드 */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
        border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 20, marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700, marginBottom: 6 }}>가장 최근 진단</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36 }}>{recent.emoji}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{recent.title}</div>
            <div style={{ fontSize: 14, color: '#c7d2fe', marginTop: 2 }}>결과: <strong>{recent.result}</strong></div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{recent.date} 기록</div>
          </div>
        </div>
      </div>

      {/* 전체 이력 타임라인 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {byDate.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 16px',
          }}>
            <span style={{ fontSize: 22 }}>{r.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.result}{r.score !== undefined ? ` · ${r.score}점` : ''}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{r.date}</div>
            {isLoggedIn && (
              <button
                onClick={() => onShare(i)}
                style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                  background: r.shared ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                  border: '1px solid ' + (r.shared ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'),
                  color: r.shared ? '#34d399' : '#a5b4fc',
                }}
              >
                {r.shared ? '✓ 공유됨' : '공유'}
              </button>
            )}
            <button
              onClick={() => onRemove(i)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
              }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
