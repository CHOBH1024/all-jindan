// API 클라이언트 — pomyjo-api 연동
const API = 'https://api.pomyjo.com/api';

export interface User {
  id: number;
  email: string;
  name: string;
  provider: string;
  avatar?: string | null;
}

export interface ServerDiagnosis {
  id: number;
  site: string;
  title: string;
  result: string;
  emoji: string;
  score?: number;
  created_at: number;
  shared: number;
  user_name?: string;
  user_id?: number;
  like_count?: number;
  comment_count?: number;
}

export function getToken(): string | null {
  return localStorage.getItem('alljindan_token');
}

export function setToken(t: string | null) {
  if (t) localStorage.setItem('alljindan_token', t);
  else localStorage.removeItem('alljindan_token');
}

export function getSavedUser(): User | null {
  try {
    const u = localStorage.getItem('alljindan_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function saveUser(u: User | null) {
  if (u) localStorage.setItem('alljindan_user', JSON.stringify(u));
  else localStorage.removeItem('alljindan_user');
}

async function req(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  register: (email: string, name: string) => req('POST', '/auth/register', { email, name }),
  login: (email: string) => req('POST', '/auth/login', { email }),
  google: (email: string, name: string, avatar?: string) => req('POST', '/auth/google', { email, name, avatar }),
  me: () => req('GET', '/me'),
  myDiagnoses: () => req('GET', '/me/diagnoses'),
  addDiagnosis: (d: { site: string; title: string; result: string; emoji?: string; score?: number }) =>
    req('POST', '/me/diagnoses', d),
  deleteDiagnosis: (id: number) => req('DELETE', `/me/diagnoses/${id}`),
  shareDiagnosis: (id: number) => req('POST', `/me/diagnoses/${id}/share`),
  feed: () => req('GET', '/feed'),
  feedComments: (id: number) => req('GET', `/feed/${id}/comments`),
  addFeedComment: (id: number, body: string) => req('POST', `/feed/${id}/comments`, { body }),
  toggleLike: (id: number) => req('POST', `/feed/${id}/like`),
  deleteAccount: () => req('DELETE', '/me'),
  exportData: () => req('GET', '/me/export'),
  follow: (userId: number) => req('POST', `/users/${userId}/follow`),
  unfollow: (userId: number) => req('DELETE', `/users/${userId}/follow`),
  myFollowing: () => req('GET', '/me/following'),
  weeklyReport: () => req('GET', '/me/weekly-report'),
};
