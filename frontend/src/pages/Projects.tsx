import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, Plus, Calendar, Github, AlertCircle,
  Clock, CheckCircle, ChevronRight, RefreshCw, X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Project, PriorityLevel } from '../types';

export const Projects: React.FC = () => {
  const { isProjectManager } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.projects.list();
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.projects.create({
        name,
        description,
        priority,
        repositoryUrl,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      if (res.data.success) {
        setShowModal(false);
        setName('');
        setDescription('');
        setRepositoryUrl('');
        fetchProjects();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Software Projects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage agile projects, sprint roadmaps, and cloud deployment targets
          </p>
        </div>

        {isProjectManager && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={18} /> Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">No projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(proj => (
            <div
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-teal-600 transition text-base">
                    {proj.name}
                  </h3>
                  {getPriorityBadge(proj.priority)}
                </div>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 space-y-3 pt-4 border-t border-slate-100 text-xs">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                    <span>Task Completion</span>
                    <span className="font-bold text-slate-900">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {proj.startDate} &rarr; {proj.endDate}
                  </span>
                  <span className="font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                    {proj.status}
                  </span>
                </div>

                {proj.repositoryUrl && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                    <Github size={13} />
                    <span className="truncate">{proj.repositoryUrl}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating a project */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Project</h3>
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
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Microservices Gateway"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Architectural overview and business requirements"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    value={repositoryUrl}
                    onChange={e => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
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
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
