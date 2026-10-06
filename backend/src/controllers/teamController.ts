import { Response } from 'express';
import { db } from '../repositories/firestoreRepository';
import { Team, TeamMember } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityService } from '../services/activityService';

export class TeamController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const teams = await db.list<Team>('teams');
      return res.status(200).json({ success: true, teams });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to list teams', error: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const team = await db.get<Team>('teams', id);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
      return res.status(200).json({ success: true, team });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch team', error: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { name, description, members } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Team name is required' });

      const id = `team_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const memberList: TeamMember[] = Array.isArray(members) ? members : [];
      if (!memberList.some(m => m.userId === user.id)) {
        memberList.push({ userId: user.id, role: user.role, addedAt: new Date().toISOString() });
      }

      const team: Team = {
        id,
        name,
        description: description || '',
        createdBy: user.id,
        members: memberList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.create('teams', team);

      await ActivityService.log({
        userId: user.id,
        userName: user.name,
        action: 'TEAM_CREATED',
        details: `Team "${name}" was created by ${user.name}`
      });

      return res.status(201).json({ success: true, team });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to create team', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updated = await db.update<Team>('teams', id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Team not found' });
      return res.status(200).json({ success: true, team: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update team', error: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await db.delete('teams', id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Team not found' });
      return res.status(200).json({ success: true, message: 'Team deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete team', error: error.message });
    }
  }

  static async addMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;
      const team = await db.get<Team>('teams', id);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      const members = team.members || [];
      const existingIdx = members.findIndex(m => m.userId === userId);
      if (existingIdx >= 0) {
        members[existingIdx].role = role || members[existingIdx].role;
      } else {
        members.push({ userId, role: role || 'DEVELOPER', addedAt: new Date().toISOString() });
      }

      const updated = await db.update<Team>('teams', id, { members });
      return res.status(200).json({ success: true, team: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to add team member', error: error.message });
    }
  }

  static async removeMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, userId } = req.params;
      const team = await db.get<Team>('teams', id);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      const members = (team.members || []).filter(m => m.userId !== userId);
      const updated = await db.update<Team>('teams', id, { members });
      return res.status(200).json({ success: true, team: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to remove team member', error: error.message });
    }
  }
}
