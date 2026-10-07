import React, { useEffect, useState } from 'react';
import {
  Github, GitBranch, GitCommit, Star, AlertCircle,
  ExternalLink, Clock, RefreshCw, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { RepositoryDetails } from '../types';

export const GitHubView: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/Rinesha-06/devtrack');
  const [repo, setRepo] = useState<RepositoryDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepo();
  }, []);

  const fetchRepo = async () => {
    setLoading(true);
    try {
      const res = await api.github.getRepository(repoUrl);
      if (res.data.success) {
        setRepo(res.data.repository);
      }
    } catch (err) {
      console.error('Failed to load GitHub repository:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GitHub Integration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Seamless DevOps link between Git commits and DevTrack tasks / Cloud Run deployment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none w-64 bg-white"
          />
          <button
            onClick={fetchRepo}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Connect
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={18} /> Fetching repository telemetry from GitHub API...
        </div>
      ) : !repo ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">Failed to fetch repository information.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Repository Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Github size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {repo.owner} / <span className="text-teal-600">{repo.repo}</span>
                    </h2>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-600 transition"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{repo.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                  <GitBranch size={14} className="text-teal-600" />
                  <span>{repo.defaultBranch}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                  <Star size={14} className="text-amber-500" />
                  <span>{repo.stars || 42} Stars</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                  <AlertCircle size={14} className="text-rose-500" />
                  <span>{repo.openIssues || 3} Issues</span>
                </div>
              </div>
            </div>

            {/* Latest Commit Highlight */}
            {repo.latestCommit && (
              <div className="mt-4 p-4 bg-teal-50/50 border border-teal-100 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <GitCommit size={18} className="text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">{repo.latestCommit.message}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Authored by <span className="font-medium text-slate-700">{repo.latestCommit.author}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-teal-700 self-end sm:self-auto">
                  <span className="px-2 py-0.5 bg-teal-100 rounded font-bold">{repo.latestCommit.sha}</span>
                  <span className="text-slate-400">{new Date(repo.latestCommit.date).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Commit History Feed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Recent Git Commits Telemetry</h3>
              <span className="text-xs text-slate-400">Branch: {repo.defaultBranch}</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {repo.commits?.map(commit => (
                <div key={commit.sha} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <GitCommit size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">{commit.message}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        By <span className="font-medium text-slate-600">{commit.author}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                      {commit.sha}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(commit.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
