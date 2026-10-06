import { Response } from 'express';
import { db } from '../repositories/firestoreRepository';
import { Project, Task } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityService } from '../services/activityService';

export class ProjectController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const projects = await db.list<Project>('projects');
      return res.status(200).json({ success: true, projects });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to list projects', error: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const project = await db.get<Project>('projects', id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Recalculate progress dynamically
      const tasks = await db.list<Task>('tasks', { projectId: id });
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
      const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : project.progress || 0;

      if (progress !== project.progress) {
        await db.update('projects', id, { progress });
        project.progress = progress;
      }

      return res.status(200).json({ success: true, project });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch project', error: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { name, description, startDate, endDate, priority, repositoryUrl, teamId, members } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'Project name is required' });
      }

      const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const memberList: string[] = Array.isArray(members) ? members : [];
      if (!memberList.includes(user.id)) {
        memberList.push(user.id);
      }

      const newProject: Project = {
        id,
        name,
        description: description || '',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'Active',
        priority: priority || 'MEDIUM',
        managerId: user.id,
        teamId,
        repositoryUrl: repositoryUrl || '',
        progress: 0,
        members: memberList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.create('projects', newProject);

      await ActivityService.log({
        projectId: id,
        userId: user.id,
        userName: user.name,
        action: 'PROJECT_CREATED',
        details: `Project "${name}" was created by ${user.name}`
      });

      return res.status(201).json({ success: true, message: 'Project created successfully', project: newProject });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to create project', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const existing = await db.get<Project>('projects', id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const updated = await db.update<Project>('projects', id, req.body);

      await ActivityService.log({
        projectId: id,
        userId: user.id,
        userName: user.name,
        action: 'PROJECT_UPDATED',
        details: `Project "${existing.name}" was updated by ${user.name}`
      });

      return res.status(200).json({ success: true, project: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update project', error: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const existing = await db.get<Project>('projects', id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      await db.delete('projects', id);

      await ActivityService.log({
        userId: user.id,
        userName: user.name,
        action: 'PROJECT_DELETED',
        details: `Project "${existing.name}" was deleted by ${user.name}`
      });

      return res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete project', error: error.message });
    }
  }

  static async addMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const project = await db.get<Project>('projects', id);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

      const members = project.members || [];
      if (!members.includes(userId)) {
        members.push(userId);
        await db.update('projects', id, { members });

        await ActivityService.notify({
          userId,
          title: 'Added to Project',
          message: `You were added to project "${project.name}"`,
          link: `/projects/${id}`
        });
      }

      return res.status(200).json({ success: true, project });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to add member', error: error.message });
    }
  }
}
