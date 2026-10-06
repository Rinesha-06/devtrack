import React, { useEffect, useState } from 'react';
import {
  PlayCircle, CheckCircle2, XCircle, Clock, GitCommit,
  RefreshCw, Cloud, ShieldCheck, ArrowRight, Play
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BuildRecord } from '../types';

export const CicdView: React.FC = () => {
  const { isProjectManager } = useAuth();
  const [pipeline, setPipeline] = useState<any>(null);
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    setLoading(true);
    try {
      const res = await api.cicd.listBuilds();
      if (res.data.success) {
        setPipeline(res.data.pipeline);
        setBuilds(res.data.builds);
      }
    } catch (err) {
      console.error('Failed to load CI/CD data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await api.cicd.triggerBuild({ branch: 'main', commit: 'HEAD' });
      fetchBuilds();
    } catch (err) {
      console.error('Failed to trigger build:', err);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CI/CD Pipeline — Cloud Build</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated testing, container compilation, Artifact Registry push, and Cloud Run zero-downtime deployment
          </p>
        </div>

        {isProjectManager && (
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Play size={14} /> {triggering ? 'Executing Pipeline...' : 'Trigger Cloud Build'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={18} /> Loading Cloud Build status...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cloud Build Pipeline Visual Stages */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">cloudbuild.yaml Deployment Pipeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated workflow trigger: On Push to main branch</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> Active & Passing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-5">
              {pipeline?.stages?.map((stage: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">{stage.name}</span>
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{stage.status}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <div>Target: <span className="font-mono text-slate-800">{pipeline?.targetService}</span></div>
              <div className="font-mono text-[11px] text-slate-500 truncate max-w-lg">
                Registry: {pipeline?.artifactRegistry}
              </div>
            </div>
          </div>

          {/* Build History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Build History & Execution Log</h3>
              <span className="text-xs text-slate-400">Total: {builds.length} builds</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Build #</th>
                    <th className="py-3 px-3">Commit</th>
                    <th className="py-3 px-3">Branch</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-4 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {builds.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        #{b.buildNumber}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        {b.commit}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {b.branch}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> {b.durationSeconds}s
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {new Date(b.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {b.status === 'SUCCESS' ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                            SUCCESS
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[10px]">
                            FAILED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
