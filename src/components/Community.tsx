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
  const [profileUser, setProfileUser] = useState<string | null>(null);
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
      <p style={{ fontSize: 13, color: 'var(--sub2)', margin: '0 0 20px' }}>다른 사람들의 진단 결과를 구경하고, 댓글과 좋아요로 소통해보세요.</p>

      {/* 첫 공유 미션 — 사회적 증명 */}
      {!hasSharedOnce && isLoggedIn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          background: 'linear-gradient(135deg,#f7f2e9,#f0e9dc)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px',
        }}>
          <span style={{ fontSize: 26 }}>🎁</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>첫 결과를 공유해보세요</div>
            <div style={{ fontSize: 11, color: 'var(--sub2)' }}>나의 결과 탭에서 공유하면 커뮤니티에 소개됩니다.</div>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            style={{
              padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: 'var(--text)', color: 'var(--bg)', border: 'none', whiteSpace: 'nowrap',
            }}
          >
            공유 방법 보기
          </button>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--card3)', animation: 'pulse 1.5s ease infinite' }} />
                <div style={{ width: 80, height: 12, borderRadius: 6, background: 'var(--card3)', animation: 'pulse 1.5s ease infinite' }} />
              </div>
              <div style={{ width: '70%', height: 14, borderRadius: 6, background: 'var(--card3)', marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
              <div style={{ width: '90%', height: 12, borderRadius: 6, background: 'var(--card3)', animation: 'pulse 1.5s ease infinite' }} />
            </div>
          ))}
        </div>
      )}
      {error && <div style={{ textAlign: 'center', padding: 40, color: 'var(--error)' }}>{error}</div>}

      {/* 주간 커뮤니티 챌린지 */}
      {challenges.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>
              이번 주 챌린지
            </div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 8 }}>
            {challenges.map(c => {
              const joined = joinedChallenges.has(c.id);
              return (
                <div key={c.id} style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14,
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{c.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--sub2)' }}>{c.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>👥 {c.participants}명 참여 중</span>
                    <button
                      onClick={() => joinChallenge(c.id)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        background: joined ? 'rgba(138,109,59,0.12)' : 'var(--text)',
                        border: joined ? '1px solid rgba(138,109,59,0.4)' : 'none',
                        color: joined ? 'var(--accent)' : 'var(--bg)',
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

      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feed.map(f => (
          <div key={f.id} style={{ background: 'rgba(255,253,248,0.9)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--text)', fontSize: 18, fontWeight: 800, color: 'var(--bg)', flexShrink: 0,
              }}>
                {(f.user_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <button
                    onClick={() => setProfileUser(f.user_name || null)}
                    style={{
                      fontSize: 13, fontWeight: 800, color: 'var(--text-strong)', background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0,
                    }}
                  >
                    {f.user_name}
                  </button>
                  {growthUsers.has(f.user_name || '') && (
                    <span style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                      background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)',
                    }}>
                      📈 성장 중
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--hint)' }}>
                    {new Date(f.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  {isLoggedIn && (f as { user_id?: number }).user_id !== undefined && (f as { user_id: number }).user_id !== (JSON.parse(localStorage.getItem('alljindan_user') || '{}').id) && (
                    <button
                      onClick={() => toggleFollow((f as { user_id: number }).user_id)}
                      style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        background: following[(f as { user_id: number }).user_id] ? 'var(--card3)' : 'rgba(138,109,59,0.12)',
                        border: '1px solid ' + (following[(f as { user_id: number }).user_id] ? 'var(--border2)' : 'rgba(99,102,241,0.4)'),
                        color: following[(f as { user_id: number }).user_id] ? 'var(--hint)' : 'var(--accent)',
                      }}
                    >
                      {following[(f as { user_id: number }).user_id] ? '✓ 팔로잉' : '+ 팔로우'}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6 }}>
                  <span style={{ fontSize: 20, marginRight: 6 }}>{f.emoji || '🧩'}</span>
                  <strong>{f.title}</strong> — {f.result}
                  {f.score !== null && f.score !== undefined && <span style={{ color: 'var(--accent)', fontWeight: 700 }}> · {f.score}점</span>}
                </div>
                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => toggleLike(f.id)}
                    disabled={!isLoggedIn}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                      background: liked[f.id] ? 'rgba(239,68,68,0.15)' : 'var(--card3)',
                      border: '1px solid ' + (liked[f.id] ? 'rgba(239,68,68,0.4)' : 'var(--border2)'),
                      color: liked[f.id] ? 'var(--error)' : 'var(--hint)',
                    }}
                  >
                    ❤️ {likeCount[f.id] || 0}
                  </button>
                  <button
                    onClick={() => toggleComments(f.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'var(--card3)', border: '1px solid var(--border2)', color: 'var(--hint)',
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
                      background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)',
                    }}
                  >
                    ⚔️ 나와 비교
                  </button>
                  {/* 신고 */}
                  <button
                    onClick={async () => {
                      if (!isLoggedIn) { alert('로그인 후 신고할 수 있어요.'); return; }
                      if (!confirm('이 게시물을 신고할까요? 검토 후 조치됩니다.')) return;
                      try {
                        await api.reportFeed(f.id, '부적절한 내용');
                        alert('✅ 신고가 접수되었습니다. 검토 후 조치됩니다.');
                      } catch { alert('신고 처리에 실패했어요.'); }
                    }}
                    style={{
                      marginLeft: 'auto', padding: '5px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      background: 'transparent', border: '1px solid var(--border2)', color: 'var(--hint)',
                    }}
                    title="신고"
                  >
                    🚩
                  </button>
                </div>
                {/* 댓글 섹션 */}
                {openComments === f.id && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    {(comments[f.id] || []).map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', background: 'rgba(138,109,59,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, flexShrink: 0,
                        }}>
                          {(c.user_name || '?')[0]}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5 }}>
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
                            background: 'var(--card3)', border: '1px solid var(--border2)', color: 'var(--text-strong)',
                          }}
                        />
                        <button
                          onClick={() => postComment(f.id)}
                          style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', color: 'var(--bg)', background: 'var(--text)' }}
                        >
                          등록
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--hint)' }}>댓글을 쓰려면 로그인이 필요해요</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && !error && feed.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--hint)' }}>
            아직 공유된 결과가 없어요 — 첫 번째로 공유해보세요! 🎉
          </div>
        )}
      </div>

      {/* 공유 방법 안내 모달 */}
      {showGuide && (
        <div className="anim-fade" style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(43,38,32,0.6)', backdropFilter: 'blur(4px)',
        }} onClick={() => setShowGuide(false)}>
          <div onClick={e => e.stopPropagation()} className="anim-scale" style={{
            width: '100%', maxWidth: 380, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 24, boxShadow: '0 20px 60px rgba(43,38,32,0.3)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', fontFamily: "'Noto Serif KR',serif" }}>📤 공유하는 방법</h2>
            <div style={{ fontSize: 13, color: 'var(--body-text)', lineHeight: 1.9 }}>
              1. <strong>나의 결과</strong> 탭으로 이동<br />
              2. 결과 옆 <strong>공유</strong> 버튼 클릭<br />
              3. 커뮤니티 피드에 내 결과가 표시됩니다!
            </div>
            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: '100%', marginTop: 16, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 800, color: 'var(--bg)', background: 'var(--text)',
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 나와 비교 모달 */}
      {compareWith && <CompareModal data={compareWith} onClose={() => setCompareWith(null)} />}

      {/* 유저 프로필 모달 */}
      {profileUser && <UserProfileModal userName={profileUser} feed={feed} onClose={() => setProfileUser(null)} />}
    </div>
  );
}

