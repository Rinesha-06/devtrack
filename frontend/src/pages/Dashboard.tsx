import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, Zap, CheckCircle2, AlertOctagon, Bug as BugIcon,
  Clock, ArrowUpRight, CheckSquare, Activity as ActivityIcon, RefreshCw,
  Users, ChevronRight, Briefcase, ShieldCheck, Plus
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { DashboardStats, Team } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isProjectManager } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, teamsRes] = await Promise.all([
        api.dashboard.getStats(),
        api.teams.list()
      ]);
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (teamsRes.data.success) {
        setTeams(teamsRes.data.teams);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="animate-spin mr-2" size={20} /> Loading DevTrack metrics...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600">No telemetry available. Please check database connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time project telemetry grounded in Google Cloud Firestore
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Projects</span>
            <FolderKanban size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalProjects}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
            <ArrowUpRight size={12} /> {stats.activeProjects} Active
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Sprints</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.activeSprints}</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats.totalSprints} Total Sprints</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tasks Done</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.completedTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats.pendingTasks} Pending</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Project Progress</span>
            <CheckSquare size={16} className="text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.overallProjectProgress}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all"
              style={{ width: `${stats.overallProjectProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Open Bugs</span>
            <BugIcon size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.openBugs}</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats.totalBugs} Total Logged</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Critical Bugs</span>
            <AlertOctagon size={16} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-2">{stats.criticalBugs}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {stats.bugResolutionRate}% Resolved
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Task Status Distribution</h3>
            <span className="text-xs text-slate-400">All Projects</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.taskStatusDistribution}>
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.taskStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bug Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Bug Lifecycle Status</h3>
            <span className="text-xs text-slate-400">Total: {stats.totalBugs} Bugs</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.bugStatusDistribution.filter(b => b.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.bugStatusDistribution.map((entry, index) => (
                    <Cell key={`bug-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Tasks by Priority Level</h3>
            <span className="text-xs text-slate-400">Total: {stats.totalTasks}</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.taskPriorityDistribution} layout="vertical">
                <XAxis type="number" fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                <YAxis dataKey="name" type="category" fontSize={11} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]}>
                  {stats.taskPriorityDistribution.map((entry, index) => (
                    <Cell key={`prio-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sprint Progress Cards */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Sprint Velocities & Progress</h3>
            <span className="text-xs text-slate-400">Agile Tracking</span>
          </div>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
            {stats.sprintProgressList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sprints created yet</p>
            ) : (
              stats.sprintProgressList.map(sprint => (
                <div key={sprint.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{sprint.name}</span>
                    <span className="text-teal-600">{sprint.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${sprint.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                    <span>Status: {sprint.status}</span>
                    <span>{sprint.completedTasks} / {sprint.totalTasks} Tasks</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team & Engineering Pod Management Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Teams & Engineering Pods</h3>
              <p className="text-[11px] text-slate-400">Cross-functional team assignments & role allocations</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/teams')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50/60 hover:bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 transition self-start sm:self-auto"
          >
            <span>{isProjectManager ? 'Manage Teams & Members' : 'View Team Roster'}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500">No teams registered yet.</p>
            {isProjectManager && (
              <button
                onClick={() => navigate('/teams')}
                className="mt-2 inline-flex items-center gap-1 text-xs text-teal-600 font-semibold hover:underline"
              >
                <Plus size={13} /> Create First Team
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {teams.slice(0, 6).map(team => {
              const members = team.members || [];
              const devCount = members.filter(m => m.role === 'DEVELOPER').length;
              const testerCount = members.filter(m => m.role === 'TESTER').length;

              return (
                <div
                  key={team.id}
                  onClick={() => navigate('/teams')}
                  className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 hover:border-teal-400/60 rounded-xl cursor-pointer transition shadow-2xs group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                        {team.name}
                      </h4>
                      {team.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{team.description}</p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 shrink-0">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium text-[10px]">
                        <Briefcase size={10} /> {devCount} Devs
                      </span>
                      <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium text-[10px]">
                        <ShieldCheck size={10} /> {testerCount} QA
                      </span>
                    </div>

                    {/* Mini avatar stack */}
                    <div className="flex items-center -space-x-1">
                      {members.slice(0, 3).map((m, idx) => (
                        <div
                          key={idx}
                          title={m.name || 'Member'}
                          className="h-5 w-5 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-700"
                        >
                          {(m.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Log Stream */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ActivityIcon size={18} className="text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">Live Audit & Activity Log</h3>
          </div>
          <span className="text-xs text-slate-400">Immutable Firestore Records</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {stats.recentActivities.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recorded activity yet</p>
          ) : (
            stats.recentActivities.map(act => (
              <div key={act.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{act.details}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Triggered by <span className="font-medium text-slate-700">{act.userName}</span> &bull; Action: <span className="text-teal-600 font-mono text-[10px]">{act.action}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                  <Clock size={12} />
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
