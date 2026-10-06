import { db } from '../repositories/firestoreRepository';
import { Activity, Notification } from '../models/types';

export class ActivityService {
  static async log(params: {
    projectId?: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
  }): Promise<Activity> {
    const id = `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const activity: Activity = {
      id,
      projectId: params.projectId,
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      details: params.details,
      timestamp: new Date().toISOString()
    };

    await db.create('activities', activity);
    return activity;
  }

  static async notify(params: {
    userId: string;
    title: string;
    message: string;
    link?: string;
  }): Promise<Notification> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const notification: Notification = {
      id,
      userId: params.userId,
      title: params.title,
      message: params.message,
      read: false,
      link: params.link,
      createdAt: new Date().toISOString()
    };

    await db.create('notifications', notification);
    return notification;
  }
}