/* ---------- 유저 프로필 모달 ---------- */
function UserProfileModal({ userName, feed, onClose }: {
  userName: string;
  feed: ServerDiagnosis[];
  onClose: () => void;
}) {
  const userPosts = feed.filter(f => f.user_name === userName);
  const growth = userPosts.length >= 3;
  const targetUserId = userPosts[0]?.user_id;
  const block = async () => {
    if (!targetUserId) { alert('차단할 수 없는 사용자예요.'); return; }
    if (!confirm(userName + '님을 차단할까요? 차단한 사용자의 게시물이 더 이상 보이지 않아요.')) return;
    try {
      await api.blockUser(targetUserId);
      alert('✅ 차단되었습니다.');
      onClose();
    } catch { alert('차단 처리에 실패했어요.'); }
  };
  const axes = new Set(userPosts.map(p => {
    const map: Record<string, number> = { 'mz-radar': 1, 'attachment-style-radar': 2, 'sleep-hygiene-radar': 3 };
    return map[p.site] !== undefined ? ['성격', '커리어', '관계', '습관'][map[p.site]] : '성격';
  }));

  return (
    <div className="anim-fade" style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(43,38,32,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="anim-scale" style={{
        width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
        padding: 24, boxShadow: '0 20px 60px rgba(43,38,32,0.3)', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, background: 'rgba(138,109,59,0.15)', color: 'var(--accent)',
          }}>
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{userName}</div>
            <div style={{ fontSize: 11, color: 'var(--hint)' }}>{userPosts.length}개의 공유 · {growth ? '성장 중 📈' : '활동 중'}</div>
          </div>
          <button
            onClick={block}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--error)',
            }}
          >
            🚫 차단
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--sub2)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {axes.size > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {[...axes].map(a => (
              <span key={a} style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 999, fontWeight: 700,
                background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)',
              }}>
                {a} 축
              </span>
            ))}
          </div>
        )}

        <div style={{ fontSize: 11, letterSpacing: 1, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>
          공유한 진단
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {userPosts.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--card2)', borderRadius: 8 }}>
              <span style={{ fontSize: 16 }}>{p.emoji || '🧩'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'var(--sub2)' }}>{p.result}</div>
              </div>
              {p.score !== null && p.score !== undefined && (
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>{p.score}점</span>
              )}
            </div>
          ))}
        </div>
      </div>
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
    <div className="anim-fade" style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(43,38,32,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="anim-scale" style={{
        width: '100%', maxWidth: 400, background: 'var(--card)',
        border: '1px solid var(--border)', borderRadius: 14,
        padding: 24, boxShadow: 'var(--shadow-modal)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', fontFamily: "'Noto Serif KR',serif" }}>
          ⚔️ 나와 비교 — {data.title}
        </h2>
        <div style={{ fontSize: 11, color: 'var(--sub2)', marginBottom: 16 }}>동일 진단을 받은 두 사람의 결과</div>

        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--card2)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>{data.user_name}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{data.result}</div>
            {data.score !== undefined && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>{data.score}점</div>}
          </div>
          <div style={{ textAlign: 'center', fontSize: 18 }}>▼</div>
          <div style={{ background: 'var(--card3)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--sub2)', marginBottom: 4 }}>나</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{mine?.result || '기록 없음'}</div>
            {mine?.score !== undefined && <div style={{ fontSize: 12, color: 'var(--sub2)', fontWeight: 700, marginTop: 2 }}>{mine.score}점</div>}
          </div>
        </div>

        {diff !== null && diff !== 0 && (
          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.6,
            background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--body-text)',
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
            fontSize: 13, fontWeight: 800, color: 'var(--bg)', background: 'var(--text)',
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
