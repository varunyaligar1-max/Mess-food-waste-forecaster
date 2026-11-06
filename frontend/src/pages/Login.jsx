import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { UtensilsCrossed, Lock, Mail, Loader2, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'student' or 'manager'
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail, loginPassword) => {
    try {
      setLoading(true);
      const user = await login(loginEmail, loginPassword);
      addToast(`Welcome back, ${user.name}!`, 'success');
      if (user.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }
    handleLogin(email, password);
  };

  const handle1ClickDemo = (demoEmail, demoPassword, role) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setDemoLoading(role);
    handleLogin(demoEmail, demoPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-600/20 mb-4">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Mess Food-Waste Forecaster
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Smart skip declarations & ML headcount prediction for hostel messes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          {/* 1-Click Instant Demo Access (Prominently Placed at the Top) */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center mb-3">
              ⚡ Instant 1-Click Demo Login
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handle1ClickDemo('student1@hostel.com', 'student123', 'student')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm disabled:opacity-50"
              >
                {demoLoading === 'student' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )}
                <span>Student Demo</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handle1ClickDemo('manager@mess.com', 'manager123', 'manager')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition-all shadow-sm disabled:opacity-50"
              >
                {demoLoading === 'manager' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                )}
                <span>Manager Demo</span>
              </button>
            </div>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Click either button to log in immediately without typing credentials.
            </p>
          </div>

          {/* Regular Manual Credentials Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student1@hostel.com"
                  className="block w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 mt-2"
            >
              {loading && !demoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              New student in the hostel?{' '}
              <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
