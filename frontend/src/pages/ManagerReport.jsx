import React, { useEffect, useState } from 'react';
import { managerAPI, adminAPI } from '../api/client';
import { useToast } from '../components/Toast';
import {
  BarChart2,
  TrendingDown,
  Scale,
  DollarSign,
  Download,
  Loader2,
  ShieldAlert,
  RefreshCw,
  Leaf,
  FileSpreadsheet,
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
      addToast(err.response?.data?.detail || 'Failed to fetch audit report', 'error');
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

  // Export CSV download function
  const handleExportCSV = () => {
    if (!report?.history_series || report.history_series.length === 0) {
      addToast('No historical records to export', 'error');
      return;
    }

    const headers = [
      'Date',
      'Meal Slot',
      'Predicted Headcount',
      'Cooked Plates',
      'Served Plates',
      'Leftover Plates',
      'Leftover Food (kg)',
      'Prediction Error (MAE)',
      'Error Percentage (%)',
      'Forecasting Method',
    ];

    const rows = report.history_series.map((item) => [
      item.date,
      item.meal_type,
      item.predicted_headcount,
      item.cooked_plates,
      item.served_plates,
      item.leftover_plates,
      item.leftover_kg,
      item.absolute_error,
      item.percentage_error,
      item.method,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hostel_mess_food_waste_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Audit log exported successfully as CSV!', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-600">Analyzing institutional waste variance & audit metrics...</p>
      </div>
    );
  }

  // Business rule compliance: insufficient data (< 3 meals)
  if (report?.insufficient_data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white border border-amber-300 rounded-xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6 text-amber-700" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Insufficient Audit Records ({report.total_logged_meals} Logged Meals)
          </h2>
          <p className="mt-2 text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            <strong>Institutional Audit Rule:</strong> To prevent unsubstantiated claims, the forecaster requires at least <strong>3 verified meal closeout logs</strong> before calculating waste reductions, cost savings, and statistical variance.
          </p>

          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-center gap-3">
            <button
              onClick={handleSeedFromReport}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              )}
              <span>Load 14-Day Baseline Dataset</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const comparison = report?.waste_comparison;
  const historySeries = report?.history_series || [];

  // Calculate estimated financial and environmental savings
  const estimatedCostPerPlate = 45; // Standard Indian hostel mess food preparation cost: ₹45/plate
  const totalRupeesSaved = (comparison?.plates_saved || 0) * estimatedCostPerPlate;
  const co2AvoidedKg = ((comparison?.kg_saved || 0) * 2.5).toFixed(1); // Standard 2.5 kg CO2e per kg food waste avoided

  // Line chart data
  const lineChartData = historySeries.slice(-20).map((item) => ({
    label: `${String(item.date).substring(5)} (${item.meal_type.substring(0, 1).toUpperCase()})`,
    'Predicted Headcount': item.predicted_headcount,
    'Dispensed Plates': item.served_plates,
    'Cooked Plates': item.cooked_plates,
  }));

  // Waste comparison bar chart
  const wasteBarData = [
    {
      name: 'Unoptimized (~95% Flat Batch)',
      'Total Cooked': comparison?.baseline_cooked_plates || 0,
      'Total Consumed': comparison?.system_served_plates || 0,
      'Discarded Surplus': comparison?.baseline_wasted_plates || 0,
    },
    {
      name: 'With Forecaster (Active System)',
      'Total Cooked': comparison?.system_cooked_plates || 0,
      'Total Consumed': comparison?.system_served_plates || 0,
      'Discarded Surplus': comparison?.system_wasted_plates || 0,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Auditing & Variance Analysis
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-medium">
                Sample Size: {report.total_logged_meals} Logged Meals
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Food Waste Reduction & Cost Audit Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Empirical evaluation comparing unoptimized 95% baseline preparation against data-driven headcount guidance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-sm"
              title="Download full historical spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Audit CSV</span>
            </button>

            <button
              onClick={fetchReport}
              className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
              title="Refresh Report"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waste Reduction Percentage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Surplus Reduction</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {comparison?.waste_reduction_percentage}%
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
            Fewer plates discarded in waste bins
          </span>
        </div>

        {/* Estimated Financial Savings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Estimated Budget Saved</span>
            <span className="text-xs font-bold text-slate-400">₹</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{totalRupeesSaved.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
            Based on {comparison?.plates_saved} plates saved @ ₹45/plate
          </span>
        </div>

        {/* Food Weight Saved */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Food Diverted From Landfill</span>
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {comparison?.kg_saved} kg
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
            Avoids ~{co2AvoidedKg} kg CO₂e greenhouse gas
          </span>
        </div>

        {/* Model Accuracy (MAE) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Turnout Forecast Error</span>
            <span className="text-[10px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">MAE</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ±{report.mae} <span className="text-xs font-normal text-slate-400">plates/meal</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
            MAPE variance: {report.mape}%
          </span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Time Series Accuracy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-700" />
              Turnout Tracking: Predicted vs Actual Attendance
            </h3>
            <p className="text-xs text-slate-400">
              Recent meal slots showing convergence of predicted headcount with actual plates dispensed.
            </p>
          </div>

          <div className="h-64 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <LineChart data={lineChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="Predicted Headcount"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Dispensed Plates"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Cooked Plates"
                  stroke="#9333ea"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Comparative Waste Reduction */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-700" />
              Food Waste Audit: Baseline vs Active Forecaster
            </h3>
            <p className="text-xs text-slate-400">
              Cumulative plates prepared, consumed, and discarded across all {report.total_logged_meals} logged meals.
            </p>
          </div>

          <div className="h-64 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <BarChart data={wasteBarData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Total Cooked" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total Consumed" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Discarded Surplus" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Audit Trail Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Verified Meal Closeout Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Chronological ledger of meal slots, preparation quotas, and surplus measurements.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {historySeries.length} Entries
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Slot</th>
                <th className="py-2.5 px-3 text-center">Predicted</th>
                <th className="py-2.5 px-3 text-center">Cooked</th>
                <th className="py-2.5 px-3 text-center">Served</th>
                <th className="py-2.5 px-3 text-center">Leftover Plates</th>
                <th className="py-2.5 px-3 text-center">Surplus (kg)</th>
                <th className="py-2.5 px-3 text-center">Variance (MAE)</th>
                <th className="py-2.5 px-4 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {historySeries.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{item.date}</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-700 capitalize">{item.meal_type}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{item.predicted_headcount}</td>
                  <td className="py-2.5 px-3 text-center text-purple-700">{item.cooked_plates}</td>
                  <td className="py-2.5 px-3 text-center text-blue-700">{item.served_plates}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-600">{item.leftover_plates}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{item.leftover_kg} kg</td>
                  <td className="py-2.5 px-3 text-center text-slate-500">±{item.absolute_error} ({item.percentage_error}%)</td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      item.method === 'learned'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
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
