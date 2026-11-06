import React, { useEffect, useState } from 'react';
import { mealsAPI } from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Coffee,
  Sun,
  Cookie,
  Moon,
  Sparkles,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  snacks: Cookie,
  dinner: Moon,
};

function formatCountdown(seconds) {
  if (seconds <= 0) return 'Passed';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDateHeader(dateStr) {
  const mealDate = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (mealDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (mealDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }
  return mealDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [demoOverride, setDemoOverride] = useState(true); // Default to true in development for best demo experience!

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const data = await mealsAPI.getUpcoming(3);
      setMeals(data);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to load upcoming meals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
    const interval = setInterval(() => {
      setMeals((prev) =>
        prev.map((m) => ({
          ...m,
          seconds_until_cutoff: Math.max(0, m.seconds_until_cutoff - 60),
          can_toggle: m.seconds_until_cutoff - 60 > 0,
        }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSkip = async (meal) => {
    const isLocked = !meal.can_toggle && !demoOverride;

    if (isLocked) {
      addToast(
        '🔒 Cutoff Passed: Changes for this meal locked 3 hours prior to service. Enable "Demo Test Mode" above to toggle past-cutoff meals!',
        'error'
      );
      return;
    }

    try {
      setActionLoadingId(meal.id);
      if (meal.is_skipped) {
        // Cancel skip -> return to Eating
        await mealsAPI.unmarkSkip(meal.id, demoOverride);
        setMeals((prev) =>
          prev.map((m) => (m.id === meal.id ? { ...m, is_skipped: false } : m))
        );
        addToast(`Marked as EATING ${meal.meal_type}!`, 'success');
      } else {
        // Mark as Skip
        await mealsAPI.markSkip(meal.id, demoOverride);
        setMeals((prev) =>
          prev.map((m) => (m.id === meal.id ? { ...m, is_skipped: true } : m))
        );
        addToast(`Marked ${meal.meal_type} as SKIPPED. Thanks for preventing food waste!`, 'info');
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Could not update meal skip status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Group meals by date
  const groupedMeals = meals.reduce((acc, meal) => {
    const key = meal.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(meal);
    return acc;
  }, {});

  const totalUpcoming = meals.length;
  const totalSkipping = meals.filter((m) => m.is_skipped).length;
  const totalEating = totalUpcoming - totalSkipping;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/10 mb-6 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Hostel Mess Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hi, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
            By marking meals you won't attend before the cutoff, you help the kitchen cook exact quantities and prevent hundreds of kilograms of food waste.
          </p>
        </div>

        {/* Quick status counters */}
        <div className="mt-6 pt-6 border-t border-emerald-500/40 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <span className="text-2xl font-black block">{totalUpcoming}</span>
            <span className="text-xs text-emerald-100 font-medium">Scheduled Meals</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <span className="text-2xl font-black block text-emerald-200">{totalEating}</span>
            <span className="text-xs text-emerald-100 font-medium">Eating (Default)</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <span className="text-2xl font-black block text-amber-200">{totalSkipping}</span>
            <span className="text-xs text-emerald-100 font-medium">Skipping</span>
          </div>
        </div>
      </div>

      {/* Demo Evaluation Mode Control Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-800 block">
              Hackathon Evaluation Mode
            </span>
            <span className="text-[11px] text-slate-500">
              {demoOverride
                ? 'Demo Mode Active: You can toggle any meal (including today\'s) to test live headcount adjustments.'
                : 'Strict Mode Active: 3-hour cutoff rule strictly enforced. Past meals are locked.'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !demoOverride;
            setDemoOverride(next);
            addToast(
              next ? 'Demo Mode enabled (All meals unlocked for testing)' : 'Strict Cutoff Rule enforced (Past meals locked)',
              'info'
            );
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
            demoOverride
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {demoOverride ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          <span>{demoOverride ? 'Demo Mode: ON' : 'Strict Mode: ON'}</span>
        </button>
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Upcoming Meal Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Default is <strong className="text-emerald-700">Eating</strong>. Toggle to <strong className="text-amber-700">Skip</strong> if you won't attend.
          </p>
        </div>

        <button
          onClick={fetchMeals}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && meals.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200/60 p-5 animate-pulse" />
          ))}
        </div>
      ) : Object.keys(groupedMeals).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-sm font-bold text-slate-700">No upcoming meals scheduled</p>
          <p className="text-xs text-slate-400 mt-1">Please ask the mess manager to seed meal schedules.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMeals).map(([dateStr, dayMeals]) => (
            <div key={dateStr}>
              {/* Day Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider bg-slate-200/70 px-3 py-1 rounded-lg">
                  {formatDateHeader(dateStr)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Meal Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayMeals.map((meal) => {
                  const Icon = MEAL_ICONS[meal.meal_type.toLowerCase()] || Calendar;
                  const isLoadingThis = actionLoadingId === meal.id;
                  const isToggleable = meal.can_toggle || demoOverride;

                  return (
                    <div
                      key={meal.id}
                      className={`relative rounded-2xl border transition-all duration-200 p-5 bg-white shadow-sm hover:shadow-md ${
                        meal.is_skipped
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-slate-200/80 hover:border-emerald-300'
                      }`}
                    >
                      {/* Top Bar: Meal Type + Cutoff Pill */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-base capitalize block leading-tight">
                              {meal.meal_type}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Cutoff: {new Date(meal.cutoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Cutoff Pill */}
                        {meal.can_toggle ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                            <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
                            <span>Cutoff in {formatCountdown(meal.seconds_until_cutoff)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Cutoff Passed</span>
                          </div>
                        )}
                      </div>

                      {/* Menu Description */}
                      <div className="my-3 min-h-[44px]">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                          {meal.menu_text}
                        </p>
                      </div>

                      {/* Bottom Toggle Bar */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* Current Status Pill */}
                        <div className="flex items-center gap-2">
                          {meal.is_skipped ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                              Skipping
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Eating
                            </span>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSkip(meal)}
                          disabled={isLoadingThis}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            !isToggleable
                              ? 'bg-slate-200 text-slate-500 hover:bg-slate-300 cursor-pointer'
                              : meal.is_skipped
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20'
                          }`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : !isToggleable ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked (Passed)</span>
                            </>
                          ) : meal.is_skipped ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Cancel Skip (Eat)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Mark as Skip</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Locked helper text */}
                      {!meal.can_toggle && !demoOverride && (
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                          🔒 Cutoff closed 3 hours prior to service. Enable Demo Mode above to unlock.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
