import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Fish, ShieldAlert, KeyRound, Mail } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sams.com');
  const [password, setPassword] = useState('seafood123');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = login(email, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('seafood123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      
      {/* Dynamic graphic backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-ocean-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ocean-500 to-teal-400 flex items-center justify-center shadow-lg shadow-ocean-500/20 mb-3 animate-bounce">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Marlin Portal</h2>
          <p className="text-slate-400 text-sm mt-1 text-center">Marlin Sea Food Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-ocean-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <button type="button" className="text-xs text-ocean-400 hover:text-ocean-300">Forgot?</button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-ocean-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4.5 h-4.5 rounded bg-slate-950 border border-slate-800 text-ocean-500 focus:ring-0"
              />
              <span className="text-xs text-slate-400">Remember session</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold text-sm shadow-lg shadow-ocean-500/10 transition-all hover:scale-[1.01]"
          >
            Authenticate Securely
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-850">
          <div className="text-xs text-slate-450 mb-3 font-semibold text-center uppercase tracking-wide">Quick Demo Role Login</div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <button onClick={() => handleQuickFill('super@sams.com')} className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[11px] font-medium text-slate-300">
              CEO (Super Admin)
            </button>
            <button onClick={() => handleQuickFill('admin@sams.com')} className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[11px] font-medium text-slate-300">
              Admin
            </button>
            <button onClick={() => handleQuickFill('billing@sams.com')} className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[11px] font-medium text-slate-300">
              Billing Staff
            </button>
            <button onClick={() => handleQuickFill('export@sams.com')} className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[11px] font-medium text-slate-300">
              Export Company (View)
            </button>
          </div>
          <div className="text-center text-[10px] text-slate-500 mt-3">Demo Password: <span className="text-slate-400 font-mono">seafood123</span></div>
        </div>
      </div>
    </div>
  );
}
