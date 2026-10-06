import React, { useEffect, useState } from 'react';
import {
  BookOpen, Plus, Sparkles, CheckCircle, AlertCircle,
  RefreshCw, X, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserStory, Project, Sprint, PriorityLevel } from '../types';

export const Backlog: React.FC = () => {
  const { isProjectManager } = useAuth();
  const [stories, setStories] = useState<UserStory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [projectId, setProjectId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [storyPoints, setStoryPoints] = useState(3);
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [storiesRes, projRes, sprintsRes] = await Promise.all([
        api.stories.list(),
        api.projects.list(),
        api.sprints.list()
      ]);

      if (storiesRes.data.success) setStories(storiesRes.data.stories);
      if (projRes.data.success) {
        setProjects(projRes.data.projects);
        if (!projectId && projRes.data.projects.length > 0) {
          setProjectId(projRes.data.projects[0].id);
        }
      }
      if (sprintsRes.data.success) setSprints(sprintsRes.data.sprints);
    } catch (err) {
      console.error('Failed to load backlog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.stories.create({
        projectId,
        sprintId: sprintId || undefined,
        title,
        description,
        acceptanceCriteria,
        storyPoints,
        priority
      });

      if (res.data.success) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setAcceptanceCriteria('');
        loadData();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create story');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Backlog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Prioritize user stories, estimate velocity in story points, and assign to upcoming sprints
          </p>
        </div>

        {isProjectManager && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus size={16} /> New User Story
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={18} /> Loading backlog...
        </div>
      ) : stories.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">No user stories in backlog.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User Story</th>
                  <th className="py-3 px-3">Story Points</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Acceptance Criteria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stories.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900">{st.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{st.description}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg font-bold">
                        {st.storyPoints} pts
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-700">{st.priority}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                        {st.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11px] italic">
                      {st.acceptanceCriteria || 'Standard acceptance criteria'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Story Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add User Story to Backlog</h3>
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
                  User Story Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="As a [role], I want [feature] so that [benefit]"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed user flow and motivation..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Acceptance Criteria
                </label>
                <textarea
                  rows={2}
                  value={acceptanceCriteria}
                  onChange={e => setAcceptanceCriteria(e.target.value)}
                  placeholder="Given... When... Then..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Story Points
                  </label>
                  <select
                    value={storyPoints}
                    onChange={e => setStoryPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {[1, 2, 3, 5, 8, 13].map(pt => (
                      <option key={pt} value={pt}>{pt} points</option>
                    ))}
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
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assign Sprint
                  </label>
                  <select
                    value={sprintId}
                    onChange={e => setSprintId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">(Backlog only)</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
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
                  Save Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
