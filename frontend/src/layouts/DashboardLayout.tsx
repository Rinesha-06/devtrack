import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Zap, BookOpen,
  Bug, Users, Github, PlayCircle, BarChart3, Bell, LogOut,
  Menu, X, Cloud, CheckCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Notification } from '../types';

export const DashboardLayout: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await api.dashboard.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.dashboard.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      // ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Kanban Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Sprints', path: '/sprints', icon: Zap },
    { name: 'Backlog', path: '/backlog', icon: BookOpen },
    { name: 'Bugs', path: '/bugs', icon: Bug },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'GitHub', path: '/github', icon: Github },
    { name: 'CI/CD Cloud Build', path: '/cicd', icon: PlayCircle },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 }
  ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'PROJECT_MANAGER':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200">Project Manager</span>;
      case 'DEVELOPER':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">Developer</span>;
      case 'TESTER':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">Tester</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Cloud size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">DevTrack</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded">GCP</span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Integrated Software Project Management</p>
            </div>
          </div>
        </div>

        {/* Demo Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Academic Demo Switcher */}
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 px-2 font-medium">Demo Switch:</span>
            <button
              onClick={() => switchDemoRole('PROJECT_MANAGER')}
              className={`px-2 py-1 rounded font-medium transition ${
                user?.role === 'PROJECT_MANAGER' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PM
            </button>
            <button
              onClick={() => switchDemoRole('DEVELOPER')}
              className={`px-2 py-1 rounded font-medium transition ${
                user?.role === 'DEVELOPER' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Developer
            </button>
            <button
              onClick={() => switchDemoRole('TESTER')}
              className={`px-2 py-1 rounded font-medium transition ${
                user?.role === 'TESTER' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tester
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative transition"
              title="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-800">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`py-2 px-1 text-xs ${n.read ? 'opacity-60' : 'font-medium'}`}>
                        <div className="text-slate-800 font-semibold">{n.title}</div>
                        <div className="text-slate-600 mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <img
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
              alt={user?.name}
              className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 object-cover"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</div>
              <div>{getRoleBadge(user?.role)}</div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 pt-16 md:pt-0 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col justify-between py-4 px-3 overflow-y-auto">
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Project Modules
              </div>
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon size={18} className="text-slate-500 group-hover:text-slate-700" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Cloud Architecture Info Footer */}
            <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Cloud size={14} className="text-teal-600" /> Google Cloud Native
              </div>
              <div>Runtime: <span className="font-medium text-slate-800">Cloud Run</span></div>
              <div>Database: <span className="font-medium text-slate-800">Firestore</span></div>
              <div>Pipeline: <span className="font-medium text-slate-800">Cloud Build</span></div>
            </div>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
