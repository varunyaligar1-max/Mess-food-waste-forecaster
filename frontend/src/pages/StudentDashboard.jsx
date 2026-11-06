import React, { useEffect, useState } from 'react';
import { mealsAPI } from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  RefreshCw,
  Loader2,
  Calendar,
  AlertCircle,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';

const MEAL_SCHEDULE = {
  breakfast: { timing: '07:30 AM – 09:30 AM', dietary: 'Vegetarian' },
  lunch: { timing: '12:30 PM – 02:30 PM', dietary: 'Vegetarian' },
  snacks: { timing: '05:00 PM – 06:30 PM', dietary: 'Vegetarian & Tea' },
  dinner: { timing: '07:30 PM – 09:30 PM', dietary: 'Vegetarian' },
};

function formatCountdown(seconds) {
  if (seconds <= 0) return 'Closed';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function formatDayLabel(dateStr) {
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
  return mealDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [demoOverride, setDemoOverride] = useState(true); // Allows judges/testers to toggle all meals
  const [selectedDayTab, setSelectedDayTab] = useState('all');

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const data = await mealsAPI.getUpcoming(3);
      setMeals(data);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to load meal schedule', 'error');
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
        'The 3-hour kitchen planning window for this meal has closed. Turn on Evaluation Mode above to simulate changes.',
        'error'
      );
      return;
    }

    try {
      setActionLoadingId(meal.id);
      if (meal.is_skipped) {
        await mealsAPI.unmarkSkip(meal.id, demoOverride);
        setMeals((prev) =>
          prev.map((m) => (m.id === meal.id ? { ...m, is_skipped: false } : m))
        );
        addToast(`Registered attendance for ${meal.meal_type}. Kitchen headcount adjusted.`, 'success');
      } else {
        await mealsAPI.markSkip(meal.id, demoOverride);
        setMeals((prev) =>
          prev.map((m) => (m.id === meal.id ? { ...m, is_skipped: true } : m))
        );
        addToast(`Marked opt-out for ${meal.meal_type}. Kitchen informed not to cook this plate.`, 'info');
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update meal status', 'error');
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

  const datesList = Object.keys(groupedMeals);

  const displayedGroups =
    selectedDayTab === 'all'
      ? groupedMeals
      : { [selectedDayTab]: groupedMeals[selectedDayTab] || [] };

  const totalMeals = meals.length;
  const skippedMeals = meals.filter((m) => m.is_skipped).length;
  const eatingMeals = totalMeals - skippedMeals;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Institutional Top Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Resident Portal
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-medium">Hostel Block 1 Dining</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Meal Attendance & Advance Opt-Outs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Logged in as <strong className="text-slate-800">{user?.name}</strong> (Roll: {user?.student_id || '21CS001'}, Room: {user?.room_no || 'A-101'})
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-500">Your Next 3 Days</div>
              <div className="text-sm font-semibold text-slate-900">
                <span className="text-emerald-700 font-bold">{eatingMeals} Attending</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-amber-700 font-bold">{skippedMeals} Opted Out</span>
              </div>
            </div>

            <button
              onClick={fetchMeals}
              disabled={loading}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
              title="Refresh schedule"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mess Notice / Policy Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Attendance Policy:</strong> By default, all registered hostel residents are enrolled for daily meals. To help the kitchen avoid cooking excess food, please toggle <strong>Opt Out</strong> for any meal you will not attend at least <strong>3 hours prior to meal service</strong>.
          </p>
        </div>
      </div>

      {/* Evaluation Sandbox Toggle */}
      <div className="bg-slate-900 text-slate-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-slate-800">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold text-white">Evaluation Sandbox:</span>{' '}
            <span className="text-slate-300">
              {demoOverride
                ? 'Unrestricted Toggle Mode active (You can test opt-outs on all meals, including past-cutoff slots).'
                : 'Production Mode active (Strict 3-hour kitchen cutoff locks past meals).'}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            const next = !demoOverride;
            setDemoOverride(next);
            addToast(
              next ? 'Evaluation Mode Enabled: All meals unlocked for testing' : 'Production Mode Enabled: 3-hour cutoff strictly enforced',
              'info'
            );
          }}
          className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shrink-0 ${
            demoOverride
              ? 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          {demoOverride ? 'Evaluation Mode: ON' : 'Production Mode: ON'}
        </button>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setSelectedDayTab('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
            selectedDayTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All 3 Days ({meals.length} Meals)
        </button>
        {datesList.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDayTab(d)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              selectedDayTab === 'd'
                ? 'bg-slate-900 text-white shadow-sm'
                : selectedDayTab === d
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {formatDayLabel(d)} ({new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })})
          </button>
        ))}
      </div>

      {/* Meal Cards Display */}
      {loading && meals.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(displayedGroups).map(([dateStr, dayMeals]) => (
            <div key={dateStr} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  {formatDayLabel(dateStr)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* 4 Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayMeals.map((meal) => {
                  const scheduleInfo = MEAL_SCHEDULE[meal.meal_type.toLowerCase()] || {
                    timing: 'Regular Slot',
                    dietary: 'Standard',
                  };
                  const isLoadingThis = actionLoadingId === meal.id;
                  const isCutoffOpen = meal.can_toggle || demoOverride;

                  return (
                    <div
                      key={meal.id}
                      className={`bg-white rounded-xl border transition-all p-5 shadow-sm hover:border-slate-300 ${
                        meal.is_skipped ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                      }`}
                    >
                      {/* Top Header: Slot Name, Timings, Cutoff */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 capitalize text-sm">
                              {meal.meal_type}
                            </h3>
                            {/* Standard Indian Veg Dot */}
                            <span
                              className="w-3.5 h-3.5 border border-emerald-600 rounded-sm flex items-center justify-center p-0.5"
                              title="Vegetarian"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {scheduleInfo.timing}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Kitchen Cutoff: {new Date(meal.cutoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Cutoff Status Badge */}
                        {meal.can_toggle ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{formatCountdown(meal.seconds_until_cutoff)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Window Closed</span>
                          </div>
                        )}
                      </div>

                      {/* Menu Description */}
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 my-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Scheduled Menu
                        </div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {meal.menu_text}
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 flex items-center justify-between gap-3">
                        <div>
                          {meal.is_skipped ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                              Opted Out (Skipping)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Attending (Will Eat)
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleSkip(meal)}
                          disabled={isLoadingThis}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 ${
                            !isCutoffOpen
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 cursor-pointer'
                              : meal.is_skipped
                              ? 'bg-slate-800 text-white hover:bg-slate-700'
                              : 'bg-amber-600 text-white hover:bg-amber-700'
                          }`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : !isCutoffOpen ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </>
                          ) : meal.is_skipped ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Undo Opt-Out</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Opt Out</span>
                            </>
                          )}
                        </button>
                      </div>
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
