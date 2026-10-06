import axios from 'axios';
import {
  User, Project, Team, Sprint, UserStory, Task, Bug,
  Activity, Notification, RepositoryDetails, BuildRecord, DashboardStats
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-inject JWT token into Authorization header
client.interceptors.request.use(config => {
  const token = localStorage.getItem('devtrack_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('devtrack_token');
        localStorage.removeItem('devtrack_user');
      }
    }
    return Promise.reject(err);
  }
);

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      client.post<{ success: boolean; token: string; user: User }>('/auth/login', credentials),
    register: (data: { name: string; email: string; password: string; role: string }) =>
      client.post<{ success: boolean; token: string; user: User }>('/auth/register', data),
    me: () => client.get<{ success: boolean; user: User }>('/auth/me'),
    getUsers: () => client.get<{ success: boolean; users: User[] }>('/auth/users'),
    resetPassword: (email: string) => client.post('/auth/reset-password', { email }),
    updateProfile: (data: Partial<User>) => client.put<{ success: boolean; user: User }>('/auth/profile', data)
  },
  projects: {
    list: () => client.get<{ success: boolean; projects: Project[] }>('/projects'),
    getById: (id: string) => client.get<{ success: boolean; project: Project }>(`/projects/${id}`),
    create: (data: Partial<Project>) => client.post<{ success: boolean; project: Project }>('/projects', data),
    update: (id: string, data: Partial<Project>) => client.put<{ success: boolean; project: Project }>(`/projects/${id}`, data),
    delete: (id: string) => client.delete(`/projects/${id}`),
    addMember: (id: string, userId: string) => client.post(`/projects/${id}/members`, { userId })
  },
  teams: {
    list: () => client.get<{ success: boolean; teams: Team[] }>('/teams'),
    getById: (id: string) => client.get<{ success: boolean; team: Team }>(`/teams/${id}`),
    create: (data: Partial<Team>) => client.post<{ success: boolean; team: Team }>('/teams', data),
    update: (id: string, data: Partial<Team>) => client.put<{ success: boolean; team: Team }>(`/teams/${id}`, data),
    delete: (id: string) => client.delete(`/teams/${id}`),
    addMember: (id: string, userId: string, role: string) => client.post(`/teams/${id}/members`, { userId, role }),
    removeMember: (id: string, userId: string) => client.delete(`/teams/${id}/members/${userId}`)
  },
  sprints: {
    list: (projectId?: string) => client.get<{ success: boolean; sprints: Sprint[] }>('/sprints', { params: { projectId } }),
    getById: (id: string) => client.get<{ success: boolean; sprint: Sprint }>(`/sprints/${id}`),
    create: (data: Partial<Sprint>) => client.post<{ success: boolean; sprint: Sprint }>('/sprints', data),
    update: (id: string, data: Partial<Sprint>) => client.put<{ success: boolean; sprint: Sprint }>(`/sprints/${id}`, data),
    delete: (id: string) => client.delete(`/sprints/${id}`)
  },
  stories: {
    list: (params?: { projectId?: string; sprintId?: string }) =>
      client.get<{ success: boolean; stories: UserStory[] }>('/stories', { params }),
    getById: (id: string) => client.get<{ success: boolean; story: UserStory }>(`/stories/${id}`),
    create: (data: Partial<UserStory>) => client.post<{ success: boolean; story: UserStory }>('/stories', data),
    update: (id: string, data: Partial<UserStory>) => client.put<{ success: boolean; story: UserStory }>(`/stories/${id}`, data),
    delete: (id: string) => client.delete(`/stories/${id}`)
  },
  tasks: {
    list: (params?: { projectId?: string; sprintId?: string; status?: string; assignedTo?: string }) =>
      client.get<{ success: boolean; tasks: Task[] }>('/tasks', { params }),
    getById: (id: string) => client.get<{ success: boolean; task: Task }>(`/tasks/${id}`),
    create: (data: Partial<Task>) => client.post<{ success: boolean; task: Task }>('/tasks', data),
    update: (id: string, data: Partial<Task>) => client.put<{ success: boolean; task: Task }>(`/tasks/${id}`, data),
    updateStatus: (id: string, status: string) =>
      client.patch<{ success: boolean; task: Task; projectProgress: number }>(`/tasks/${id}/status`, { status }),
    delete: (id: string) => client.delete(`/tasks/${id}`)
  },
  bugs: {
    list: (params?: { projectId?: string; status?: string; severity?: string; assignedTo?: string }) =>
      client.get<{ success: boolean; bugs: Bug[] }>('/bugs', { params }),
    getById: (id: string) => client.get<{ success: boolean; bug: Bug }>(`/bugs/${id}`),
    create: (data: Partial<Bug>) => client.post<{ success: boolean; bug: Bug }>('/bugs', data),
    update: (id: string, data: Partial<Bug>) => client.put<{ success: boolean; bug: Bug }>(`/bugs/${id}`, data),
    updateStatus: (id: string, status: string, resolution?: string) =>
      client.patch<{ success: boolean; bug: Bug }>(`/bugs/${id}/status`, { status, resolution }),
    delete: (id: string) => client.delete(`/bugs/${id}`)
  },
  dashboard: {
    getStats: (projectId?: string) =>
      client.get<{ success: boolean; stats: DashboardStats }>('/dashboard/stats', { params: { projectId } }),
    getActivities: (projectId?: string) =>
      client.get<{ success: boolean; activities: Activity[] }>('/dashboard/activities', { params: { projectId } }),
    getNotifications: () =>
      client.get<{ success: boolean; notifications: Notification[] }>('/dashboard/notifications'),
    markNotificationRead: (id: string) => client.put(`/dashboard/notifications/${id}/read`),
    markAllNotificationsRead: () => client.put('/dashboard/notifications/read-all')
  },
  github: {
    getRepository: (url?: string) =>
      client.get<{ success: boolean; repository: RepositoryDetails }>('/github/repository', { params: { url } }),
    getCommits: (url?: string) => client.get<{ success: boolean; commits: any[] }>('/github/commits', { params: { url } })
  },
  cicd: {
    listBuilds: () => client.get<{ success: boolean; pipeline: any; builds: BuildRecord[] }>('/cicd/builds'),
    triggerBuild: (data?: { branch?: string; commit?: string }) =>
      client.post<{ success: boolean; build: BuildRecord }>('/cicd/trigger', data || {})
  },
  system: {
    health: () => client.get('/health'),
    seed: () => client.post('/seed')
  }
};
