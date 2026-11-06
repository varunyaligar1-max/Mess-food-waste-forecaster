import React, { useEffect, useState } from 'react';
import { mealsAPI } from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Coffee,
  Sun,
  Cookie,
  Moon,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  snacks: Cookie,
  dinner: Moon,
};

const MEAL_COLORS = {
  breakfast: 'from-amber-500 to-orange-500 text-amber-900 bg-amber-50 border-amber-200',
  lunch: 'from-amber-600 to-yellow-500 text-yellow-900 bg-yellow-50 border-yellow-200',
  snacks: 'from-orange-500 to-rose-400 text-orange-900 bg-orange-50 border-orange-200',
  dinner: 'from-indigo-600 to-blue-600 text-indigo-900 bg-indigo-50 border-indigo-200',
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
    // Refresh countdown every 60 seconds
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
    if (!meal.can_toggle) {
      addToast('Cutoff time has passed for this meal. Status is locked.', 'error');
      return;
    }

    try {
      setActionLoadingId(meal.id);
      if (meal.is_skipped) {
        // Currently skipped -> switch back to Eating
        await mealsAPI.unmarkSkip(meal.id);
        setMeals((prev) =>
          prev.map((m) => (m.id === meal.id ? { ...m, is_skipped: false } : m))
        );
        addToast(`You are now marked as EATING ${meal.meal_type}!`, 'success');
      } else {
        // Currently eating -> switch to Skipping
        await mealsAPI.markSkip(meal.id);
        setMeals((prev) =>
          prev.map((m) => (m.id === meal.id ? { ...m, is_skipped: true } : m))
        );
        addToast(`Marked ${meal.meal_type} as SKIPPED. Thanks for helping reduce waste!`, 'info');
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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/10 mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Hostel Mess Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hi, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
            By marking meals you won't attend before the cutoff time, you help the mess manager cook exact quantities and prevent thousands of kilograms of food waste every month.
          </p>
        </div>

        {/* Quick status counters */}
        <div className="mt-6 pt-6 border-t border-emerald-500/40 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <span className="text-2xl font-black block">{totalUpcoming}</span>
            <span className="text-xs text-emerald-100 font-medium">Next 3 Days</span>
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

      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Upcoming Meal Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Default status is <strong className="text-emerald-700">Eating</strong>. Toggle to <strong className="text-amber-700">Skip</strong> if you'll be eating out.
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
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No upcoming meals scheduled</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {dayMeals.map((meal) => {
                  const Icon = MEAL_ICONS[meal.meal_type.toLowerCase()] || UtensilsCrossed;
                  const isLoadingThis = actionLoadingId === meal.id;

                  return (
                    <div
                      key={meal.id}
                      className={`relative rounded-2xl border transition-all duration-200 p-5 bg-white shadow-sm hover:shadow-md ${
                        meal.is_skipped
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-slate-200/80 hover:border-emerald-300'
                      }`}
                    >
                      {/* Top Bar: Meal Type + Cutoff Countdown */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60`}>
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
                        {/* Current Status Indicator */}
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
                          onClick={() => handleToggleSkip(meal)}
                          disabled={!meal.can_toggle || isLoadingThis}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            meal.is_skipped
                              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                              : 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-600/20'
                          }`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
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

                      {/* Locked notification helper */}
                      {!meal.can_toggle && (
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                          🔒 Cutoff window closed 3 hours prior to service.
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

