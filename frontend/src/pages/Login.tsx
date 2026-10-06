import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cloud, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-teal-500 text-white shadow-xl shadow-teal-500/30 mb-4">
          <Cloud size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">DevTrack</h2>
        <p className="mt-1 text-sm text-teal-200">
          Integrated Software Project Management System
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-teal-900/60 border border-teal-500/30 rounded-full text-xs text-teal-300">
          <ShieldCheck size={14} /> Google Cloud Native &bull; Cloud Run &bull; Firestore
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@devtrack.io"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Academic Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              1-Click Academic Demo Logins
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('pm@devtrack.io')}
                className="p-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg text-center transition"
              >
                <div className="font-bold">Sarah Chen</div>
                <div className="text-[10px] text-purple-500">Project Manager</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dev@devtrack.io')}
                className="p-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg text-center transition"
              >
                <div className="font-bold">Alex Rivera</div>
                <div className="text-[10px] text-blue-500">Developer</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('tester@devtrack.io')}
                className="p-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-lg text-center transition"
              >
                <div className="font-bold">Priya Sharma</div>
                <div className="text-[10px] text-amber-500">Tester</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
