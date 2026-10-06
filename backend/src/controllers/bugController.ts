import { Response } from 'express';
import { db } from '../repositories/firestoreRepository';
import { Bug, BugStatus, BugSeverity, PriorityLevel } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityService } from '../services/activityService';

export class BugController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId, taskId, status, severity, assignedTo, reportedBy } = req.query;
      const filter: Record<string, any> = {};
      if (projectId) filter.projectId = projectId;
      if (taskId) filter.taskId = taskId;
      if (status) filter.status = status;
      if (severity) filter.severity = severity;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (reportedBy) filter.reportedBy = reportedBy;

      const bugs = await db.list<Bug>('bugs', filter);
      return res.status(200).json({ success: true, bugs });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to list bugs', error: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const bug = await db.get<Bug>('bugs', id);
      if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });
      return res.status(200).json({ success: true, bug });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch bug', error: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const {
        projectId,
        taskId,
        title,
        description,
        assignedTo,
        severity,
        priority,
        environment,
        stepsToReproduce,
        expectedResult,
        actualResult
      } = req.body;

      if (!projectId || !title) {
        return res.status(400).json({ success: false, message: 'Project ID and title are required' });
      }

      const id = `bug_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const bug: Bug = {
        id,
        projectId,
        taskId,
        title,
        description: description || '',
        reportedBy: user.id,
        assignedTo,
        severity: (severity as BugSeverity) || 'MEDIUM',
        priority: (priority as PriorityLevel) || 'MEDIUM',
        status: assignedTo ? 'ASSIGNED' : 'OPEN',
        environment: environment || 'Production / Cloud Run',
        stepsToReproduce: stepsToReproduce || '',
        expectedResult: expectedResult || '',
        actualResult: actualResult || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.create('bugs', bug);

      await ActivityService.log({
        projectId,
        userId: user.id,
        userName: user.name,
        action: 'BUG_REPORTED',
        details: `${user.name} reported bug "${title}" (${bug.severity})`
      });

      if (assignedTo && assignedTo !== user.id) {
        await ActivityService.notify({
          userId: assignedTo,
          title: 'Bug Assigned to You',
          message: `You were assigned bug "${title}"`,
          link: `/bugs`
        });
      }

      return res.status(201).json({ success: true, bug });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to create bug', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const existing = await db.get<Bug>('bugs', id);
      if (!existing) return res.status(404).json({ success: false, message: 'Bug not found' });

      const updated = await db.update<Bug>('bugs', id, req.body);

      if (req.body.status && req.body.status !== existing.status) {
        await ActivityService.log({
          projectId: existing.projectId,
          userId: user.id,
          userName: user.name,
          action: 'BUG_STATUS_CHANGED',
          details: `${user.name} changed bug "${existing.title}" status to ${req.body.status}`
        });

        // Notify reporter if status changed
        if (existing.reportedBy && existing.reportedBy !== user.id) {
          await ActivityService.notify({
            userId: existing.reportedBy,
            title: 'Bug Status Updated',
            message: `Bug "${existing.title}" changed to ${req.body.status}`,
            link: `/bugs`
          });
        }
      }

      return res.status(200).json({ success: true, bug: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update bug', error: error.message });
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, resolution } = req.body;
      const user = req.user!;

      const existing = await db.get<Bug>('bugs', id);
      if (!existing) return res.status(404).json({ success: false, message: 'Bug not found' });

      const updates: Partial<Bug> = { status };
      if (resolution !== undefined) updates.resolution = resolution;

      const updated = await db.update<Bug>('bugs', id, updates);

      await ActivityService.log({
        projectId: existing.projectId,
        userId: user.id,
        userName: user.name,
        action: 'BUG_STATUS_CHANGED',
        details: `${user.name} transitioned "${existing.title}" to ${status}${resolution ? ` (Resolution: ${resolution})` : ''}`
      });

      return res.status(200).json({ success: true, bug: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update bug status', error: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const existing = await db.get<Bug>('bugs', id);
      if (!existing) return res.status(404).json({ success: false, message: 'Bug not found' });

      await db.delete('bugs', id);

      await ActivityService.log({
        projectId: existing.projectId,
        userId: user.id,
        userName: user.name,
        action: 'BUG_DELETED',
        details: `Bug "${existing.title}" deleted by ${user.name}`
      });

      return res.status(200).json({ success: true, message: 'Bug deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete bug', error: error.message });
    }
  }
}
