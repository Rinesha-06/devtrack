import React, { useEffect, useState } from 'react';
import {
  Bug as BugIcon, Plus, AlertCircle, CheckCircle2, ShieldAlert,
  Clock, X, Check, Filter, MessageSquare, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Bug, BugStatus, BugSeverity, PriorityLevel, Project } from '../types';

export const Bugs: React.FC = () => {
  const { user, isTester, isDeveloper } = useAuth();

  const [bugs, setBugs] = useState<Bug[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [resolvingBug, setResolvingBug] = useState<Bug | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  // New Bug form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [severity, setSeverity] = useState<BugSeverity>('MEDIUM');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [environment, setEnvironment] = useState('Google Cloud Run');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterProject, filterStatus, filterSeverity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bugsRes, projRes] = await Promise.all([
        api.bugs.list({
          projectId: filterProject || undefined,
          status: filterStatus || undefined,
          severity: filterSeverity || undefined
        }),
        api.projects.list()
      ]);

      if (bugsRes.data.success) setBugs(bugsRes.data.bugs);
      if (projRes.data.success) {
        setProjects(projRes.data.projects);
        if (!projectId && projRes.data.projects.length > 0) {
          setProjectId(projRes.data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load bugs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.bugs.create({
        projectId,
        title,
        description,
        severity,
        priority,
        environment,
        stepsToReproduce,
        expectedResult,
        actualResult
      });

      if (res.data.success) {
        setShowReportModal(false);
        setTitle('');
        setDescription('');
        setStepsToReproduce('');
        setExpectedResult('');
        setActualResult('');
        loadData();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to report bug');
    }
  };

  const handleUpdateStatus = async (bugId: string, status: BugStatus, resolution?: string) => {
    try {
      await api.bugs.updateStatus(bugId, status, resolution);
      setResolvingBug(null);
      setResolutionText('');
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getSeverityBadge = (s: BugSeverity) => {
    switch (s) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">LOW</span>;
    }
  };

  const getStatusBadge = (st: BugStatus) => {
    switch (st) {
      case 'OPEN':
        return <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold rounded">OPEN</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-semibold rounded">ASSIGNED</span>;
      case 'IN PROGRESS':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold rounded">IN PROGRESS</span>;
      case 'FIXED':
        return <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-semibold rounded">FIXED</span>;
      case 'VERIFIED':
        return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold rounded">VERIFIED</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded">CLOSED</span>;
      case 'REOPENED':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-semibold rounded">REOPENED</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bug Tracking Module</h1>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end defect management lifecycle: Report &rarr; Assign &rarr; Fix &rarr; Verify &rarr; Close
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus size={16} /> Report New Bug
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <Filter size={14} className="text-slate-400" /> Filters:
        </div>

        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none bg-white text-slate-700"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none bg-white text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN PROGRESS">In Progress</option>
          <option value="FIXED">Fixed</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none bg-white text-slate-700"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <button
          onClick={loadData}
          className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Bugs List Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={18} /> Loading bug reports...
        </div>
      ) : bugs.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">No bugs matching current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Bug Details</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Environment</th>
                  <th className="py-3 px-3">Resolution</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bugs.map(bug => (
                  <tr key={bug.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900">{bug.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{bug.description}</div>
                      {bug.stepsToReproduce && (
                        <div className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">
                          Steps: {bug.stepsToReproduce}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {getSeverityBadge(bug.severity)}
                    </td>

                    <td className="py-3.5 px-3">
                      {getStatusBadge(bug.status)}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                      {bug.environment}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 max-w-xs text-[11px]">
                      {bug.resolution ? (
                        <span className="text-emerald-700 font-medium">{bug.resolution}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unresolved</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Developer action: Fix bug */}
                        {['OPEN', 'ASSIGNED', 'IN PROGRESS', 'REOPENED'].includes(bug.status) && (
                          <button
                            onClick={() => {
                              setResolvingBug(bug);
                              setResolutionText('');
                            }}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded text-[11px] transition"
                          >
                            Mark Fixed
                          </button>
                        )}

                        {/* Tester action: Verify & Close */}
                        {bug.status === 'FIXED' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(bug.id, 'VERIFIED')}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded text-[11px] transition"
                            >
                              Verify Fix
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(bug.id, 'CLOSED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition"
                            >
                              Close Bug
                            </button>
                          </>
                        )}

                        {bug.status === 'VERIFIED' && (
                          <button
                            onClick={() => handleUpdateStatus(bug.id, 'CLOSED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition"
                          >
                            Close Bug
                          </button>
                        )}

                        {bug.status === 'CLOSED' && (
                          <button
                            onClick={() => handleUpdateStatus(bug.id, 'REOPENED')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Bug Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Report Defect / Bug</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReport} className="space-y-4 mt-4 text-xs">
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
                  Bug Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Memory leak during large JSON batch parse"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Severity *
                  </label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as BugSeverity)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Environment
                  </label>
                  <input
                    type="text"
                    value={environment}
                    onChange={e => setEnvironment(e.target.value)}
                    placeholder="Cloud Run / Production"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Steps to Reproduce
                </label>
                <textarea
                  rows={2}
                  value={stepsToReproduce}
                  onChange={e => setStepsToReproduce(e.target.value)}
                  placeholder="1. Navigate to...\n2. Execute action..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Result
                  </label>
                  <input
                    type="text"
                    value={expectedResult}
                    onChange={e => setExpectedResult(e.target.value)}
                    placeholder="Normal response 200"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Actual Result
                  </label>
                  <input
                    type="text"
                    value={actualResult}
                    onChange={e => setActualResult(e.target.value)}
                    placeholder="500 Internal Server Error"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Submit Bug Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Bug Modal */}
      {resolvingBug && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Resolve Defect</h3>
              <button onClick={() => setResolvingBug(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-600 font-medium">
                Resolving: <span className="font-bold text-slate-900">{resolvingBug.title}</span>
              </p>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Resolution Notes *
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={e => setResolutionText(e.target.value)}
                  placeholder="Detail the code fix, configuration change, or patch applied..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingBug(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(resolvingBug.id, 'FIXED', resolutionText)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Confirm Fix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
