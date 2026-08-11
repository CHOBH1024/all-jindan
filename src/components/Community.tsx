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
        setLoading(false);
      })
      .catch(() => { setError('피드를 불러오지 못했어요'); setLoading(false); });
  }, []);

  // 성장률 하이라이트 — 같은 사이트를 여러 번 진단한 사용자 (재진단)
  const siteCounts = new Map<string, Map<string, number>>();
  feed.forEach(f => {
    if (!f.user_name) return;
    if (!siteCounts.has(f.user_name)) siteCounts.set(f.user_name, new Map());
    const m = siteCounts.get(f.user_name)!;
    m.set(f.site, (m.get(f.site) || 0) + 1);
  });
  const growthUsers = new Set<string>();
  siteCounts.forEach((m, user) => {
    m.forEach((count) => { if (count >= 2) growthUsers.add(user); });
  });

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

  // 첫 공유 미션 상태
  const [hasSharedOnce, setHasSharedOnce] = useState(() => {
    try { return localStorage.getItem('alljindan_shared_once') === '1'; } catch { return false; }
  });
  const [showGuide, setShowGuide] = useState(false);

  // 커뮤니티 챌린지
  const [challenges, setChallenges] = useState<{ id: string; emoji: string; title: string; desc: string; participants: number }[]>([]);
  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set());
  const [compareWith, setCompareWith] = useState<{ title: string; result: string; score?: number; user_name: string } | null>(null);
  useEffect(() => {
    api.challenges().then(d => {
      setChallenges(d.challenges || []);
      // 참여 상태 (localStorage)
      try {
        const joined = new Set<string>(JSON.parse(localStorage.getItem('alljindan_challenge_joined') || '[]'));
        setJoinedChallenges(joined);
      } catch {}
    }).catch(() => {});
  }, []);
  const joinChallenge = async (id: string) => {
    if (!getToken()) return;
    try {
      const r = await api.joinChallenge(id);
      const next = new Set(joinedChallenges);
      if (r.joined) next.add(id); else next.delete(id);
      setJoinedChallenges(next);
      localStorage.setItem('alljindan_challenge_joined', JSON.stringify([...next]));
      setChallenges(challenges.map(c => c.id === id ? { ...c, participants: r.participants } : c));
    } catch {}
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>👥 커뮤니티 피드</h1>
      <p style={{ fontSize: 13, color: '#7a7060', margin: '0 0 20px' }}>다른 사람들의 진단 결과를 구경하고, 댓글과 좋아요로 소통해보세요.</p>

      {/* 첫 공유 미션 — 사회적 증명 */}
      {!hasSharedOnce && isLoggedIn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          background: 'linear-gradient(135deg,#f7f2e9,#f0e9dc)', border: '1px solid #e5ded2', borderRadius: 12, padding: '14px 16px',
        }}>
          <span style={{ fontSize: 26 }}>🎁</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>첫 결과를 공유해보세요</div>
            <div style={{ fontSize: 11, color: '#7a7060' }}>나의 결과 탭에서 공유하면 커뮤니티에 소개됩니다.</div>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            style={{
              padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: '#2b2620', color: '#faf7f2', border: 'none', whiteSpace: 'nowrap',
            }}
          >
            공유 방법 보기
          </button>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9a9081' }}>피드 불러오는 중...</div>}
      {error && <div style={{ textAlign: 'center', padding: 40, color: '#dc2626' }}>{error}</div>}

      {/* 주간 커뮤니티 챌린지 */}
      {challenges.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#8a6d3b', fontWeight: 800, textTransform: 'uppercase' }}>
              이번 주 챌린지
            </div>
            <div style={{ flex: 1, height: 1, background: '#e5ded2' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 8 }}>
            {challenges.map(c => {
              const joined = joinedChallenges.has(c.id);
              return (
                <div key={c.id} style={{
                  background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 10, padding: 14,
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{c.title}</div>
                      <div style={{ fontSize: 10, color: '#7a7060' }}>{c.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#8a6d3b', fontWeight: 700 }}>👥 {c.participants}명 참여 중</span>
                    <button
                      onClick={() => joinChallenge(c.id)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        background: joined ? 'rgba(138,109,59,0.12)' : '#2b2620',
                        border: joined ? '1px solid rgba(138,109,59,0.4)' : 'none',
                        color: joined ? '#8a6d3b' : '#faf7f2',
                      }}
                    >
                      {joined ? '✓ 참여 중' : '참여하기'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#3d3830' }}>{f.user_name}</span>
                  {growthUsers.has(f.user_name || '') && (
                    <span style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                      background: 'rgba(138,109,59,0.12)', border: '1px solid rgba(138,109,59,0.3)', color: '#8a6d3b',
                    }}>
                      📈 성장 중
                    </span>
                  )}
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
                      color: liked[f.id] ? '#dc2626' : '#9a9081',
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
                  {/* 나와 비교 — 같은 사이트 내 결과 */}
                  <button
                    onClick={() => {
                      let mine = null;
                      try { mine = JSON.parse(localStorage.getItem('alljindan_results') || '[]').find((r: { site: string }) => r.site === f.site) || null; } catch {}
                      if (mine) setCompareWith({ title: f.title, result: f.result, score: f.score ?? undefined, user_name: f.user_name || '' });
                      else alert('이 진단을 먼저 받고 기록하면 비교할 수 있어요!');
                    }}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(138,109,59,0.1)', border: '1px solid rgba(138,109,59,0.3)', color: '#8a6d3b',
                    }}
                  >
                    ⚔️ 나와 비교
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

      {/* 공유 방법 안내 모달 */}
      {showGuide && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(43,38,32,0.6)', backdropFilter: 'blur(4px)',
        }} onClick={() => setShowGuide(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 380, background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 14,
            padding: 24, boxShadow: '0 20px 60px rgba(43,38,32,0.3)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', fontFamily: "'Noto Serif KR',serif" }}>📤 공유하는 방법</h2>
            <div style={{ fontSize: 13, color: '#5a5245', lineHeight: 1.9 }}>
              1. <strong>나의 결과</strong> 탭으로 이동<br />
              2. 결과 옆 <strong>공유</strong> 버튼 클릭<br />
              3. 커뮤니티 피드에 내 결과가 표시됩니다!
            </div>
            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: '100%', marginTop: 16, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 800, color: '#faf7f2', background: '#2b2620',
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 나와 비교 모달 */}
      {compareWith && <CompareModal data={compareWith} onClose={() => setCompareWith(null)} />}
    </div>
  );
}

