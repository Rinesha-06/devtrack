import { Response } from 'express';
import { db } from '../repositories/firestoreRepository';
import { Sprint, Task } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityService } from '../services/activityService';

export class SprintController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId, status } = req.query;
      const filter: Record<string, any> = {};
      if (projectId) filter.projectId = projectId;
      if (status) filter.status = status;

      const sprints = await db.list<Sprint>('sprints', filter);

      // Enhance with real calculated progress
      const allTasks = await db.list<Task>('tasks');
      const enhanced = sprints.map(s => {
        const sprintTasks = allTasks.filter(t => t.sprintId === s.id);
        const completed = sprintTasks.filter(t => t.status === 'COMPLETED').length;
        const progress = sprintTasks.length > 0 ? Math.round((completed / sprintTasks.length) * 100) : 0;
        return { ...s, progress, totalTasks: sprintTasks.length, completedTasks: completed };
      });

      return res.status(200).json({ success: true, sprints: enhanced });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to list sprints', error: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const sprint = await db.get<Sprint>('sprints', id);
      if (!sprint) return res.status(404).json({ success: false, message: 'Sprint not found' });

      const tasks = await db.list<Task>('tasks', { sprintId: id });
      const completed = tasks.filter(t => t.status === 'COMPLETED').length;
      const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

      return res.status(200).json({
        success: true,
        sprint: { ...sprint, progress, totalTasks: tasks.length, completedTasks: completed }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch sprint', error: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { projectId, name, goal, startDate, endDate, status } = req.body;
      if (!projectId || !name) {
        return res.status(400).json({ success: false, message: 'Project ID and Sprint name are required' });
      }

      const id = `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const sprint: Sprint = {
        id,
        projectId,
        name,
        goal: goal || '',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: status || 'Planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.create('sprints', sprint);

      await ActivityService.log({
        projectId,
        userId: user.id,
        userName: user.name,
        action: 'SPRINT_CREATED',
        details: `Sprint "${name}" created for project by ${user.name}`
      });

      return res.status(201).json({ success: true, sprint });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to create sprint', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const existing = await db.get<Sprint>('sprints', id);
      if (!existing) return res.status(404).json({ success: false, message: 'Sprint not found' });

      const updated = await db.update<Sprint>('sprints', id, req.body);

      await ActivityService.log({
        projectId: existing.projectId,
        userId: user.id,
        userName: user.name,
        action: 'SPRINT_UPDATED',
        details: `Sprint "${existing.name}" status updated to ${req.body.status || existing.status}`
      });

      return res.status(200).json({ success: true, sprint: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update sprint', error: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await db.delete('sprints', id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Sprint not found' });
      return res.status(200).json({ success: true, message: 'Sprint deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete sprint', error: error.message });
    }
  }
}
