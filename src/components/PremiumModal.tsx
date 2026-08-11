import { useState } from 'react';
import { api, getToken } from '../api';

interface Props {
  onClose: () => void;
  onPurchased: (product: string) => void;
}

const PRODUCTS = [
  { id: 'premium_month', emoji: '👑', name: '프리미엄 구독 (1개월)', desc: 'AI 코치 전체 + 상세 리포트 + 무제한 이력 + 광고 제거', price: '4,900원' },
  { id: 'premium_year', emoji: '💎', name: '프리미엄 구독 (1년)', desc: '월 4,083원 — 2개월 무료 혜택', price: '49,000원' },
  { id: 'report', emoji: '📄', name: '상세 진단 리포트 PDF', desc: '10페이지 전문 해석 + 연구 근거 + 실천 계획', price: '2,900원' },
  { id: 'ebook', emoji: '📖', name: '전자책: 나를 이해하는 76가지 방법', desc: '76개 진단의 심층 가이드 전자책', price: '19,900원' },
  { id: 'premium_diag', emoji: '🔍', name: '프리미엄 진단 1회', desc: '심화 해석이 포함된 프리미엄 진단', price: '1,000원' },
];

export function PremiumModal({ onClose, onPurchased }: Props) {
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const buy = async (id: string) => {
    if (!getToken()) { setMsg('로그인 후 이용할 수 있어요.'); return; }
    setBuying(id);
    try {
      const r = await api.createOrder(id);
      if (r.ok) {
        setMsg(`✅ ${r.order.name} 결제 완료! (${r.order.amount.toLocaleString()}원)`);
        onPurchased(id);
      } else {
        setMsg('결제 처리에 실패했어요. 다시 시도해주세요.');
      }
    } catch {
      setMsg('결제 처리에 실패했어요. 다시 시도해주세요.');
    }
    setBuying(null);
  };

  return (
    <div className="anim-fade" style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(43,38,32,0.6)', backdropFilter: 'blur(4px)', padding: 16, overflowY: 'auto',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="anim-scale" style={{
        width: '100%', maxWidth: 460, background: 'var(--card)',
border: '1px solid var(--border)', borderRadius: 14,
        padding: 24, boxShadow: '0 20px 60px rgba(43,38,32,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "'Noto Serif KR',serif" }}>💎 올진단 프리미엄</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sub2)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--sub2)', margin: '0 0 16px' }}>
          자기 이해를 더 깊게 — AI 코치, 상세 리포트, 무제한 기록
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {PRODUCTS.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
              border: '1px solid ' + (p.id === 'premium_month' ? 'var(--accent)' : 'var(--border)'),
              background: p.id === 'premium_month' ? 'rgba(138,109,59,0.06)' : 'var(--card)',
            }}>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--sub2)', lineHeight: 1.5 }}>{p.desc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent)' }}>{p.price}</div>
                <button
                  onClick={() => buy(p.id)}
                  disabled={buying === p.id}
                  style={{
                    marginTop: 4, padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: 'var(--text)', color: 'var(--bg)', border: 'none',
                  }}
                >
                  {buying === p.id ? '처리 중...' : '구매'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {msg && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 8,
            background: msg.startsWith('✅') ? 'rgba(138,109,59,0.1)' : 'rgba(239,68,68,0.08)',
            border: '1px solid ' + (msg.startsWith('✅') ? 'rgba(138,109,59,0.3)' : 'rgba(239,68,68,0.3)'),
            color: msg.startsWith('✅') ? 'var(--success)' : 'var(--error)',
          }}>
            {msg}
          </div>
        )}

        <div style={{ fontSize: 10, color: 'var(--hint)', lineHeight: 1.6 }}>
          * 결제는 안전하게 처리되며, 구독은 언제든 해지할 수 있습니다 (청약철회 7일).<br />
          * 프리미엄 콘텐츠도 자기이해 참고용이며 임상 진단을 대체하지 않습니다.
        </div>
      </div>
    </div>
  );
}
