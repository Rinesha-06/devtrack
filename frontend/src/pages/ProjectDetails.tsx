import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban, Calendar, Github, CheckSquare, Zap, Bug as BugIcon,
  BookOpen, Users, ArrowLeft, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Project, Task, Sprint, Bug, UserStory } from '../types';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'sprints' | 'bugs' | 'backlog'>('overview');

  useEffect(() => {
    if (id) {
      loadProjectData(id);
    }
  }, [id]);

  const loadProjectData = async (projectId: string) => {
    setLoading(true);
    try {
      const [projRes, tasksRes, sprintsRes, bugsRes, storiesRes] = await Promise.all([
        api.projects.getById(projectId),
        api.tasks.list({ projectId }),
        api.sprints.list(projectId),
        api.bugs.list({ projectId }),
        api.stories.list({ projectId })
      ]);

      if (projRes.data.success) setProject(projRes.data.project);
      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (sprintsRes.data.success) setSprints(sprintsRes.data.sprints);
      if (bugsRes.data.success) setBugs(bugsRes.data.bugs);
      if (storiesRes.data.success) setStories(storiesRes.data.stories);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <RefreshCw className="animate-spin mr-2" size={18} /> Loading project details...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">Project not found.</p>
        <button onClick={() => navigate('/projects')} className="mt-4 text-xs font-semibold text-teal-600 hover:underline">
          &larr; Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-3 transition"
        >
          <ArrowLeft size={14} /> Back to Projects
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                {project.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">{project.description}</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {project.repositoryUrl && (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
              >
                <Github size={14} /> Repository
              </a>
            )}
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Total Progress</div>
              <div className="text-lg font-bold text-teal-600">{project.progress}%</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'overview' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'tasks' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckSquare size={14} /> Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('sprints')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'sprints' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Zap size={14} /> Sprints ({sprints.length})
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'bugs' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BugIcon size={14} /> Bugs ({bugs.length})
          </button>
          <button
            onClick={() => setActiveTab('backlog')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'backlog' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={14} /> Backlog ({stories.length})
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-slate-800">Timeline & Goals</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Start Date</span>
                <span className="font-semibold text-slate-800">{project.startDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">End Date</span>
                <span className="font-semibold text-slate-800">{project.endDate}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Completion Progress</span>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-800">Project Telemetry</h3>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Tasks</span>
              <span className="font-semibold text-slate-800">{tasks.length}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Sprints</span>
              <span className="font-semibold text-slate-800">{sprints.length}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Open Bugs</span>
              <span className="font-semibold text-red-600">{bugs.filter(b => b.status !== 'CLOSED').length}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Members Assigned</span>
              <span className="font-semibold text-slate-800">{project.members?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 text-xs">
          {tasks.length === 0 ? (
            <p className="p-6 text-center text-slate-400">No tasks for this project</p>
          ) : (
            tasks.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{t.title}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{t.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">{t.status}</span>
                  <span className="text-slate-400">{t.dueDate}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sprints' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sprints.length === 0 ? (
            <p className="p-6 text-center text-slate-400 col-span-2">No sprints created yet</p>
          ) : (
            sprints.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">{s.status}</span>
                </div>
                <p className="text-slate-500 mt-1">{s.goal}</p>
                <div className="mt-3 flex justify-between text-slate-400 text-[11px]">
                  <span>{s.startDate} &rarr; {s.endDate}</span>
                  <span className="font-semibold text-teal-600">{s.progress || 0}% Done</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'bugs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 text-xs">
          {bugs.length === 0 ? (
            <p className="p-6 text-center text-slate-400">No bugs logged for this project</p>
          ) : (
            bugs.map(b => (
              <div key={b.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{b.title}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{b.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-semibold text-[10px]">{b.severity}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">{b.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'backlog' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 text-xs">
          {stories.length === 0 ? (
            <p className="p-6 text-center text-slate-400">No user stories in backlog</p>
          ) : (
            stories.map(st => (
              <div key={st.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{st.title}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{st.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded font-semibold text-[10px]">{st.storyPoints} Points</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">{st.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
