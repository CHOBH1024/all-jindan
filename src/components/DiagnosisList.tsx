import { useState } from 'react';
import { SITES } from '../data';
import type { DiagnosisRecord } from '../App';

interface Props {
  results: DiagnosisRecord[];
  onSave: (r: DiagnosisRecord) => void;
  onGoAnalysis: () => void;
}

interface ModalState {
  site: (typeof SITES)[0];
}

export function DiagnosisList({ results, onSave, onGoAnalysis }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('전체');
  const [done, setDone] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalState | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('alljindan_bookmarks') || '[]'); } catch { return []; }
  });
  // 최근 기록한 사이트 (CTA용)
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const toggleBookmark = (site: string) => {
    const next = bookmarks.includes(site) ? bookmarks.filter(s => s !== site) : [...bookmarks, site];
    setBookmarks(next);
    localStorage.setItem('alljindan_bookmarks', JSON.stringify(next));
  };

  const cats = ['전체', ...new Set(SITES.map(s => s.category))];
  const doneSites = new Set(results.map(r => r.site));
  const filtered = SITES.filter(s =>
    (cat === '전체' || s.category === cat) &&
    (q === '' || s.title.includes(q) || s.keywords.includes(q) || s.target.includes(q))
  );

  const handleSave = (r: DiagnosisRecord) => {
    onSave(r);
    setDone({ ...done, [r.site]: r.result });
    setModal(null);
    setJustSaved(r.site);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>🧩 진단 모음</h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>총 {SITES.length}개 진단 — 원하는 진단을 골라 받아보고, 결과를 기록하세요.</p>

      {/* 기록 직후 CTA */}
      {justSaved && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))',
          border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: '12px 16px',
        }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>기록 완료! 지금 바로 통합 분석에서 확인해보세요.</div>
          <button
            onClick={onGoAnalysis}
            style={{
              padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
              color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', whiteSpace: 'nowrap',
            }}
          >
            🧬 통합 분석 보기
          </button>
        </div>
      )}

      {/* 검색 + 카테고리 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="진단 검색 (예: 집중력, 번아웃, 커리어)"
          style={{
            flex: 1, minWidth: 220, padding: '10px 16px', borderRadius: 12,
            background: 'rgba(30,41,59,0.7)', border: '1px solid #334155', color: '#e2e8f0', fontSize: 14,
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: '8px 14px', borderRadius: 999, border: '1px solid #334155', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: cat === c ? '#6366f1' : 'rgba(30,41,59,0.7)', color: cat === c ? '#fff' : '#cbd5e1',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 진단 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {filtered.map(s => {
          const isDone = doneSites.has(s.name);
          const bm = bookmarks.includes(s.name);
          return (
            <div key={s.name} style={{
              background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b', borderRadius: 14, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 8, transition: 'transform .15s, border-color .15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{s.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 800, flex: 1 }}>{s.title}</span>
                <button
                  onClick={() => toggleBookmark(s.name)}
                  title="북마크"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }}
                >
                  {bm ? '⭐' : '☆'}
                </button>
                {isDone && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>✓ 완료</span>}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', minHeight: 30 }}>{s.target}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', textDecoration: 'none',
                  }}
                >
                  진단하기
                </a>
                <button
                  onClick={() => setModal({ site: s })}
                  style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(30,41,59,0.8)', border: '1px solid #334155', color: '#cbd5e1', whiteSpace: 'nowrap',
                  }}
                >
                  {isDone ? '수정' : '기록'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>검색 결과가 없어요 🔍</div>
      )}

      {modal && <ResultModal site={modal.site} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}

/* ---------- 구조화 결과 기록 모달 ---------- */
function ResultModal({ site, onClose, onSave }: {
  site: (typeof SITES)[0];
  onClose: () => void;
  onSave: (r: DiagnosisRecord) => void;
}) {
  const [result, setResult] = useState('');
  const [score, setScore] = useState(50);
  const [hasScore, setHasScore] = useState(true);

  const submit = () => {
    if (!result.trim()) return;
    onSave({
      site: site.name,
      title: site.title,
      result: result.trim(),
      emoji: site.emoji,
      date: new Date().toISOString().slice(0, 10),
      score: hasScore ? score : undefined,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400, background: '#111827', border: '1px solid #1e293b', borderRadius: 20,
          padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{site.emoji} {site.title} 기록</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>진단 결과 유형 / 한 줄 요약</label>
        <input
          value={result}
          onChange={e => setResult(e.target.value)}
          placeholder="예: 카리스마 비전 리더"
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, marginTop: 6, boxSizing: 'border-box',
            background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', color: '#e2e8f0', outline: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>점수 기록</label>
          <input
            type="checkbox"
            checked={hasScore}
            onChange={e => setHasScore(e.target.checked)}
            style={{ accentColor: '#6366f1' }}
          />
        </div>
        {hasScore && (
          <div style={{ marginTop: 8 }}>
            <input
              type="range" min={0} max={100} value={score}
              onChange={e => setScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 900, color: '#818cf8' }}>{score}점</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(30,41,59,0.8)', border: '1px solid #334155', color: '#94a3b8' }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!result.trim()}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none',
              color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', opacity: result.trim() ? 1 : 0.5,
            }}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
