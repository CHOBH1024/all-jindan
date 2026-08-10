import { useState, useEffect } from 'react';
import { api, type ServerDiagnosis } from '../api';

export function Community() {
  const [feed, setFeed] = useState<ServerDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.feed()
      .then(d => setFeed(d.feed || []))
      .catch(() => setError('피드를 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>👥 커뮤니티 피드</h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>다른 사람들의 진단 결과를 구경하고, 나의 결과도 공유해보세요.</p>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>피드 불러오는 중...</div>}
      {error && <div style={{ textAlign: 'center', padding: 40, color: '#f87171' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feed.map(f => (
          <div key={f.id} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b', borderRadius: 14, padding: 16,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {(f.user_name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{f.user_name}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {new Date(f.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                <span style={{ fontSize: 20, marginRight: 6 }}>{f.emoji || '🧩'}</span>
                <strong>{f.title}</strong> — {f.result}
                {f.score !== null && f.score !== undefined && <span style={{ color: '#818cf8', fontWeight: 700 }}> · {f.score}점</span>}
              </div>
            </div>
          </div>
        ))}
        {!loading && !error && feed.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            아직 공유된 결과가 없어요 — 첫 번째로 공유해보세요! 🎉
          </div>
        )}
      </div>
    </div>
  );
}
