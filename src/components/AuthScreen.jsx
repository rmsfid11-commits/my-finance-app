import { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Wallet, Mail, ArrowLeft } from 'lucide-react';

const ERR_MAP = { 'auth/user-not-found': '계정이 없습니다', 'auth/wrong-password': '비밀번호가 틀렸습니다', 'auth/email-already-in-use': '이미 사용중인 이메일', 'auth/weak-password': '비밀번호 6자 이상', 'auth/invalid-email': '이메일 형식 확인', 'auth/popup-closed-by-user': '' };

function AuthScreen({ onSkip }) {
  const [mode, setMode] = useState('main');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const google = async () => {
    setBusy(true); setErr('');
    try { await signInWithPopup(auth, googleProvider); } catch (e) { setErr(ERR_MAP[e.code] ?? e.message); }
    setBusy(false);
  };
  const emailAuth = async () => {
    if (!email || pw.length < 6) { setErr('이메일과 비밀번호(6자+)를 입력하세요'); return; }
    setBusy(true); setErr('');
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, pw);
      else await signInWithEmailAndPassword(auth, email, pw);
    } catch (e) { setErr(ERR_MAP[e.code] ?? e.message); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
      <div className="glass rounded-3xl p-8 mx-6 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#3182F6]/15 flex items-center justify-center mx-auto mb-4">
          <Wallet size={32} className="text-[#3182F6]" />
        </div>
        <h1 className="text-xl font-black text-c-text mb-1">MyFinance</h1>
        <p className="text-sm text-c-text2 mb-6">클라우드에 안전하게 저장</p>
        {err && <div className="text-xs text-red-400 mb-3 bg-red-500/10 rounded-xl p-2">{err}</div>}
        {mode === 'main' ? (
          <div className="space-y-3">
            <button onClick={google} disabled={busy} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-gray-800 font-bold text-sm shadow-md disabled:opacity-50">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google로 시작
            </button>
            <button onClick={() => { setMode('email'); setErr(''); }} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl glass-inner text-c-text font-bold text-sm">
              <Mail size={18} /> 이메일로 시작
            </button>
            <button onClick={onSkip} className="w-full py-3 text-sm text-c-text3 font-medium">로그인 없이 체험하기</button>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="비밀번호 (6자 이상)" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && emailAuth()} />
            <button onClick={emailAuth} disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? '...' : isSignUp ? '회원가입' : '로그인'}</button>
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-[#3182F6] font-medium">{isSignUp ? '이미 계정이 있어요' : '계정 만들기'}</button>
            <button onClick={() => { setMode('main'); setErr(''); }} className="flex items-center justify-center gap-1 text-xs text-c-text3 mx-auto"><ArrowLeft size={12} /> 뒤로</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthScreen;
