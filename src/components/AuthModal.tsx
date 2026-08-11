import { useState } from 'react';
import { api, setToken, saveUser, type User } from '../api';

interface Props {
  onClose: () => void;
  onLogin: (u: User) => void;
}

export function AuthModal({ onClose, onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.includes('@')) { setError('이메일 형식을 확인해주세요'); return; }
    setLoading(true);
    setError('');
    try {
      const r = mode === 'register' ? await api.register(email, name || email.split('@')[0]) : await api.login(email);
      setToken(r.token);
      saveUser(r.user);
      onLogin(r.user);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    // Google OAuth 간이: 사용자가 이메일 입력 시 해당 계정으로 로그인
    if (!email.includes('@')) { setError('Google 계정 이메일을 입력해주세요'); return; }
    setLoading(true);
    setError('');
    api.google(email, email.split('@')[0]).then(r => {
      setToken(r.token);
      saveUser(r.user);
      onLogin(r.user);
      onClose();
    }).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380, background: '#fffdf8', border: '1px solid #e5ded2', borderRadius: 20,
          padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{mode === 'login' ? '로그인' : '회원가입'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a9081', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0e9dc', padding: 4, borderRadius: 12 }}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800,
                background: mode === m ? '#6366f1' : 'transparent', color: mode === m ? '#fff' : '#9a9081',
              }}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="닉네임"
            style={inputStyle}
          />
        )}
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="이메일"
          style={{ ...inputStyle, marginTop: 8 }}
        />

        {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 10 }}>{error}</div>}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 800, color: '#fff',
            background: '#2b2620', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 12px' }}>
          <div style={{ flex: 1, height: 1, background: '#e5ded2' }} />
          <span style={{ fontSize: 11, color: '#9a9081' }}>또는</span>
          <div style={{ flex: 1, height: 1, background: '#e5ded2' }} />
        </div>

        <button
          onClick={googleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
            fontSize: 14, fontWeight: 700, background: '#e5ded2', border: '1px solid #ddd3c2', color: '#3d3830',
          }}
        >
          🌐 Google로 로그인
        </button>
        <div style={{ fontSize: 11, color: '#9a9081', marginTop: 10, textAlign: 'center' }}>
          Google 로그인은 이메일 인증으로 간편하게 처리됩니다
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14,
  background: '#f0e9dc', border: '1px solid #ddd3c2', color: '#3d3830',
  outline: 'none', boxSizing: 'border-box',
};
