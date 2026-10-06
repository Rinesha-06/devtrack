import { Response } from 'express';
import { db } from '../repositories/firestoreRepository';
import { Project, Sprint, Task, Bug, Activity, Notification } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';

export class DashboardController {
  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId } = req.query;

      const projectFilter = projectId ? { projectId: projectId as string } : undefined;

      const [projects, sprints, tasks, bugs, activities] = await Promise.all([
        db.list<Project>('projects'),
        db.list<Sprint>('sprints', projectFilter),
        db.list<Task>('tasks', projectFilter),
        db.list<Bug>('bugs', projectFilter),
        db.list<Activity>('activities', projectFilter)
      ]);

      const filteredProjects = projectId ? projects.filter(p => p.id === projectId) : projects;

      // Project stats
      const totalProjects = filteredProjects.length;
      const activeProjects = filteredProjects.filter(p => p.status === 'Active').length;
      const completedProjects = filteredProjects.filter(p => p.status === 'Completed').length;

      // Sprint stats
      const totalSprints = sprints.length;
      const activeSprints = sprints.filter(s => s.status === 'Active').length;

      // Task stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
      const pendingTasks = totalTasks - completedTasks;

      // Bug stats
      const totalBugs = bugs.length;
      const openBugs = bugs.filter(b => ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'REOPENED'].includes(b.status)).length;
      const criticalBugs = bugs.filter(b => b.severity === 'CRITICAL' && b.status !== 'CLOSED').length;
      const resolvedBugs = bugs.filter(b => ['FIXED', 'VERIFIED', 'CLOSED'].includes(b.status)).length;
      const closedBugs = bugs.filter(b => b.status === 'CLOSED').length;

      // Rates
      const overallProjectProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const bugResolutionRate = totalBugs > 0 ? Math.round((closedBugs / totalBugs) * 100) : 100;

      // Status distributions
      const taskStatusDistribution = [
        { name: 'To Do', value: tasks.filter(t => t.status === 'TO DO').length, color: '#94a3b8' },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'IN PROGRESS').length, color: '#3b82f6' },
        { name: 'Review', value: tasks.filter(t => t.status === 'REVIEW').length, color: '#a855f7' },
        { name: 'Testing', value: tasks.filter(t => t.status === 'TESTING').length, color: '#eab308' },
        { name: 'Completed', value: tasks.filter(t => t.status === 'COMPLETED').length, color: '#22c55e' }
      ];

      const bugStatusDistribution = [
        { name: 'Open', value: bugs.filter(b => b.status === 'OPEN').length, color: '#ef4444' },
        { name: 'Assigned', value: bugs.filter(b => b.status === 'ASSIGNED').length, color: '#f97316' },
        { name: 'In Progress', value: bugs.filter(b => b.status === 'IN PROGRESS').length, color: '#3b82f6' },
        { name: 'Fixed', value: bugs.filter(b => b.status === 'FIXED').length, color: '#06b6d4' },
        { name: 'Verified', value: bugs.filter(b => b.status === 'VERIFIED').length, color: '#8b5cf6' },
        { name: 'Closed', value: bugs.filter(b => b.status === 'CLOSED').length, color: '#22c55e' },
        { name: 'Reopened', value: bugs.filter(b => b.status === 'REOPENED').length, color: '#dc2626' }
      ];

      const bugSeverityDistribution = [
        { name: 'Critical', value: bugs.filter(b => b.severity === 'CRITICAL').length, color: '#dc2626' },
        { name: 'High', value: bugs.filter(b => b.severity === 'HIGH').length, color: '#ea580c' },
        { name: 'Medium', value: bugs.filter(b => b.severity === 'MEDIUM').length, color: '#ca8a04' },
        { name: 'Low', value: bugs.filter(b => b.severity === 'LOW').length, color: '#16a34a' }
      ];

      const taskPriorityDistribution = [
        { name: 'Critical', value: tasks.filter(t => t.priority === 'CRITICAL').length, color: '#dc2626' },
        { name: 'High', value: tasks.filter(t => t.priority === 'HIGH').length, color: '#ea580c' },
        { name: 'Medium', value: tasks.filter(t => t.priority === 'MEDIUM').length, color: '#ca8a04' },
        { name: 'Low', value: tasks.filter(t => t.priority === 'LOW').length, color: '#16a34a' }
      ];

      // Sprint progress details
      const sprintProgressList = sprints.map(s => {
        const sTasks = tasks.filter(t => t.sprintId === s.id);
        const sCompleted = sTasks.filter(t => t.status === 'COMPLETED').length;
        const progress = sTasks.length > 0 ? Math.round((sCompleted / sTasks.length) * 100) : 0;
        return {
          id: s.id,
          name: s.name,
          status: s.status,
          totalTasks: sTasks.length,
          completedTasks: sCompleted,
          progress
        };
      });

      // Recent activities sorted by timestamp descending
      const recentActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      return res.status(200).json({
        success: true,
        stats: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalSprints,
          activeSprints,
          totalTasks,
          pendingTasks,
          completedTasks,
          totalBugs,
          openBugs,
          criticalBugs,
          resolvedBugs,
          closedBugs,
          overallProjectProgress,
          bugResolutionRate,
          taskStatusDistribution,
          bugStatusDistribution,
          bugSeverityDistribution,
          taskPriorityDistribution,
          sprintProgressList,
          recentActivities
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to compute dashboard stats', error: error.message });
    }
  }

  static async getActivities(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId } = req.query;
      const filter = projectId ? { projectId: projectId as string } : undefined;
      const activities = await db.list<Activity>('activities', filter);
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return res.status(200).json({ success: true, activities: activities.slice(0, 50) });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch activities', error: error.message });
    }
  }

  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const notifications = await db.list<Notification>('notifications', { userId: user.id });
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({ success: true, notifications });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
  }

  static async markNotificationRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updated = await db.update<Notification>('notifications', id, { read: true });
      return res.status(200).json({ success: true, notification: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
    }
  }

  static async markAllNotificationsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const notifications = await db.list<Notification>('notifications', { userId: user.id });
      for (const notif of notifications) {
        if (!notif.read) {
          await db.update('notifications', notif.id, { read: true });
        }
      }
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to mark notifications', error: error.message });
    }
  }
}
