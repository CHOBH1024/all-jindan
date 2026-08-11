import type { DiagnosisRecord } from '../App';
import { api, getToken } from '../api';

interface Props {
  results: DiagnosisRecord[];
  onRemove: (idx: number) => void;
  onShare: (idx: number) => void;
  isLoggedIn: boolean;
  onShowLogin: () => void;
}

export function MyResults({ results, onRemove, onShare, isLoggedIn, onShowLogin }: Props) {
  const exportData = async () => {
    try {
      if (getToken()) {
        const d = await api.exportData();
        const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'alljindan-data.json';
        a.click();
      } else {
        const blob = new Blob([JSON.stringify({ results }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'alljindan-data.json';
        a.click();
      }
    } catch {}
  };
  if (results.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>📊</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>아직 기록된 진단이 없어요</h1>
        <p style={{ fontSize: 13, color: '#9a9081', margin: 0 }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>📊 나의 결과</h1>
        <button
          onClick={exportData}
          style={{
            marginLeft: 'auto', padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#15803d',
          }}
        >
          📦 데이터 내보내기
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(138,109,59,0.1)', border: '1px solid rgba(138,109,59,0.3)', color: '#8a6d3b',
          }}
        >
          🖨️ PDF로 저장
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#9a9081', margin: '0 0 20px' }}>총 {results.length}개 진단 기록 — 결과를 쌓을수록 종합 분석이 정밀해집니다.</p>

      {/* 비로그인 — 가입 유도 배너 */}
      {!isLoggedIn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          background: 'linear-gradient(135deg,#f7f2e9,#f0e9dc)', border: '1px solid #e5ded2', borderRadius: 12, padding: '14px 16px',
        }}>
          <span style={{ fontSize: 24 }}>🔐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>기록을 잃지 않으려면 가입하세요</div>
            <div style={{ fontSize: 11, color: '#7a7060' }}>가입하면 {results.length}개 기록이 서버에 안전하게 저장되고, 다른 기기에서도 이어볼 수 있어요.</div>
          </div>
          <button
            onClick={onShowLogin}
            style={{
              padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: '#2b2620', color: '#faf7f2', border: 'none', whiteSpace: 'nowrap',
            }}
          >
            가입하기
          </button>
        </div>
      )}

      {/* 최근 결과 카드 */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(138,109,59,0.12),rgba(139,92,246,0.1))',
        border: '1px solid rgba(138,109,59,0.3)', borderRadius: 16, padding: 20, marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, color: '#8a6d3b', fontWeight: 700, marginBottom: 6 }}>가장 최근 진단</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36 }}>{recent.emoji}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{recent.title}</div>
            <div style={{ fontSize: 14, color: '#6b6355', marginTop: 2 }}>결과: <strong>{recent.result}</strong></div>
            <div style={{ fontSize: 11, color: '#9a9081', marginTop: 2 }}>{recent.date} 기록</div>
          </div>
        </div>
        {/* 해석 가이드 — 3분 읽기 */}
        {recent.score !== undefined && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginTop: 16 }}>
            {guideCards(recent.score).map((g, gi) => (
              <div key={gi} style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, letterSpacing: 1, fontWeight: 800, color: '#8a6d3b', textTransform: 'uppercase', marginBottom: 4 }}>
                  {g.label}
                </div>
                <div style={{ fontSize: 12, color: '#3d3830', lineHeight: 1.6 }}>{g.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 전체 이력 타임라인 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {byDate.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 12, padding: '12px 16px',
          }}>
            <span style={{ fontSize: 22 }}>{r.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: '#9a9081', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.result}{r.score !== undefined ? ` · ${r.score}점` : ''}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#9a9081', whiteSpace: 'nowrap' }}>{r.date}</div>
            {isOldDiagnosis(r.date) && (
              <span style={{
                fontSize: 9, padding: '3px 8px', borderRadius: 999, fontWeight: 700, whiteSpace: 'nowrap',
                background: 'rgba(138,109,59,0.12)', border: '1px solid rgba(138,109,59,0.3)', color: '#8a6d3b',
              }}>
                🔄 재진단 추천
              </span>
            )}
            {isLoggedIn && (
              <button
                onClick={() => onShare(i)}
                style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                  background: r.shared ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                  border: '1px solid ' + (r.shared ? 'rgba(16,185,129,0.3)' : 'rgba(138,109,59,0.3)'),
                  color: r.shared ? '#15803d' : '#8a6d3b',
                }}
              >
                {r.shared ? '✓ 공유됨' : '공유'}
              </button>
            )}
            <button
              onClick={() => onRemove(i)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626',
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

/* ---------- 재진단 리마인더 (4주 이상 경과) ---------- */
function isOldDiagnosis(date: string): boolean {
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const weeks = (Date.now() - d.getTime()) / (7 * 86400000);
  return weeks >= 4;
}

/* ---------- 해석 가이드 (점수대별 의미/오해/다음 행동) ---------- */
function guideCards(score: number) {
          const band = score >= 75 ? 'high' : score >= 40 ? 'mid' : 'low';
          const guides: Record<string, { label: string; text: string }[]> = {
            high: [
              { label: '이 점수의 의미', text: '해당 영역에서 강한 성향이 나타나고 있어요. 이 에너지를 인정하는 것이 첫걸음입니다.' },
              { label: '오해하기 쉬운 점', text: '높은 점수가 "항상 좋다"는 뜻은 아니에요. 과잉 상태에선 관리가 오히려 필요할 수 있습니다.' },
              { label: '다음 행동 1가지', text: '이 강점을 활용할 작은 실천을 하나 정해보세요. 일주일 후 재진단으로 변화를 확인하세요.' },
            ],
            mid: [
              { label: '이 점수의 의미', text: '균형 잡힌 중간 지점이에요. 상황에 따라 유연하게 반응할 수 있는 상태입니다.' },
              { label: '오해하기 쉬운 점', text: '"평범하다"가 아닌 "유연하다"로 읽는 것이 정확해요. 중간값은 적응력의 신호입니다.' },
              { label: '다음 행동 1가지', text: '이 영역에서 가장 개선하고 싶은 지점을 골라, 목표 설정 탭에 기록해보세요.' },
            ],
            low: [
              { label: '이 점수의 의미', text: '현재 이 영역의 에너지가 낮은 상태예요. 부족함이 아니라 우선순위가 낮다는 뜻일 수 있습니다.' },
              { label: '오해하기 쉬운 점', text: '낮은 점수를 결핍으로 해석하지 마세요. 삶의 단계에 따라 자연스러운 변화입니다.' },
              { label: '다음 행동 1가지', text: '이 영역을 지금 키울 필요가 있는지 스스로 물어보고, 필요하다면 작게 시작해보세요.' },
            ],
          };
          return guides[band];
        }
