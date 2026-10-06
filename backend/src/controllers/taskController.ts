import { Response } from 'express';
import { db } from '../repositories/firestoreRepository';
import { Task, TaskStatus, Project } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityService } from '../services/activityService';

export class TaskController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId, sprintId, storyId, status, assignedTo } = req.query;
      const filter: Record<string, any> = {};
      if (projectId) filter.projectId = projectId;
      if (sprintId) filter.sprintId = sprintId;
      if (storyId) filter.storyId = storyId;
      if (status) filter.status = status;
      if (assignedTo) filter.assignedTo = assignedTo;

      const tasks = await db.list<Task>('tasks', filter);
      return res.status(200).json({ success: true, tasks });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to list tasks', error: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const task = await db.get<Task>('tasks', id);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
      return res.status(200).json({ success: true, task });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch task', error: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const {
        projectId,
        sprintId,
        storyId,
        title,
        description,
        assignedTo,
        priority,
        status,
        dueDate,
        estimatedHours
      } = req.body;

      if (!projectId || !title) {
        return res.status(400).json({ success: false, message: 'Project ID and title are required' });
      }

      const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const task: Task = {
        id,
        projectId,
        sprintId,
        storyId,
        title,
        description: description || '',
        assignedTo,
        createdBy: user.id,
        priority: priority || 'MEDIUM',
        status: (status as TaskStatus) || 'TO DO',
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        estimatedHours: estimatedHours || 4,
        actualHours: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.create('tasks', task);

      await ActivityService.log({
        projectId,
        userId: user.id,
        userName: user.name,
        action: 'TASK_CREATED',
        details: `Task "${title}" created by ${user.name}`
      });

      if (assignedTo && assignedTo !== user.id) {
        await ActivityService.notify({
          userId: assignedTo,
          title: 'New Task Assigned',
          message: `You were assigned task "${title}"`,
          link: `/tasks`
        });
      }

      return res.status(201).json({ success: true, task });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const existing = await db.get<Task>('tasks', id);
      if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });

      const updated = await db.update<Task>('tasks', id, req.body);

      if (req.body.status && req.body.status !== existing.status) {
        await ActivityService.log({
          projectId: existing.projectId,
          userId: user.id,
          userName: user.name,
          action: 'TASK_STATUS_CHANGED',
          details: `Moved task "${existing.title}" from ${existing.status} to ${req.body.status}`
        });

        // Recalculate project progress
        const allTasks = await db.list<Task>('tasks', { projectId: existing.projectId });
        const completed = allTasks.filter(t => t.id === id ? req.body.status === 'COMPLETED' : t.status === 'COMPLETED').length;
        const progress = Math.round((completed / allTasks.length) * 100);
        await db.update('projects', existing.projectId, { progress });
      }

      return res.status(200).json({ success: true, task: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user!;

      const existing = await db.get<Task>('tasks', id);
      if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });

      const validStatuses: TaskStatus[] = ['TO DO', 'IN PROGRESS', 'REVIEW', 'TESTING', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid task status' });
      }

      const updated = await db.update<Task>('tasks', id, { status });

      await ActivityService.log({
        projectId: existing.projectId,
        userId: user.id,
        userName: user.name,
        action: 'TASK_STATUS_CHANGED',
        details: `${user.name} moved "${existing.title}" to ${status}`
      });

      // Recalculate project progress
      const allTasks = await db.list<Task>('tasks', { projectId: existing.projectId });
      const completed = allTasks.filter(t => t.id === id ? status === 'COMPLETED' : t.status === 'COMPLETED').length;
      const progress = Math.round((completed / allTasks.length) * 100);
      await db.update('projects', existing.projectId, { progress });

      return res.status(200).json({ success: true, task: updated, projectProgress: progress });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const existing = await db.get<Task>('tasks', id);
      if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });

      await db.delete('tasks', id);

      await ActivityService.log({
        projectId: existing.projectId,
        userId: user.id,
        userName: user.name,
        action: 'TASK_DELETED',
        details: `Task "${existing.title}" deleted by ${user.name}`
      });

      return res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete task', error: error.message });
    }
  }
}
