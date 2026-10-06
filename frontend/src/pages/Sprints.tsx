import React, { useEffect, useState } from 'react';
import {
  Zap, Plus, Calendar, Target, CheckCircle2, AlertCircle,
  RefreshCw, X, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Sprint, Project, SprintStatus } from '../types';

export const Sprints: React.FC = () => {
  const { isProjectManager } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<SprintStatus>('Planned');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sprintsRes, projRes] = await Promise.all([
        api.sprints.list(),
        api.projects.list()
      ]);

      if (sprintsRes.data.success) setSprints(sprintsRes.data.sprints);
      if (projRes.data.success) {
        setProjects(projRes.data.projects);
        if (!projectId && projRes.data.projects.length > 0) {
          setProjectId(projRes.data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load sprints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.sprints.create({
        projectId,
        name,
        goal,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status
      });

      if (res.data.success) {
        setShowModal(false);
        setName('');
        setGoal('');
        loadData();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create sprint');
    }
  };

  const handleStatusChange = async (sprintId: string, newStatus: SprintStatus) => {
    try {
      await api.sprints.update(sprintId, { status: newStatus });
      loadData();
    } catch (err) {
      console.error('Failed to update sprint:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agile Sprint Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Time-boxed iterations with goal orientation and automated velocity calculation
          </p>
        </div>

        {isProjectManager && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus size={16} /> Plan New Sprint
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={18} /> Loading sprints...
        </div>
      ) : sprints.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">No sprints planned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sprints.map(s => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'Active'
                        ? 'bg-amber-100 text-amber-800'
                        : s.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2 font-medium">
                  <Target size={14} className="text-teal-600 shrink-0" />
                  <span>Goal: {s.goal || 'Continuous delivery & feature testing'}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                    <span>Sprint Velocity & Progress</span>
                    <span className="font-bold text-slate-900">{s.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${s.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {s.startDate} &rarr; {s.endDate}
                  </span>
                  <span>{s.completedTasks || 0} / {s.totalTasks || 0} Tasks</span>
                </div>

                {isProjectManager && (
                  <div className="flex items-center justify-end gap-1.5 pt-2">
                    {s.status === 'Planned' && (
                      <button
                        onClick={() => handleStatusChange(s.id, 'Active')}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded text-[11px] transition"
                      >
                        Start Sprint
                      </button>
                    )}
                    {s.status === 'Active' && (
                      <button
                        onClick={() => handleStatusChange(s.id, 'Completed')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-[11px] transition"
                      >
                        Complete Sprint
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Sprint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Plan Agile Sprint</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Project *
                </label>
                <select
                  required
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Sprint Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sprint 4 — Infrastructure & Logging"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Sprint Goal *
                </label>
                <textarea
                  rows={2}
                  required
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="What is the objective of this iteration?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
