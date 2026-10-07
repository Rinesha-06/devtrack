import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../repositories/firestoreRepository';
import { Team, TeamMember, User, UserRole, Project } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityService } from '../services/activityService';

export class TeamController {
  /**
   * Helper to enrich team members with up-to-date user information (name, email, photo)
   */
  private static async enrichTeam(team: Team): Promise<Team> {
    const allUsers = await db.list<User>('users');
    const userMap = new Map<string, User>(allUsers.map(u => [u.id, u]));

    const enrichedMembers: TeamMember[] = (team.members || []).map(m => {
      const u = userMap.get(m.userId);
      return {
        ...m,
        name: m.name || u?.name || 'Team Member',
        email: m.email || u?.email || 'member@devtrack.io',
        role: m.role || u?.role || 'DEVELOPER'
      };
    });

    return {
      ...team,
      members: enrichedMembers
    };
  }

  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { projectId } = req.query as { projectId?: string };
      let teams = await db.list<Team>('teams');

      // Filter by projectId if requested
      if (projectId) {
        teams = teams.filter(t => t.projectId === projectId);
      }

      // RBAC filtering:
      // Project Managers see all teams.
      // Developers and Testers can only view teams relevant to their project or teams they belong to.
      if (user.role !== 'PROJECT_MANAGER') {
        const userProjects = await db.list<Project>('projects');
        const accessibleProjectIds = new Set(
          userProjects
            .filter(p => (p.members || []).includes(user.id) || p.managerId === user.id)
            .map(p => p.id)
        );

        teams = teams.filter(t => {
          const isMemberOfTeam = (t.members || []).some(m => m.userId === user.id);
          const isPartOfProject = t.projectId ? accessibleProjectIds.has(t.projectId) : false;
          return isMemberOfTeam || isPartOfProject;
        });
      }

      // Enrich all teams with user metadata
      const enrichedTeams = await Promise.all(teams.map(t => TeamController.enrichTeam(t)));