/* ---------- 나와 비교 모달 ---------- */
function CompareModal({ data, onClose }: {
  data: { title: string; result: string; score?: number; user_name: string };
  onClose: () => void;
}) {
  let mine: { result?: string; score?: number } | null = null;
  try { mine = JSON.parse(localStorage.getItem('alljindan_results') || '[]')[0] || null; } catch {}
  const diff = data.score !== undefined && mine?.score !== undefined ? data.score - mine.score : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(43,38,32,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 400, background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 14,
        padding: 24, boxShadow: '0 20px 60px rgba(43,38,32,0.3)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', fontFamily: "'Noto Serif KR',serif" }}>
          ⚔️ 나와 비교 — {data.title}
        </h2>
        <div style={{ fontSize: 11, color: '#7a7060', marginBottom: 16 }}>동일 진단을 받은 두 사람의 결과</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#f7f2e9', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#8a6d3b', marginBottom: 4 }}>{data.user_name}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{data.result}</div>
            {data.score !== undefined && <div style={{ fontSize: 12, color: '#8a6d3b', fontWeight: 700, marginTop: 2 }}>{data.score}점</div>}
          </div>
          <div style={{ textAlign: 'center', fontSize: 18 }}>▼</div>
          <div style={{ background: '#f0e9dc', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7a7060', marginBottom: 4 }}>나</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{mine?.result || '기록 없음'}</div>
            {mine?.score !== undefined && <div style={{ fontSize: 12, color: '#7a7060', fontWeight: 700, marginTop: 2 }}>{mine.score}점</div>}
          </div>
        </div>

        {diff !== null && diff !== 0 && (
          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.6,
            background: 'rgba(138,109,59,0.1)', border: '1px solid rgba(138,109,59,0.3)', color: '#5a5245',
          }}>
            {diff > 0
              ? `${data.user_name}님이 ${diff}점 더 높아요. 사람마다 이 진단의 강도가 다르게 나타난다는 뜻이에요.`
              : `당신이 ${-diff}점 더 높아요. 이 점수는 비교가 아니라 각자의 신호로 읽어주세요.`}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 16, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 800, color: '#faf7f2', background: '#2b2620',
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
