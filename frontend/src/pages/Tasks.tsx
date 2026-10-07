import React, { useEffect, useState } from 'react';
import {
  CheckSquare, Plus, Clock, User, AlertCircle, ArrowRight,
  ArrowLeft, RefreshCw, X, Filter
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Task, TaskStatus, PriorityLevel, Project, User as UserType } from '../types';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [formError, setFormError] = useState<string | null>(null);

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'TO DO', title: 'To Do', color: 'border-slate-300' },
    { id: 'IN PROGRESS', title: 'In Progress', color: 'border-blue-400' },
    { id: 'REVIEW', title: 'Review', color: 'border-purple-400' },
    { id: 'TESTING', title: 'Testing', color: 'border-amber-400' },
    { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-400' }
  ];

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projRes, usersRes] = await Promise.all([
        api.tasks.list(selectedProject ? { projectId: selectedProject } : undefined),
        api.projects.list(),
        api.auth.getUsers()
      ]);

      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (projRes.data.success) {
        setProjects(projRes.data.projects);
        if (!projectId && projRes.data.projects.length > 0) {
          setProjectId(projRes.data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.tasks.updateStatus(taskId, newStatus);
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert if failed
      loadData();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.tasks.create({
        projectId,
        title,
        description,
        priority,
        dueDate: dueDate || undefined,
        estimatedHours,
        assignedTo: assignedTo || user?.id
      });

      if (res.data.success) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setAssignedTo('');
        loadData();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold rounded">MEDIUM</span>;
      case 'LOW':
        return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive Kanban Board</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time agile task progression with automatic Firestore state synchronization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={18} /> Syncing board...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start">
          {columns.map((col, colIdx) => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`bg-slate-100/70 border-t-4 ${col.color} rounded-xl p-3 flex flex-col min-h-[500px] shadow-sm`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    {col.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-white text-slate-600 rounded-full text-[11px] font-bold shadow-xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                      Drop or Move Here
                    </div>
                  ) : (
                    colTasks.map(t => (
                      <div
                        key={t.id}
                        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-slate-800 leading-snug">{t.title}</span>
                          {getPriorityBadge(t.priority)}
                        </div>

                        {t.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {t.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {t.dueDate || 'No due date'}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <User size={11} className="text-teal-600" />
                            {users.find(u => u.id === t.assignedTo)?.name || 'Assigned'}
                          </span>
                        </div>

                        {/* Transition Action Buttons */}
                        <div className="flex items-center justify-between pt-1">
                          {colIdx > 0 ? (
                            <button
                              onClick={() => moveTask(t.id, columns[colIdx - 1].id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                              title={`Move to ${columns[colIdx - 1].title}`}
                            >
                              <ArrowLeft size={13} />
                            </button>
                          ) : <div />}

                          {colIdx < columns.length - 1 ? (
                            <button
                              onClick={() => moveTask(t.id, columns[colIdx + 1].id)}
                              className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition"
                              title={`Advance to ${columns[colIdx + 1].title}`}
                            >
                              <ArrowRight size={13} />
                            </button>
                          ) : <div />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Agile Task</h3>
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
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Implement Dockerfile multi-stage build"
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
                  placeholder="Technical specifications and acceptance criteria"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assign To (Team Member)
                </label>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">Assign to Me ({user?.name || 'Current User'})</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — [{u.role}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedHours}
                    onChange={e => setEstimatedHours(Number(e.target.value))}
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
