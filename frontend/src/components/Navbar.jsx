import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { adminAPI } from '../api/client';
import {
  Utensils,
  BarChart2,
  CalendarCheck2,
  LogOut,
  Database,
  Loader2,
  Menu,
  X,
  Building2,
  UserCheck,
  Shield,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    addToast('Logged out of dining portal', 'info');
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await adminAPI.seed(true);
      addToast('Demo database refreshed with 14 days of historical logs!', 'success');
      window.location.reload();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to refresh demo data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  if (!user) return null;

  const isManager = user.role === 'manager';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link
            to={isManager ? '/manager' : '/student'}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white block leading-tight">
                  Hostel Dining Services
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  Hall 1
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-normal">
                Meal Headcount & Waste Forecaster
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-800">
            {!isManager && (
              <Link
                to="/student"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === '/student'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                Meal Attendance & Opt-Outs
              </Link>
            )}

            {isManager && (
              <>
                <Link
                  to="/manager"
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === '/manager'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                  Kitchen Prep & Turnout
                </Link>
                <Link
                  to="/manager/report"
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                    location.pathname === '/manager/report'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                  Waste & Variance Reports
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Reset Data */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            title="Reload 14-day historical mess dataset"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <Database className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">{seeding ? 'Reloading...' : 'Reset Demo Data'}</span>
          </button>

          {/* User profile capsule */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white leading-tight">
                  {user.name}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider ${
                    isManager
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {isManager ? 'Kitchen Admin' : 'Resident'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                {user.student_id ? `ID: ${user.student_id} • Room ${user.room_no || 'NA'}` : 'Mess In-Charge'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-slate-800 bg-slate-900 space-y-1">
          {!isManager && (
            <Link
              to="/student"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-medium ${
                location.pathname === '/student'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Meal Attendance & Opt-Outs
            </Link>
          )}

          {isManager && (
            <>
              <Link
                to="/manager"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-xs font-medium ${
                  location.pathname === '/manager'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Kitchen Prep & Turnout
              </Link>
              <Link
                to="/manager/report"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-xs font-medium ${
                  location.pathname === '/manager/report'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Waste & Variance Reports
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
