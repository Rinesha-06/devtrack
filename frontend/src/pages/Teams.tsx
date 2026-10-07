import React, { useEffect, useState } from 'react';
import {
  Users, Plus, Mail, Shield, UserPlus, Trash2, Edit2,
  RefreshCw, X, AlertCircle, CheckCircle2, FolderKanban,
  UserCheck, AlertTriangle, ChevronDown, ChevronUp, Search,
  Briefcase, ArrowRight, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Team, TeamMember, User, UserRole, Project } from '../types';

export const Teams: React.FC = () => {
  const { user: currentUser, isProjectManager } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Expanded team IDs for viewing members
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForNewMember, setTeamForNewMember] = useState<Team | null>(null);
  const [editingMember, setEditingMember] = useState<{ teamId: string; member: TeamMember } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ teamId: string; teamName: string; member: TeamMember } | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Team Form State
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamProjectId, setTeamProjectId] = useState('');

  // Add Member Form State
  const [addMode, setAddMode] = useState<'create' | 'existing'>('create');
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<UserRole>('DEVELOPER');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');

  // Edit Member Form State
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberRole, setEditMemberRole] = useState<UserRole>('DEVELOPER');

  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsRes, projRes, usersRes] = await Promise.all([
        api.teams.list(projectFilter || undefined),
        api.projects.list(),
        api.auth.getUsers()
      ]);

      if (teamsRes.data.success) {
        setTeams(teamsRes.data.teams);
        if (teamsRes.data.teams.length > 0 && !expandedTeamId) {
          // Auto-expand the first team for convenient viewing
          setExpandedTeamId(teamsRes.data.teams[0].id);
        }
      }
      if (projRes.data.success) setProjects(projRes.data.projects);
      if (usersRes.data.success) setAllUsers(usersRes.data.users);
    } catch (err) {
      console.error('Failed to load teams data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // 1. Create or Update Team
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setFormError('Team name is required.');
      return;
    }
    setFormError(null);

    try {
      if (editingTeam) {
        const res = await api.teams.update(editingTeam.id, {
          name: teamName.trim(),
          description: teamDescription.trim(),
          projectId: teamProjectId || undefined
        });
        if (res.data.success) {
          showNotification(`Team "${teamName}" updated successfully.`);
          setEditingTeam(null);
          loadData();
        }
      } else {
        const res = await api.teams.create({
          name: teamName.trim(),
          description: teamDescription.trim(),
          projectId: teamProjectId || undefined
        });
        if (res.data.success) {
          showNotification(`Team "${teamName}" created successfully.`);
          setShowCreateModal(false);
          setExpandedTeamId(res.data.team.id);
          loadData();
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save team.');
    }
  };

  // 2. Delete Team
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      await api.teams.delete(teamToDelete.id);
      showNotification(`Team "${teamToDelete.name}" was deleted.`);
      setTeamToDelete(null);
      if (expandedTeamId === teamToDelete.id) setExpandedTeamId(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete team.');
    }
  };

  // 3. Add Member to Team
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForNewMember) return;
    setFormError(null);

    try {
      let payload: any;
      if (addMode === 'existing') {
        if (!selectedExistingUserId) {
          setFormError('Please select a user to add.');
          return;
        }
        payload = {
          userId: selectedExistingUserId,
          role: memberRole
        };
      } else {
        if (!memberName.trim() || !memberEmail.trim()) {
          setFormError('Please provide both name and email.');
          return;
        }
        payload = {
          name: memberName.trim(),
          email: memberEmail.trim(),
          role: memberRole
        };
      }

      const res = await api.teams.addMember(teamForNewMember.id, payload);
      if (res.data.success) {
        showNotification(`Member added to team "${teamForNewMember.name}".`);
        setTeamForNewMember(null);
        setMemberName('');
        setMemberEmail('');
        setSelectedExistingUserId('');
        setExpandedTeamId(teamForNewMember.id);
        loadData();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add member to team.');
    }
  };

  // 4. Update Member Details & Role
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setFormError(null);

    try {
      const res = await api.teams.updateMember(editingMember.teamId, editingMember.member.userId, {
        name: editMemberName.trim(),
        email: editMemberEmail.trim(),
        role: editMemberRole
      });

      if (res.data.success) {
        showNotification('Member details updated successfully.');
        setEditingMember(null);
        loadData();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update member.');
    }
  };

  // 5. Remove Member with Confirmation
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await api.teams.removeMember(memberToRemove.teamId, memberToRemove.member.userId);
      showNotification(`Removed ${memberToRemove.member.name || 'member'} from team.`);
      setMemberToRemove(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'Unassigned';
    const p = projects.find(proj => proj.id === projectId);
    return p ? p.name : 'Unknown Project';
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'PROJECT_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
            <ShieldCheck size={12} /> Project Manager
          </span>
        );
      case 'DEVELOPER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            <Briefcase size={12} /> Developer
          </span>
        );
      case 'TESTER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            <Shield size={12} /> QA Tester
          </span>
        );
    }
  };

  // Filter teams by search term
  const filteredTeams = teams.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.members || []).some(m => (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team & Pod Management</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize cross-functional engineering pods, allocate developers, and control project permissions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <RefreshCw size={14} /> Refresh Roster
          </button>

          {isProjectManager && (
            <button
              onClick={() => {
                setTeamName('');
                setTeamDescription('');
                setTeamProjectId(projects[0]?.id || '');
                setFormError(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Plus size={15} /> Create New Team
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams or member names..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FolderKanban size={15} className="text-slate-400" />
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="w-full sm:w-48 py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-teal-500 font-medium text-slate-700 cursor-pointer"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Teams Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-52 text-slate-400">
          <RefreshCw className="animate-spin mr-2" size={20} /> Loading engineering teams...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No teams found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || projectFilter
              ? 'No teams match your filter criteria. Try adjusting your search query or project filter.'
              : 'Create your first engineering pod to organize projects and assign tasks.'}
          </p>
          {isProjectManager && !searchQuery && !projectFilter && (
            <button
              onClick={() => {
                setTeamName('');
                setTeamDescription('');
                setTeamProjectId(projects[0]?.id || '');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus size={15} /> Create Team Now
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTeams.map(team => {
            const isExpanded = expandedTeamId === team.id;
            const memberCount = (team.members || []).length;
            const assignedProjectName = getProjectName(team.projectId);

            return (
              <div
                key={team.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-teal-500/40 ring-1 ring-teal-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Team Card Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900 hover:text-teal-600 transition flex items-center gap-2">
                        {team.name}
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-teal-600" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                      </h3>

                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>

                    {team.description && (
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl">{team.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <FolderKanban size={13} className="text-indigo-500" />
                        <span>Project: <strong className="text-slate-900">{assignedProjectName}</strong></span>
                      </div>

                      {/* Avatar preview stack */}
                      <div className="flex items-center -space-x-1.5 ml-1">
                        {(team.members || []).slice(0, 5).map((m, idx) => (
                          <div
                            key={idx}
                            title={`${m.name || 'Member'} (${m.role})`}
                            className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm"
                          >
                            {(m.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {memberCount > 5 && (
                          <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">
                            +{memberCount - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for PM */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                    >
                      {isExpanded ? 'Hide Members' : 'View Members'}
                    </button>

                    {isProjectManager && (
                      <>
                        <button
                          onClick={() => {
                            setTeamForNewMember(team);
                            setAddMode('create');
                            setMemberName('');
                            setMemberEmail('');
                            setMemberRole('DEVELOPER');
                            setSelectedExistingUserId(allUsers[0]?.id || '');
                            setFormError(null);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold border border-teal-200 transition"
                        >
                          <UserPlus size={14} /> Add Member
                        </button>

                        <button
                          onClick={() => {
                            setEditingTeam(team);
                            setTeamName(team.name);
                            setTeamDescription(team.description || '');
                            setTeamProjectId(team.projectId || '');
                            setFormError(null);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Team"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => setTeamToDelete(team)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Team"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Member List Table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Users size={14} className="text-teal-600" />
                        Team Members ({memberCount})
                      </h4>

                      {isProjectManager && (
                        <button
                          onClick={() => {
                            setTeamForNewMember(team);
                            setAddMode('create');
                            setMemberName('');
                            setMemberEmail('');
                            setMemberRole('DEVELOPER');
                            setSelectedExistingUserId(allUsers[0]?.id || '');
                            setFormError(null);
                          }}
                          className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                        >
                          <Plus size={13} /> Add another member
                        </button>
                      )}
                    </div>

                    {memberCount === 0 ? (
                      <div className="p-6 text-center bg-white rounded-xl border border-slate-200/80">
                        <p className="text-xs text-slate-500">No members assigned to this team yet.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                              <tr>
                                <th className="px-4 py-2.5">Member</th>
                                <th className="px-4 py-2.5">Email</th>
                                <th className="px-4 py-2.5">Role</th>
                                <th className="px-4 py-2.5">Added On</th>
                                {isProjectManager && <th className="px-4 py-2.5 text-right">Actions</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(team.members || []).map(member => (
                                <tr key={member.userId} className="hover:bg-slate-50/50 transition">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                        {(member.name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900">{member.name || 'Team Member'}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{member.userId}</div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                                    {member.email || '—'}
                                  </td>

                                  <td className="px-4 py-3">
                                    {getRoleBadge(member.role)}
                                  </td>

                                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                                    {member.addedAt ? new Date(member.addedAt).toLocaleDateString() : '—'}
                                  </td>

                                  {isProjectManager && (
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingMember({ teamId: team.id, member });
                                            setEditMemberName(member.name || '');
                                            setEditMemberEmail(member.email || '');
                                            setEditMemberRole(member.role);
                                            setFormError(null);
                                          }}
                                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-md transition"
                                          title="Edit Member Details & Role"
                                        >
                                          <Edit2 size={13} />
                                        </button>

                                        <button
                                          onClick={() => {
                                            setMemberToRemove({
                                              teamId: team.id,
                                              teamName: team.name,
                                              member
                                            });
                                          }}
                                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                          title="Remove from Team"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Modal: Create / Edit Team */}
      {(showCreateModal || editingTeam) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingTeam ? 'Edit Team Details' : 'Create New Engineering Team'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTeam(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Pod, Backend Services Pod"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Purpose, responsibilities, or technical scope..."
                  value={teamDescription}
                  onChange={e => setTeamDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assign to Project
                </label>
                <select
                  value={teamProjectId}
                  onChange={e => setTeamProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">No Project (General Pod)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTeam(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingTeam ? 'Save Changes' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Add Team Member */}
      {teamForNewMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Member to Team</h3>
                <p className="text-xs text-slate-500">Adding to {teamForNewMember.name}</p>
              </div>
              <button
                onClick={() => setTeamForNewMember(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex border-b border-slate-100 mt-3">
              <button
                type="button"
                onClick={() => setAddMode('create')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition ${
                  addMode === 'create'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                New Member (Enter Details)
              </button>
              <button
                type="button"
                onClick={() => setAddMode('existing')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition ${
                  addMode === 'existing'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Choose from Existing Users
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {addMode === 'create' ? (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Lee"
                      value={memberName}
                      onChange={e => setMemberName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jordan@devtrack.io"
                      value={memberEmail}
                      onChange={e => setMemberEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select User <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedExistingUserId}
                    onChange={e => setSelectedExistingUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">Select a user...</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) — [{u.role}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role Assignment (RBAC) <span className="text-red-500">*</span>
                </label>
                <select
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="DEVELOPER">Developer (Task & Code Execution)</option>
                  <option value="TESTER">QA Tester (Bug Reporting & Verification)</option>
                  <option value="PROJECT_MANAGER">Project Manager (Pod Lead)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTeamForNewMember(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Edit Member Details & Role */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Member Details</h3>
                <p className="text-xs text-slate-500">ID: {editingMember.member.userId}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editMemberName}
                  onChange={e => setEditMemberName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editMemberEmail}
                  onChange={e => setEditMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role Assignment (RBAC)
                </label>
                <select
                  value={editMemberRole}
                  onChange={e => setEditMemberRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="TESTER">QA Tester</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Member Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Confirmation to Remove Member */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={20} />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Remove Team Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-800">{memberToRemove.member.name || 'this member'}</strong> from team <strong className="text-slate-800">{memberToRemove.teamName}</strong>?
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Yes, Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Confirmation to Delete Team */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={20} />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Engineering Team?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">"{teamToDelete.name}"</strong>? This will dissolve the pod and unassign its members.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setTeamToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Yes, Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
