import { useState } from 'react';
import { SITES } from '../data';
import type { DiagnosisRecord } from '../App';

interface Props {
  results: DiagnosisRecord[];
  onSave: (r: DiagnosisRecord) => void;
}

export function DiagnosisList({ results, onSave }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('전체');
  const [done, setDone] = useState<Record<string, string>>({});
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('alljindan_bookmarks') || '[]'); } catch { return []; }
  });

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

  const recordResult = (site: (typeof SITES)[0]) => {
    const input = prompt(`${site.title} 결과를 기록하세요\n(예: 카리스마 비전 리더, 84점, OO 유형 등)`);
    if (input === null || input.trim() === '') return;
    const score = Number(input.replace(/[^0-9]/g, ''));
    onSave({
      site: site.name,
      title: site.title,
      result: input.trim(),
      emoji: site.emoji,
      date: new Date().toISOString().slice(0, 10),
      score: isNaN(score) ? undefined : score,
    });
    setDone({ ...done, [site.name]: input.trim() });
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>🧩 진단 모음</h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>총 {SITES.length}개 진단 — 원하는 진단을 골라 받아보고, 결과를 기록하세요.</p>

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
        {filtered.map((s, i) => {
          const isDone = doneSites.has(s.name);
          return (
            <div key={i} style={{
              background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: 16,
              display: 'flex', flexDirection: 'column', gap: 8, transition: 'border-color .15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{s.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 800, flex: 1 }}>{s.title}</span>
                <button
                  onClick={() => toggleBookmark(s.name)}
                  title="북마크"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }}
                >
                  {bookmarks.includes(s.name) ? '⭐' : '☆'}
                </button>
                {isDone && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>✓ 완료</span>}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', minHeight: 30 }}>{s.target}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener"
                  style={{
                    flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                  }}
                >
                  진단하기
                </a>
                <button
                  onClick={() => recordResult(s)}
                  style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc',
                  }}
                >
                  결과 기록
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>검색 결과가 없습니다 🔍</div>
      )}
    </div>
  );
}
