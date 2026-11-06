import React, { useEffect, useState } from 'react';
import { managerAPI } from '../api/client';
import { useToast } from '../components/Toast';
import {
  Calendar,
  ChefHat,
  Users,
  UserX,
  TrendingUp,
  FileCheck2,
  X,
  Loader2,
  RefreshCw,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ManagerDashboard() {
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Closeout / Reconciliation Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState(null);
  const [actualForm, setActualForm] = useState({
    cooked_plates: '',
    served_plates: '',
    leftover_kg: '',
    notes: '',
  });
  const [submittingActual, setSubmittingActual] = useState(false);

  const fetchForecast = async (date) => {
    try {
      setLoading(true);
      const data = await managerAPI.getForecast(date);
      setForecastData(data);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to fetch headcount forecast', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedDate);
  }, [selectedDate]);

  const changeDateByDays = (delta) => {
    const curr = new Date(selectedDate + 'T00:00:00');
    curr.setDate(curr.getDate() + delta);
    setSelectedDate(getLocalDateString(curr));
  };

  const openLogModal = (meal) => {
    setActiveMeal(meal);
    if (meal.actual) {
      setActualForm({
        cooked_plates: meal.actual.cooked_plates.toString(),
        served_plates: meal.actual.served_plates.toString(),
        leftover_kg: meal.actual.leftover_kg.toString(),
        notes: meal.actual.notes || '',
      });
    } else {
      setActualForm({
        cooked_plates: meal.suggested_cook_plates.toString(),
        served_plates: meal.predicted_headcount.toString(),
        leftover_kg: '1.2',
        notes: '',
      });
    }
    setModalOpen(true);
  };

  const handleSaveActuals = async (e) => {
    e.preventDefault();
    if (!activeMeal) return;

    const cooked = parseInt(actualForm.cooked_plates, 10);
    const served = parseInt(actualForm.served_plates, 10);
    const leftover = parseFloat(actualForm.leftover_kg);

    if (isNaN(cooked) || isNaN(served)) {
      addToast('Please enter valid plate counts', 'error');
      return;
    }

    try {
      setSubmittingActual(true);
      await managerAPI.recordActuals({
        meal_id: activeMeal.meal_id,
        cooked_plates: Math.max(0, cooked),
        served_plates: Math.max(0, served),
        leftover_kg: isNaN(leftover) ? 0.0 : Math.max(0, leftover),
        notes: actualForm.notes || null,
      });
      addToast(`Meal reconciliation logged for ${activeMeal.meal_type}!`, 'success');
      setModalOpen(false);
      fetchForecast(selectedDate);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to log meal reconciliation', 'error');
    } finally {
      setSubmittingActual(false);
    }
  };

  const meals = forecastData?.meals || [];
  const totalStudents = forecastData?.total_students || 40;
  const totalSkips = meals.reduce((sum, m) => sum + m.registered_skips, 0);
  const totalPredicted = meals.reduce((sum, m) => sum + m.predicted_headcount, 0);
  const totalSuggestedCook = meals.reduce((sum, m) => sum + m.suggested_cook_plates, 0);

  const chartData = meals.map((m) => ({
    name: m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1),
    'Recommended Production': m.suggested_cook_plates,
    'Forecasted Turnout': m.predicted_headcount,
    'Dispensed Plates': m.actual ? m.actual.served_plates : null,
  }));

  const isToday = selectedDate === getLocalDateString();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Institutional Header & Operations Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kitchen Operations Command
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-medium">Hostel Dining Hall 1</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Production Planning & Headcount Guidance
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Data-backed meal preparation quotas factoring in advance student opt-outs and historical turnout variance.
            </p>
          </div>

          {/* Date Picker Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => changeDateByDays(-1)}
                title="Previous Day"
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
              <button
                onClick={() => changeDateByDays(1)}
                title="Next Day"
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(getLocalDateString())}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                Today
              </button>
            )}

            <button
              onClick={() => fetchForecast(selectedDate)}
              disabled={loading}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
              title="Refresh forecasts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Operational Indicators Row */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Active Residents Enrolled</span>
            <span className="font-bold text-slate-900 text-sm">{totalStudents} Diners</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Advance Opt-Outs Today</span>
            <span className="font-bold text-amber-700 text-sm">{totalSkips} Declarations</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Net Projected Turnout</span>
            <span className="font-bold text-emerald-700 text-sm">{totalPredicted} Plates</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Recommended Prep (+5% buffer)</span>
            <span className="font-bold text-purple-700 text-sm">{totalSuggestedCook} Plates</span>
          </div>
        </div>
      </div>

      {/* Guidance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Daily Kitchen Preparation Quotas ({selectedDate})
            </h2>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Aggregates Only • Student Privacy Enforced
            </span>
          </div>
        </div>

        {loading && !forecastData ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span className="text-xs font-medium">Computing headcount variance...</span>
          </div>
        ) : meals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-xs font-semibold">No meals scheduled for {selectedDate}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Slot & Timing</th>
                  <th className="py-3 px-4">Scheduled Menu</th>
                  <th className="py-3 px-3 text-center">Opt-Outs</th>
                  <th className="py-3 px-3 text-center">Projected Turnout</th>
                  <th className="py-3 px-3 text-center">Recommended Prep</th>
                  <th className="py-3 px-3 text-center">Method</th>
                  <th className="py-3 px-3 text-center">Reconciliation Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meals.map((meal) => (
                  <tr key={meal.meal_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <span className="capitalize block text-sm font-bold">{meal.meal_type}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Cutoff: {new Date(meal.cutoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-700">
                      <p className="truncate font-medium" title={meal.menu_text}>
                        {meal.menu_text}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {meal.registered_skips}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-900 text-sm">
                      {meal.predicted_headcount}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded text-sm">
                        {meal.suggested_cook_plates}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {meal.method === 'learned' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Learned Correction
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Baseline +5%
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {meal.actual ? (
                        <div className="text-[11px]">
                          <span className="font-semibold text-slate-900">
                            {meal.actual.cooked_plates} prepared • {meal.actual.served_plates} dispensed
                          </span>
                          <span className="text-slate-400 block font-mono">
                            Surplus: {meal.actual.leftover_kg} kg
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending Closeout</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openLogModal(meal)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                          meal.actual
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {meal.actual ? 'Edit Reconciliation' : 'Reconcile Meal'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Production Chart */}
      {meals.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-700" />
              Turnout Variance vs Production Quotas ({selectedDate})
            </h3>
            <p className="text-xs text-slate-400">
              Visual comparison between kitchen preparation quotas and actual plates dispensed to diners.
            </p>
          </div>

          <div className="h-64 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Recommended Production" fill="#9333ea" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Forecasted Turnout" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Dispensed Plates" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reconciliation Modal */}
      {modalOpen && activeMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 capitalize">
                  Meal Closeout: {activeMeal.meal_type}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedDate} • {activeMeal.menu_text.substring(0, 30)}...
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveActuals} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plates Cooked / Prepared *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={actualForm.cooked_plates}
                    onChange={(e) =>
                      setActualForm((prev) => ({ ...prev, cooked_plates: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Recommended was: {activeMeal.suggested_cook_plates}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plates Dispensed / Served *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={actualForm.served_plates}
                    onChange={(e) =>
                      setActualForm((prev) => ({ ...prev, served_plates: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Forecast was: {activeMeal.predicted_headcount}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Surplus / Food Waste Discarded (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={actualForm.leftover_kg}
                  onChange={(e) =>
                    setActualForm((prev) => ({ ...prev, leftover_kg: e.target.value }))
                  }
                  placeholder="e.g. 1.2"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Supervisor Notes
                </label>
                <textarea
                  rows="2"
                  value={actualForm.notes}
                  onChange={(e) =>
                    setActualForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="e.g. Heavy rain during service; extra students ate indoors"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingActual}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingActual ? 'Saving...' : 'Save Closeout Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
