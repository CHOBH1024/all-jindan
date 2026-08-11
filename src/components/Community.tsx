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

  const toggleFollow = async (userId: number) => {
    if (!isLoggedIn) return;
    try {
      const cur = following[userId];
      if (cur) await api.unfollow(userId);
      else await api.follow(userId);
      setFollowing({ ...following, [userId]: !cur });
    } catch {}
  };

  const [following, setFollowing] = useState<Record<number, boolean>>(() => {
    // 로그인 시 내 팔로우 목록 로드
    if (getToken()) {
      api.myFollowing().then(d => {
        const m: Record<number, boolean> = {};
        (d.following || []).forEach((f: { following_id: number }) => { m[f.following_id] = true; });
        setFollowing(m);
      }).catch(() => {});
    }
    return {};
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>👥 커뮤니티 피드</h1>
      <p style={{ fontSize: 13, color: '#9a9081', margin: '0 0 20px' }}>다른 사람들의 진단 결과를 구경하고, 댓글과 좋아요로 소통해보세요.</p>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9a9081' }}>피드 불러오는 중...</div>}
      {error && <div style={{ textAlign: 'center', padding: 40, color: '#f87171' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feed.map(f => (
          <div key={f.id} style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid #e5ded2', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#2b2620', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {(f.user_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 800 }}>{f.user_name}</span>
                  <span style={{ fontSize: 11, color: '#9a9081' }}>
                    {new Date(f.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  {isLoggedIn && (f as { user_id?: number }).user_id !== undefined && (f as { user_id: number }).user_id !== (JSON.parse(localStorage.getItem('alljindan_user') || '{}').id) && (
                    <button
                      onClick={() => toggleFollow((f as { user_id: number }).user_id)}
                      style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        background: following[(f as { user_id: number }).user_id] ? 'rgba(240,233,220,0.85)' : 'rgba(138,109,59,0.12)',
                        border: '1px solid ' + (following[(f as { user_id: number }).user_id] ? '#ddd3c2' : 'rgba(99,102,241,0.4)'),
                        color: following[(f as { user_id: number }).user_id] ? '#9a9081' : '#8a6d3b',
                      }}
                    >
                      {following[(f as { user_id: number }).user_id] ? '✓ 팔로잉' : '+ 팔로우'}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#6b6355', lineHeight: 1.6 }}>
                  <span style={{ fontSize: 20, marginRight: 6 }}>{f.emoji || '🧩'}</span>
                  <strong>{f.title}</strong> — {f.result}
                  {f.score !== null && f.score !== undefined && <span style={{ color: '#8a6d3b', fontWeight: 700 }}> · {f.score}점</span>}
                </div>
                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => toggleLike(f.id)}
                    disabled={!isLoggedIn}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                      background: liked[f.id] ? 'rgba(239,68,68,0.15)' : 'rgba(240,233,220,0.85)',
                      border: '1px solid ' + (liked[f.id] ? 'rgba(239,68,68,0.4)' : '#ddd3c2'),
                      color: liked[f.id] ? '#f87171' : '#9a9081',
                    }}
                  >
                    ❤️ {likeCount[f.id] || 0}
                  </button>
                  <button
                    onClick={() => toggleComments(f.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(240,233,220,0.85)', border: '1px solid #ddd3c2', color: '#9a9081',
                    }}
                  >
                    💬 {f.comment_count || 0}
                  </button>
                </div>
                {/* 댓글 섹션 */}
                {openComments === f.id && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e5ded2', paddingTop: 12 }}>
                    {(comments[f.id] || []).map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', background: 'rgba(138,109,59,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, flexShrink: 0,
                        }}>
                          {(c.user_name || '?')[0]}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b6355', lineHeight: 1.5 }}>
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
                            background: '#f0e9dc', border: '1px solid #ddd3c2', color: '#3d3830',
                          }}
                        />
                        <button
                          onClick={() => postComment(f.id)}
                          style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', color: '#fff', background: '#2b2620' }}
                        >
                          등록
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#9a9081' }}>댓글을 쓰려면 로그인이 필요해요</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && !error && feed.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9a9081' }}>
            아직 공유된 결과가 없어요 — 첫 번째로 공유해보세요! 🎉
          </div>
        )}
      </div>
    </div>
  );
}