      return res.status(200).json({ success: true, teams: enrichedTeams });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to list teams', error: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const team = await db.get<Team>('teams', id);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      // RBAC check for non-PM users
      if (user.role !== 'PROJECT_MANAGER') {
        const isMember = (team.members || []).some(m => m.userId === user.id);
        let hasProjectAccess = false;
        if (team.projectId) {
          const project = await db.get<Project>('projects', team.projectId);
          if (project && (project.members || []).includes(user.id)) {
            hasProjectAccess = true;
          }
        }

        if (!isMember && !hasProjectAccess) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have permission to view this team.'
          });
        }
      }

      const enriched = await TeamController.enrichTeam(team);
      return res.status(200).json({ success: true, team: enriched });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch team', error: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { name, description, projectId, members } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Team name is required' });

      const id = `team_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const memberList: TeamMember[] = Array.isArray(members) ? members : [];

      // Automatically add creating PM to the team roster if not present
      if (!memberList.some(m => m.userId === user.id)) {
        memberList.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          addedAt: new Date().toISOString()
        });
      }

      const team: Team = {
        id,
        name,
        description: description || '',
        projectId: projectId || undefined,
        createdBy: user.id,
        members: memberList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.create('teams', team);

      // If assigned to a project, update project's teamId and add members to project
      if (projectId) {
        const project = await db.get<Project>('projects', projectId);
        if (project) {
          const currentMembers = new Set(project.members || []);
          memberList.forEach(m => currentMembers.add(m.userId));
          await db.update('projects', projectId, {
            teamId: id,
            members: Array.from(currentMembers)
          });
        }
      }

      await ActivityService.log({
        userId: user.id,
        userName: user.name,
        projectId: projectId || undefined,
        action: 'TEAM_CREATED',
        details: `Team "${name}" was created by ${user.name}`
      });

      const enriched = await TeamController.enrichTeam(team);
      return res.status(201).json({ success: true, team: enriched });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to create team', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { name, description, projectId } = req.body;

      const existing = await db.get<Team>('teams', id);
      if (!existing) return res.status(404).json({ success: false, message: 'Team not found' });

      const updates: Partial<Team> = {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(projectId !== undefined && { projectId }),
        updatedAt: new Date().toISOString()
      };

      const updated = await db.update<Team>('teams', id, updates);
      if (!updated) return res.status(404).json({ success: false, message: 'Team not found' });

      // If project assignment changed
      if (projectId && projectId !== existing.projectId) {
        const project = await db.get<Project>('projects', projectId);
        if (project) {
          const currentMembers = new Set(project.members || []);
          (updated.members || []).forEach(m => currentMembers.add(m.userId));
          await db.update('projects', projectId, {
            teamId: id,
            members: Array.from(currentMembers)
          });
        }
      }

      await ActivityService.log({
        userId: user.id,
        userName: user.name,
        projectId: updated.projectId || undefined,
        action: 'TEAM_UPDATED',
        details: `Team "${updated.name}" was updated by ${user.name}`
      });

      const enriched = await TeamController.enrichTeam(updated);
      return res.status(200).json({ success: true, team: enriched });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update team', error: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const team = await db.get<Team>('teams', id);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      // Unlink from projects if referenced
      if (team.projectId) {
        const project = await db.get<Project>('projects', team.projectId);
        if (project && project.teamId === id) {
          await db.update('projects', team.projectId, { teamId: undefined });
        }
      }

      await db.delete('teams', id);

      await ActivityService.log({
        userId: user.id,
        userName: user.name,
        action: 'TEAM_DELETED',
        details: `Team "${team.name}" was deleted by ${user.name}`
      });

      return res.status(200).json({ success: true, message: 'Team deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete team', error: error.message });
    }
  }

  static async addMember(req: AuthenticatedRequest, res: Response) {
    try {
      const authUser = req.user!;
      const { id } = req.params;
      const { userId, name, email, role } = req.body;

      const team = await db.get<Team>('teams', id);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      const targetRole: UserRole = ['DEVELOPER', 'TESTER', 'PROJECT_MANAGER'].includes(role) ? role : 'DEVELOPER';

      let targetUser: User | null = null;

      // 1. If email is provided, check if user exists or create new user
      if (email) {
        const existingUsers = await db.list<User>('users', { email: email.toLowerCase() });
        if (existingUsers.length > 0) {
          targetUser = existingUsers[0];
          // Optionally update role and name if specified
          if (role || name) {
            targetUser = await db.update<User>('users', targetUser.id, {
              ...(role && { role: targetRole }),
              ...(name && { name })
            });
          }
        } else {
          // Create new user in database
          const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          const passwordHash = await bcrypt.hash('password123', 10);
          const userName = name || email.split('@')[0];
          const newUser: User = {
            id: newUserId,
            name: userName,
            email: email.toLowerCase(),
            role: targetRole,
            passwordHash,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await db.create('users', newUser);
          targetUser = newUser;
        }
      } else if (userId) {
        targetUser = await db.get<User>('users', userId);
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
      } else {
        return res.status(400).json({ success: false, message: 'Either email or userId is required to add member' });
      }

      if (!targetUser) {
        return res.status(500).json({ success: false, message: 'Unable to resolve target user' });
      }

      const members = team.members || [];
      const existingIdx = members.findIndex(m => m.userId === targetUser!.id);

      const memberEntry: TeamMember = {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetRole,
        addedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        members[existingIdx] = memberEntry;
      } else {
        members.push(memberEntry);
      }

      const updated = await db.update<Team>('teams', id, {
        members,
        updatedAt: new Date().toISOString()
      });

      // If team belongs to a project, ensure user is in project.members
      if (team.projectId) {
        const project = await db.get<Project>('projects', team.projectId);
        if (project) {
          const currentMembers = new Set(project.members || []);
          currentMembers.add(targetUser.id);
          await db.update('projects', team.projectId, {
            members: Array.from(currentMembers)
          });
        }
      }

      await ActivityService.log({
        userId: authUser.id,
        userName: authUser.name,
        projectId: team.projectId || undefined,
        action: 'TEAM_MEMBER_ADDED',
        details: `${targetUser.name} (${targetRole}) was added to team "${team.name}" by ${authUser.name}`
      });

      const enriched = await TeamController.enrichTeam(updated!);
      return res.status(200).json({
        success: true,
        team: enriched,
        member: memberEntry,
        user: { id: targetUser.id, name: targetUser.name, email: targetUser.email, role: targetUser.role }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to add team member', error: error.message });
    }
  }

  static async updateMember(req: AuthenticatedRequest, res: Response) {
    try {
      const authUser = req.user!;
      const { id, userId } = req.params;
      const { name, email, role } = req.body;

      const team = await db.get<Team>('teams', id);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      const members = team.members || [];
      const memberIdx = members.findIndex(m => m.userId === userId);
      if (memberIdx === -1) {
        return res.status(404).json({ success: false, message: 'Member not found in this team' });
      }

      const targetRole: UserRole = role && ['DEVELOPER', 'TESTER', 'PROJECT_MANAGER'].includes(role)
        ? role
        : members[memberIdx].role;

      // Update in user table if name/email/role provided
      const userUpdates: Partial<User> = {};
      if (name) userUpdates.name = name;
      if (email) userUpdates.email = email.toLowerCase();
      if (role) userUpdates.role = targetRole;

      let updatedUser: User | null = null;
      if (Object.keys(userUpdates).length > 0) {
        updatedUser = await db.update<User>('users', userId, userUpdates);
      }

      // Update in team members array
      members[memberIdx] = {
        ...members[memberIdx],
        name: name || updatedUser?.name || members[memberIdx].name,
        email: (email || updatedUser?.email || members[memberIdx].email)?.toLowerCase(),
        role: targetRole
      };

      const updatedTeam = await db.update<Team>('teams', id, {
        members,
        updatedAt: new Date().toISOString()
      });

      await ActivityService.log({
        userId: authUser.id,
        userName: authUser.name,
        projectId: team.projectId || undefined,
        action: 'TEAM_MEMBER_UPDATED',
        details: `Member ${members[memberIdx].name} in team "${team.name}" was updated by ${authUser.name}`
      });

      const enriched = await TeamController.enrichTeam(updatedTeam!);
      return res.status(200).json({
        success: true,
        team: enriched,
        member: members[memberIdx]
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update team member', error: error.message });
    }
  }

  static async removeMember(req: AuthenticatedRequest, res: Response) {
    try {
      const authUser = req.user!;
      const { id, userId } = req.params;
      const team = await db.get<Team>('teams', id);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      const members = (team.members || []).filter(m => m.userId !== userId);
      const updated = await db.update<Team>('teams', id, {
        members,
        updatedAt: new Date().toISOString()
      });

      await ActivityService.log({
        userId: authUser.id,
        userName: authUser.name,
        projectId: team.projectId || undefined,
        action: 'TEAM_MEMBER_REMOVED',
        details: `A member was removed from team "${team.name}" by ${authUser.name}`
      });

      const enriched = await TeamController.enrichTeam(updated!);
      return res.status(200).json({
        success: true,
        team: enriched,
        message: 'Member removed from team successfully'
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to remove team member', error: error.message });
    }
  }
}
