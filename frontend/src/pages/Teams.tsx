import React, { useEffect, useState } from 'react';
import {
  Users, Plus, Mail, Shield, UserPlus, Trash2,
  RefreshCw, X, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Team, User, UserRole } from '../types';

export const Teams: React.FC = () => {
  const { isProjectManager } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('DEVELOPER');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsRes, usersRes] = await Promise.all([
        api.teams.list(),
        api.auth.getUsers()
      ]);

      if (teamsRes.data.success) setTeams(teamsRes.data.teams);
      if (usersRes.data.success) setAllUsers(usersRes.data.users);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (teamId: string) => {
    if (!selectedUserId) return;
    setFormError(null);
    try {
      await api.teams.addMember(teamId, selectedUserId, selectedRole);
      setShowAddMemberModal(null);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      await api.teams.removeMember(teamId, userId);
      loadData();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const getUserDetails = (userId: string) => {
    return allUsers.find(u => u.id === userId) || {
      name: 'Team Member',
      email: 'member@devtrack.io',
      role: 'DEVELOPER'
    };
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'PROJECT_MANAGER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">Project Manager</span>;
      case 'DEVELOPER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Developer</span>;
      case 'TESTER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Tester</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize engineering pods, assign roles, and manage permissions across projects
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm"
        >
          <RefreshCw size={14} /> Refresh Roster
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={18} /> Loading team roster...
        </div>
      ) : teams.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">No teams configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{team.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{team.description}</p>
                </div>

                {isProjectManager && (
                  <button
                    onClick={() => {
                      setShowAddMemberModal(team.id);
                      setSelectedUserId(allUsers[0]?.id || '');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition"
                  >
                    <UserPlus size={14} /> Add Member
                  </button>
                )}
              </div>

              {/* Members List */}
              <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
                {team.members.map(m => {
                  const userDetail = getUserDetails(m.userId);
                  return (
                    <div key={m.userId} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                          {userDetail.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{userDetail.name}</div>
                          <div className="text-[11px] text-slate-400">{userDetail.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getRoleBadge(m.role)}
                        {isProjectManager && team.members.length > 1 && (
                          <button
                            onClick={() => handleRemoveMember(team.id, m.userId)}
                            className="p-1 text-slate-400 hover:text-red-600 transition"
                            title="Remove from team"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Team Member</h3>
              <button onClick={() => setShowAddMemberModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role Assignment (RBAC)
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="TESTER">Tester</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMember(showAddMemberModal)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
