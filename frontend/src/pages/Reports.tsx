import React, { useEffect, useState } from 'react';
import {
  BarChart3, PieChart as PieChartIcon, TrendingUp, CheckCircle2,
  Bug, Zap, RefreshCw, FileText
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats } from '../types';

export const Reports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.dashboard.getStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <RefreshCw className="animate-spin mr-2" size={18} /> Generating analytical reports...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Quantitative software engineering metrics: Velocity, Bug Resolution Rates & Burndown
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition"
        >
          <FileText size={14} /> Export / Print Report
        </button>
      </div>

      {/* KPI Performance Formula Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Project Completion Rate
            </span>
            <CheckCircle2 size={16} className="text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-teal-600">{stats.overallProjectProgress}%</div>
          <p className="text-[11px] text-slate-400 font-mono">Formula: Completed Tasks / Total Tasks &times; 100</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${stats.overallProjectProgress}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bug Resolution Efficiency
            </span>
            <Bug size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{stats.bugResolutionRate}%</div>
          <p className="text-[11px] text-slate-400 font-mono">Formula: Closed Bugs / Total Bugs &times; 100</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${stats.bugResolutionRate}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Sprint Velocity
            </span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {stats.sprintProgressList[0]?.progress || 0}%
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Formula: Sprint Completed / Sprint Total &times; 100</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div
              className="bg-amber-500 h-2 rounded-full"
              style={{ width: `${stats.sprintProgressList[0]?.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Task Lifecycle Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.taskStatusDistribution}>
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.taskStatusDistribution.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Defect Severity Impact Ratio</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.bugSeverityDistribution.filter(s => s.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.bugSeverityDistribution.map((entry, index) => (
                    <Cell key={`sev-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
