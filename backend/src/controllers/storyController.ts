import { Response } from 'express';
import { db } from '../repositories/firestoreRepository';
import { UserStory } from '../models/types';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityService } from '../services/activityService';

export class StoryController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId, sprintId, status } = req.query;
      const filter: Record<string, any> = {};
      if (projectId) filter.projectId = projectId;
      if (sprintId) filter.sprintId = sprintId;
      if (status) filter.status = status;

      const stories = await db.list<UserStory>('userStories', filter);
      return res.status(200).json({ success: true, stories });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to list user stories', error: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const story = await db.get<UserStory>('userStories', id);
      if (!story) return res.status(404).json({ success: false, message: 'User story not found' });
      return res.status(200).json({ success: true, story });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user story', error: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { projectId, sprintId, title, description, acceptanceCriteria, priority, storyPoints, assignedTo } = req.body;
      if (!projectId || !title) {
        return res.status(400).json({ success: false, message: 'Project ID and Story title are required' });
      }

      const id = `story_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const story: UserStory = {
        id,
        projectId,
        sprintId,
        title,
        description: description || '',
        acceptanceCriteria: acceptanceCriteria || '',
        priority: priority || 'MEDIUM',
        storyPoints: storyPoints || 3,
        status: 'TO DO',
        assignedTo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.create('userStories', story);

      await ActivityService.log({
        projectId,
        userId: user.id,
        userName: user.name,
        action: 'STORY_CREATED',
        details: `User story "${title}" added to backlog`
      });

      return res.status(201).json({ success: true, story });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to create user story', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updated = await db.update<UserStory>('userStories', id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'User story not found' });
      return res.status(200).json({ success: true, story: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to update user story', error: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await db.delete('userStories', id);
      if (!deleted) return res.status(404).json({ success: false, message: 'User story not found' });
      return res.status(200).json({ success: true, message: 'User story deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to delete user story', error: error.message });
    }
  }
}
