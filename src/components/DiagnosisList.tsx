import { useState } from 'react';
import { SITES } from '../data';
import { getAxis } from './Analysis';
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
  const [sortBy, setSortBy] = useState<'default' | 'empty-axis' | 'recent'>('default');
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
  let filtered = SITES.filter(s =>
    (cat === '전체' || s.category === cat) &&
    (q === '' || s.title.includes(q) || s.keywords.includes(q) || s.target.includes(q))
  );
  // 나에게 맞는 정렬
  if (sortBy === 'empty-axis' || sortBy === 'recent') {
    const axisCounts = [0, 0, 0, 0];
    const recentDate = new Map<string, string>();
    results.forEach(r => {
      axisCounts[getAxis(r.site, '')]++;
      recentDate.set(r.site, r.date);
    });
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'empty-axis') {
        const da = axisCounts[getAxis(a.name, a.category)] === 0 ? 1 : 0;
        const db = axisCounts[getAxis(b.name, b.category)] === 0 ? 1 : 0;
        return db - da;
      }
      // 최근 미실시 우선
      const ra = recentDate.get(a.name) || '0000';
      const rb = recentDate.get(b.name) || '0000';
      return ra.localeCompare(rb);
    });
  }

  const handleSave = (r: DiagnosisRecord) => {
    onSave(r);
    setDone({ ...done, [r.site]: r.result });
    setModal(null);
    setJustSaved(r.site);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>🧩 진단 모음</h1>
      <p style={{ fontSize: 13, color: 'var(--hint)', margin: '0 0 20px' }}>총 {SITES.length}개 진단 — 원하는 진단을 골라 받아보고, 결과를 기록하세요.</p>

      {/* 기록 직후 CTA */}
      {justSaved && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          background: 'linear-gradient(135deg,rgba(138,109,59,0.12),rgba(138,109,59,0.12))',
          border: '1px solid var(--accent-border)', borderRadius: 14, padding: '12px 16px',
        }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>기록 완료! 지금 바로 통합 분석에서 확인해보세요.</div>
          <button
            onClick={onGoAnalysis}
            style={{
              padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
              color: 'var(--bg)', background: 'var(--text)', whiteSpace: 'nowrap',
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
            background: 'var(--card3)', border: '1px solid var(--border2)', color: 'var(--text-strong)', fontSize: 14,
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: '8px 14px', borderRadius: 999, border: '1px solid var(--border2)', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: cat === c ? 'var(--text)' : 'var(--card)', color: cat === c ? 'var(--bg)' : 'var(--sub)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {/* 정렬 칩 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {([
          ['default', '기본순'],
          ['empty-axis', '빈 축 우선'],
          ['recent', '최근 미실시'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: '1px solid ' + (sortBy === key ? 'var(--accent)' : 'var(--border2)'),
              background: sortBy === key ? 'rgba(138,109,59,0.12)' : 'var(--card)',
              color: sortBy === key ? 'var(--accent)' : 'var(--sub2)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 진단 카드 그리드 */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {filtered.map(s => {
          const isDone = doneSites.has(s.name);
          const bm = bookmarks.includes(s.name);
          return (
            <div key={s.name} className="hover-lift" style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 9, letterSpacing: 1.5, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 2,
                  }}>
                    {s.category}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Noto Serif KR',serif" }}>{s.title}</div>
                </div>
                <button
                  onClick={() => toggleBookmark(s.name)}
                  title="북마크"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }}
                >
                  {bm ? '⭐' : '☆'}
                </button>
                {isDone && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: 'var(--success)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>✓ 완료</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--hint)', minHeight: 30 }}>{s.target}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: 'var(--text)', color: 'var(--bg)', textDecoration: 'none',
                  }}
                >
                  진단하기
                </a>
                <button
                  onClick={() => setModal({ site: s })}
                  style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(240,233,220,0.9)', border: '1px solid var(--border2)', color: 'var(--sub)', whiteSpace: 'nowrap',
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
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--hint)' }}>검색 결과가 없어요 🔍</div>
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
    <div className="anim-fade" style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="anim-scale"
        style={{
          width: '100%', maxWidth: 400, background: 'var(--card)',
border: '1px solid var(--border)', borderRadius: 20,
          padding: 24, boxShadow: 'var(--shadow-modal)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{site.emoji} {site.title} 기록</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--hint)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <label style={{ fontSize: 11, color: 'var(--sub2)', fontWeight: 700 }}>진단 결과 유형 / 한 줄 요약</label>
        <input
          value={result}
          onChange={e => setResult(e.target.value)}
          placeholder="예: 카리스마 비전 리더"
          autoFocus
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 6, fontSize: 14, marginTop: 6, boxSizing: 'border-box',
            background: 'var(--card)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--sub2)', fontWeight: 700, whiteSpace: 'nowrap' }}>점수 기록 (선택)</label>
          <input
            type="checkbox"
            checked={hasScore}
            onChange={e => setHasScore(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>
        {hasScore && (
          <div style={{ marginTop: 8 }}>
            <input
              type="range" min={0} max={100} value={score}
              onChange={e => setScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{score}점</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(240,233,220,0.9)', border: '1px solid var(--border2)', color: 'var(--hint)' }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!result.trim()}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none',
              color: 'var(--bg)', background: 'var(--text)', opacity: result.trim() ? 1 : 0.5,
            }}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
