import { useState, useEffect } from 'react';
import { api, getToken, type ServerDiagnosis } from '../api';

interface Comment {
  id: number;
  body: string;
  user_name: string;
  created_at: number;
}

export function Community() {
  const [feed, setFeed] = useState<ServerDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [likeCount, setLikeCount] = useState<Record<number, number>>({});

  useEffect(() => {
    api.feed()
      .then(d => {
        const items = d.feed || [];
        setFeed(items);
        const lc: Record<number, number> = {};
        items.forEach((f: ServerDiagnosis) => { lc[f.id] = f.like_count || 0; });
        setLikeCount(lc);
      })
      .catch(() => setError('피드를 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  }, []);

  const isLoggedIn = !!getToken();

  const toggleComments = async (id: number) => {
    if (openComments === id) { setOpenComments(null); return; }
    setOpenComments(id);
    try {
      const d = await api.feedComments(id);
      setComments({ ...comments, [id]: d.comments || [] });
    } catch {}
  };

  const postComment = async (id: number) => {
    if (!commentText.trim()) return;
    try {
      await api.addFeedComment(id, commentText.trim());
      const d = await api.feedComments(id);
      setComments({ ...comments, [id]: d.comments || [] });
      setCommentText('');
    } catch {}
  };

  const toggleLike = async (id: number) => {
    if (!isLoggedIn) return;
    try {
      const r = await api.toggleLike(id);
      setLiked({ ...liked, [id]: r.liked });
      setLikeCount({ ...likeCount, [id]: r.count });
    } catch {}
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>👥 커뮤니티 피드</h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>다른 사람들의 진단 결과를 구경하고, 댓글과 좋아요로 소통해보세요.</p>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>피드 불러오는 중...</div>}
      {error && <div style={{ textAlign: 'center', padding: 40, color: '#f87171' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feed.map(f => (
          <div key={f.id} style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
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
                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => toggleLike(f.id)}
                    disabled={!isLoggedIn}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                      background: liked[f.id] ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.6)',
                      border: '1px solid ' + (liked[f.id] ? 'rgba(239,68,68,0.4)' : '#334155'),
                      color: liked[f.id] ? '#f87171' : '#94a3b8',
                    }}
                  >
                    ❤️ {likeCount[f.id] || 0}
                  </button>
                  <button
                    onClick={() => toggleComments(f.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(30,41,59,0.6)', border: '1px solid #334155', color: '#94a3b8',
                    }}
                  >
                    💬 {f.comment_count || 0}
                  </button>
                </div>
                {/* 댓글 섹션 */}
                {openComments === f.id && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #1e293b', paddingTop: 12 }}>
                    {(comments[f.id] || []).map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, flexShrink: 0,
                        }}>
                          {(c.user_name || '?')[0]}
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                          <strong style={{ marginRight: 6 }}>{c.user_name}</strong>
                          {c.body}
                        </div>
                      </div>
                    ))}
                    {isLoggedIn ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && postComment(f.id)}
                          placeholder="댓글 달기..."
                          style={{
                            flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 12,
                            background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', color: '#e2e8f0',
                          }}
                        />
                        <button
                          onClick={() => postComment(f.id)}
                          style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                        >
                          등록
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#64748b' }}>댓글을 쓰려면 로그인이 필요해요</div>
                    )}
                  </div>
                )}
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
