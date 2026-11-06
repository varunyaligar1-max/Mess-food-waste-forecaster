import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { adminAPI } from '../api/client';
import {
  UtensilsCrossed,
  BarChart3,
  CalendarDays,
  LogOut,
  Database,
  User as UserIcon,
  Loader2,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    addToast('Logged out successfully', 'info');
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await adminAPI.seed(true);
      addToast('Demo database re-seeded successfully with 14 days of data!', 'success');
      // Reload current route data
      window.location.reload();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to seed database', 'error');
    } finally {
      setSeeding(false);
    }
  };

  if (!user) return null;

  const isManager = user.role === 'manager';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link
            to={isManager ? '/manager' : '/student'}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                Mess<span className="text-emerald-600">Waste</span>
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Hostel Forecaster
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {!isManager && (
              <Link
                to="/student"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === '/student'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Upcoming Meals
              </Link>
            )}

            {isManager && (
              <>
                <Link
                  to="/manager"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === '/manager'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Daily Forecast
                </Link>
                <Link
                  to="/manager/report"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === '/manager/report'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Waste Analytics & Reports
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side tools & User */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Seed Button */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            title="Reset sample data for hackathon demo"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Database className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{seeding ? 'Seeding...' : 'Reset Demo Data'}</span>
          </button>

          {/* User profile capsule */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    isManager
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                {user.student_id ? `Roll: ${user.student_id}` : user.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

