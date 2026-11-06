import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Utensils, Lock, Mail, Loader2, ArrowRight, Building2, User, KeyRound } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail, loginPassword) => {
    try {
      setLoading(true);
      const user = await login(loginEmail, loginPassword);
      addToast(`Authenticated as ${user.name}`, 'success');
      if (user.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter your email and password', 'error');
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3.5 shadow-sm">
          <Utensils className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Hostel Dining Services Portal
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Meal Headcount Forecasting & Operational Waste Reduction
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-950/80 border border-slate-800 py-7 px-5 shadow-xl sm:rounded-2xl sm:px-8">
          {/* Quick Evaluation Role Switcher */}
          <div className="mb-6 pb-5 border-b border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block text-center mb-2.5">
              Evaluation Sandbox • Instant 1-Click Login
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handle1ClickDemo('student1@hostel.com', 'student123', 'student')}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:border-emerald-500 hover:text-emerald-400 transition-all disabled:opacity-50"
              >
                {demoLoading === 'student' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Student Resident</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handle1ClickDemo('manager@mess.com', 'manager123', 'manager')}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:border-purple-500 hover:text-purple-400 transition-all disabled:opacity-50"
              >
                {demoLoading === 'manager' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>Mess In-Charge</span>
              </button>
            </div>
          </div>

          {/* Standard Institutional Sign In Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Institutional Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student1@hostel.com"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {loading && !demoLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center pt-4 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              New resident student?{' '}
              <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
                Register hostel ID
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
