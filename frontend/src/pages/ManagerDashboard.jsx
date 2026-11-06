import React, { useEffect, useState } from 'react';
import { managerAPI } from '../api/client';
import { useToast } from '../components/Toast';
import {
  Calendar,
  ChefHat,
  Users,
  UserX,
  TrendingUp,
  BrainCircuit,
  PlusCircle,
  CheckCircle,
  FileText,
  Clock,
  X,
  Loader2,
  RefreshCw,
  BarChart2,
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

export default function ManagerDashboard() {
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state for logging actuals
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
      addToast(err.response?.data?.detail || 'Failed to fetch manager forecast', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedDate);
  }, [selectedDate]);

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
      // Pre-fill cooked_plates with suggested cook plates as a helpful default
      setActualForm({
        cooked_plates: meal.suggested_cook_plates.toString(),
        served_plates: meal.predicted_headcount.toString(),
        leftover_kg: '1.0',
        notes: '',
      });
    }
    setModalOpen(true);
  };

  const handleSaveActuals = async (e) => {
    e.preventDefault();
    if (!activeMeal) return;

    try {
      setSubmittingActual(true);
      await managerAPI.recordActuals({
        meal_id: activeMeal.meal_id,
        cooked_plates: parseInt(actualForm.cooked_plates, 10),
        served_plates: parseInt(actualForm.served_plates, 10),
        leftover_kg: parseFloat(actualForm.leftover_kg) || 0.0,
        notes: actualForm.notes || null,
      });
      addToast(`Actuals recorded for ${activeMeal.meal_type}!`, 'success');
      setModalOpen(false);
      fetchForecast(selectedDate);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to record meal actuals', 'error');
    } finally {
      setSubmittingActual(false);
    }
  };

  const meals = forecastData?.meals || [];
  const totalStudents = forecastData?.total_students || 40;
  const totalSkips = meals.reduce((sum, m) => sum + m.registered_skips, 0);
  const totalPredicted = meals.reduce((sum, m) => sum + m.predicted_headcount, 0);
  const totalSuggestedCook = meals.reduce((sum, m) => sum + m.suggested_cook_plates, 0);

  // Prepare chart series
  const chartData = meals.map((m) => ({
    name: m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1),
    'Predicted Headcount': m.predicted_headcount,
    'Suggested Cook Plates': m.suggested_cook_plates,
    'Actual Served Plates': m.actual ? m.actual.served_plates : null,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Controls: Date Picker + Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
              Manager Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">Aggregated Kitchen Forecast</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Mess Headcount & Cook Forecaster
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchForecast(selectedDate)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Mess Students</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <span className="text-[11px] text-slate-400 font-medium">Registered hostel inmates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Skips</span>
            <UserX className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{totalSkips}</div>
          <span className="text-[11px] text-slate-400 font-medium">Marked by students today</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Predicted Headcount</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalPredicted}</div>
          <span className="text-[11px] text-slate-400 font-medium">Across all 4 meals</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Suggested Cook Total</span>
            <ChefHat className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">{totalSuggestedCook} plates</div>
          <span className="text-[11px] text-slate-400 font-medium">Includes 5% safety buffer</span>
        </div>
      </div>

      {/* Main Forecast Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Kitchen Headcount Guidance ({selectedDate})
            </h2>
            <p className="text-xs text-slate-400">
              Student privacy protected: aggregated counts only.
            </p>
          </div>
        </div>

        {loading && !forecastData ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <span className="text-xs font-semibold">Calculating headcount predictions...</span>
          </div>
        ) : meals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No meals scheduled for {selectedDate}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Meal Slot</th>
                  <th className="py-3.5 px-5">Menu</th>
                  <th className="py-3.5 px-4 text-center">Skips</th>
                  <th className="py-3.5 px-4 text-center">Predicted Headcount</th>
                  <th className="py-3.5 px-4 text-center">Suggested Cook</th>
                  <th className="py-3.5 px-4 text-center">Method</th>
                  <th className="py-3.5 px-4 text-center">Actuals Logged</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meals.map((meal) => (
                  <tr key={meal.meal_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-slate-900 capitalize block">
                        {meal.meal_type}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Cutoff: {new Date(meal.cutoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 px-5 max-w-xs">
                      <p className="text-xs text-slate-700 font-medium truncate" title={meal.menu_text}>
                        {meal.menu_text}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-extrabold border border-amber-200">
                        {meal.registered_skips}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-extrabold text-slate-900 text-base">
                      {meal.predicted_headcount}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-lg bg-purple-50 text-purple-800 text-sm font-extrabold border border-purple-200">
                        {meal.suggested_cook_plates}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {meal.method === 'learned' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <BrainCircuit className="w-3 h-3 text-emerald-600" />
                          Learned Correction
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Baseline Buffer
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {meal.actual ? (
                        <div className="text-xs">
                          <span className="font-bold text-slate-900">
                            {meal.actual.served_plates} served
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            ({meal.actual.leftover_kg} kg left)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pending</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => openLogModal(meal)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          meal.actual
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {meal.actual ? (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            <span>Edit Actuals</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Log Actuals</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Visual Chart */}
      {meals.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                Predicted vs Suggested vs Actual Breakdown ({selectedDate})
              </h3>
              <p className="text-xs text-slate-400">
                Visual plate distribution per meal slot.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Suggested Cook Plates" fill="#a855f7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Predicted Headcount" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Actual Served Plates" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Log Actuals Modal */}
      {modalOpen && activeMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 capitalize">
                  Log Actuals: {activeMeal.meal_type}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedDate} • {activeMeal.menu_text.substring(0, 35)}...
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActuals} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cooked Plates *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={actualForm.cooked_plates}
                    onChange={(e) =>
                      setActualForm((prev) => ({ ...prev, cooked_plates: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Suggested was: {activeMeal.suggested_cook_plates}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Served Plates *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={actualForm.served_plates}
                    onChange={(e) =>
                      setActualForm((prev) => ({ ...prev, served_plates: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Predicted was: {activeMeal.predicted_headcount}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Leftover Food Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={actualForm.leftover_kg}
                  onChange={(e) =>
                    setActualForm((prev) => ({ ...prev, leftover_kg: e.target.value }))
                  }
                  placeholder="e.g. 1.5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kitchen Notes
                </label>
                <textarea
                  rows="2"
                  value={actualForm.notes}
                  onChange={(e) =>
                    setActualForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="e.g. Heavy rain during lunch; extra students stayed in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingActual}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
                >
                  {submittingActual ? 'Saving...' : 'Save Actuals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

