import { useState } from 'react';
import { getAxis } from './Analysis';
import type { DiagnosisRecord } from '../App';

interface Props {
  results: DiagnosisRecord[];
  onClose: () => void;
}

type Template = 'one-line' | 'radar' | 'growth';

// 공유 카드 3종 — Canvas 렌더링 + PNG 다운로드
export function ShareCardModal({ results, onClose }: Props) {
  const [tpl, setTpl] = useState<Template>('one-line');

  const download = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경 (Calm Editorial 톤)
    ctx.fillStyle = 'var(--bg)';
    ctx.fillRect(0, 0, 1080, 1350);
    // 보더
    ctx.strokeStyle = 'var(--border)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1000, 1270);

    // 헤더
    ctx.fillStyle = 'var(--accent)';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText('올진단', 80, 110);
    ctx.font = '16px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'var(--sub2)';
    ctx.fillText('ALL-JINDAN · 나는 어떤 사람인가', 80, 142);

    // 본문
    ctx.fillStyle = 'var(--text)';
    const top3 = results.slice(0, 3);

    if (tpl === 'one-line') {
      // 한 줄 프로필
      ctx.font = 'bold 52px "Noto Serif KR", serif';
      ctx.fillText('나의 한 줄 프로필', 80, 260);
      ctx.font = '32px "Noto Sans KR", sans-serif';
      ctx.fillStyle = 'var(--body-text)';
      top3.forEach((r, i) => {
        ctx.fillText(`${r.emoji} ${r.title}: ${r.result}`, 100, 350 + i * 60);
      });
    } else if (tpl === 'radar') {
      // 4축 레이더
      ctx.font = 'bold 52px "Noto Serif KR", serif';
      ctx.fillText('나의 4축 레이더', 80, 260);
      const axisCounts = [0, 0, 0, 0];
      const axisScores = [0, 0, 0, 0];
      results.forEach(r => {
        const ax = getAxis(r.site, '');
        axisCounts[ax]++;
        axisScores[ax] += r.score ?? 70;
      });
      const names = ['성격', '커리어', '관계', '습관'];
      names.forEach((n, i) => {
        const score = axisCounts[i] > 0 ? Math.round(axisScores[i] / axisCounts[i]) : 0;
        // 바 차트
        ctx.fillStyle = 'var(--card3)';
        ctx.fillRect(100, 420 + i * 90, 700, 50);
        if (score > 0) {
          ctx.fillStyle = 'var(--accent)';
          ctx.fillRect(100, 420 + i * 90, 700 * score / 100, 50);
        }
        ctx.fillStyle = 'var(--text)';
        ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
        ctx.fillText(n, 830, 456 + i * 90);
        ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
        ctx.fillText(score > 0 ? String(score) : '-', 900, 456 + i * 90);
      });
    } else {
      // 이번 주 성장
      ctx.font = 'bold 52px "Noto Serif KR", serif';
      ctx.fillText('이번 주 성장', 80, 260);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const week = results.filter(r => new Date(r.date) >= weekAgo);
      ctx.font = '30px "Noto Sans KR", sans-serif';
      ctx.fillStyle = 'var(--body-text)';
      ctx.fillText(`이번 주 진단 ${week.length}개 · 전체 ${results.length}개 기록`, 100, 340);
      ctx.fillText('꾸준함이 나를 만듭니다', 100, 400);
      // 스탬프 느낌
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 3;
      ctx.strokeRect(700, 480, 240, 240);
      ctx.fillStyle = 'var(--accent)';
      ctx.font = 'bold 40px "Noto Serif KR", serif';
      ctx.fillText('성장 중', 740, 610);
    }

    // 푸터
    ctx.fillStyle = 'var(--accent)';
    ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
    ctx.fillText('all-jindan.pomyjo.com', 80, 1240);
    ctx.fillStyle = 'var(--sub2)';
    ctx.font = '18px "Noto Sans KR", sans-serif';
    ctx.fillText('76개 진단으로 나를 이해하고 삶을 설계합니다', 80, 1280);

    // 다운로드
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `alljindan-${tpl}.png`;
    a.click();
  };

  return (
    <div className="anim-fade" style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(43,38,32,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="anim-scale" style={{
        width: '100%', maxWidth: 460, background: 'var(--card)',
border: '1px solid var(--border)', borderRadius: 14,
        padding: 24, boxShadow: '0 20px 60px rgba(43,38,32,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, fontFamily: "'Noto Serif KR',serif" }}>📤 공유 카드 만들기</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sub2)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            ['one-line', '✍️ 한 줄 프로필', '나의 진단 결과를 한 줄씩'],
            ['radar', '🧭 4축 레이더', '성격·커리어·관계·습관 점수'],
            ['growth', '🌱 이번 주 성장', '주간 기록과 성장 스탬프'],
          ] as const).map(([key, title, desc]) => (
            <button
              key={key}
              onClick={() => setTpl(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10,
                border: '1px solid ' + (tpl === key ? 'var(--accent)' : 'var(--border)'),
                background: tpl === key ? 'rgba(138,109,59,0.08)' : 'var(--card)', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 22 }}>{title.split(' ')[0]}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{title.split(' ').slice(1).join(' ')}</div>
                <div style={{ fontSize: 11, color: 'var(--sub2)' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={download}
          style={{
            width: '100%', marginTop: 16, padding: '13px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 800, color: 'var(--bg)', background: 'var(--text)',
          }}
        >
          🖼️ 카드 다운로드 (PNG)
        </button>
      </div>
    </div>
  );
}
