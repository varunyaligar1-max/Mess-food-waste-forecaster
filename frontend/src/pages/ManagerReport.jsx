import React, { useEffect, useState } from 'react';
import { managerAPI, adminAPI } from '../api/client';
import { useToast } from '../components/Toast';
import {
  BarChart3,
  TrendingDown,
  Scale,
  Sparkles,
  Database,
  Loader2,
  HelpCircle,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ManagerReport() {
  const { addToast } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await managerAPI.getReport();
      setReport(data);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to fetch performance report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSeedFromReport = async () => {
    try {
      setSeeding(true);
      await adminAPI.seed(true);
      addToast('Historical data seeded! Reloading analytics...', 'success');
      fetchReport();
    } catch (err) {
      addToast('Failed to seed historical data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600">Analyzing historical meal waste metrics...</p>
      </div>
    );
  }

  // Business rule compliance: insufficient data (< 3 meals)
  if (report?.insufficient_data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-amber-700" />
          </div>
          <h2 className="text-2xl font-extrabold text-amber-900 tracking-tight">
            Insufficient Actual Data ({report.total_logged_meals} Logged Meals)
          </h2>
          <p className="mt-2 text-sm text-amber-800 max-w-lg mx-auto leading-relaxed">
            <strong>Business Rule Enforced:</strong> The forecaster never claims food waste was reduced without verified historical logs. At least <strong>3 recorded meals</strong> are required to generate comparative accuracy and waste reduction metrics.
          </p>

          <div className="mt-6 pt-6 border-t border-amber-200/60 flex items-center justify-center gap-4">
            <button
              onClick={handleSeedFromReport}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>Load 14 Days of Realistic Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const comparison = report?.waste_comparison;
  const historySeries = report?.history_series || [];

  // Line chart data (Predicted vs Actual over time)
  const lineChartData = historySeries.slice(-20).map((item) => ({
    label: `${String(item.date).substring(5)} (${item.meal_type.substring(0, 1).toUpperCase()})`,
    'Predicted Headcount': item.predicted_headcount,
    'Actual Served Plates': item.served_plates,
    'Plates Cooked': item.cooked_plates,
  }));

  // Waste comparison bar chart
  const wasteBarData = [
    {
      name: 'Before Forecaster (Static ~95%)',
      'Total Cooked': comparison?.baseline_cooked_plates || 0,
      'Total Served': comparison?.system_served_plates || 0,
      'Plates Wasted': comparison?.baseline_wasted_plates || 0,
    },
    {
      name: 'With Forecaster (Active System)',
      'Total Cooked': comparison?.system_cooked_plates || 0,
      'Total Served': comparison?.system_served_plates || 0,
      'Plates Wasted': comparison?.system_wasted_plates || 0,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Audit & Verification
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Based on {report.total_logged_meals} logged meals
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Food Waste Reduction & Accuracy Report
          </h1>
        </div>

        <button
          onClick={fetchReport}
          className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Report</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waste Reduction Percentage */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg shadow-emerald-700/15">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Waste Reduced</span>
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="text-3xl font-black">
            {comparison?.waste_reduction_percentage}%
          </div>
          <span className="text-xs text-emerald-100 font-medium block mt-1">
            Fewer plates discarded in trash
          </span>
        </div>

        {/* Plates Saved */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Plates Saved</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {comparison?.plates_saved}
          </div>
          <span className="text-xs text-slate-400 font-medium block mt-1">
            Avoided cooking excess food
          </span>
        </div>

        {/* Weight Saved in KG */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Food Weight Saved</span>
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600">
            {comparison?.kg_saved} kg
          </div>
          <span className="text-xs text-slate-400 font-medium block mt-1">
            ~350g avg meal plate weight
          </span>
        </div>

        {/* Accuracy (MAE) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Forecast Error (MAE)</span>
            <HelpCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {report.mae} <span className="text-sm font-semibold text-slate-400">plates</span>
          </div>
          <span className="text-xs text-slate-400 font-medium block mt-1">
            MAPE error: {report.mape}%
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Time Series Accuracy */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm min-w-0">
          <div className="mb-5">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Predicted Headcount vs Actual Served
            </h3>
            <p className="text-xs text-slate-400">
              Recent meals tracking how closely prediction matched real attendance.
            </p>
          </div>

          <div className="h-72 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="Predicted Headcount"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Actual Served Plates"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Plates Cooked"
                  stroke="#a855f7"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Waste Comparison Before vs After */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm min-w-0">
          <div className="mb-5">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-purple-600" />
              Food Waste: Before vs After Forecaster
            </h3>
            <p className="text-xs text-slate-400">
              Total plates cooked, served, and wasted over {report.total_logged_meals} logged meals.
            </p>
          </div>

          <div className="h-72 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={wasteBarData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Total Cooked" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Total Served" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Plates Wasted" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Detailed Historical Meal Logs
            </h2>
            <p className="text-xs text-slate-400">
              Complete audit trail of predicted vs served plates and food waste
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            {historySeries.length} Records
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 sticky top-0 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4 text-center">Predicted</th>
                <th className="py-3 px-4 text-center">Cooked</th>
                <th className="py-3 px-4 text-center">Served</th>
                <th className="py-3 px-4 text-center">Leftover Plates</th>
                <th className="py-3 px-4 text-center">Leftover (kg)</th>
                <th className="py-3 px-4 text-center">Error (MAE)</th>
                <th className="py-3 px-5 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historySeries.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors text-xs">
                  <td className="py-3 px-5 font-bold text-slate-900">{item.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 capitalize">{item.meal_type}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">{item.predicted_headcount}</td>
                  <td className="py-3 px-4 text-center font-bold text-purple-600">{item.cooked_plates}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{item.served_plates}</td>
                  <td className="py-3 px-4 text-center font-bold text-rose-500">{item.leftover_plates}</td>
                  <td className="py-3 px-4 text-center font-medium text-slate-600">{item.leftover_kg} kg</td>
                  <td className="py-3 px-4 text-center font-medium text-slate-500">{item.absolute_error} ({item.percentage_error}%)</td>
                  <td className="py-3 px-5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.method === 'learned'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.method}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
